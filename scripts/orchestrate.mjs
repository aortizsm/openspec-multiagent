#!/usr/bin/env node

import { spawnSync, spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { saveCheckpoint, rollbackToCheckpoint, saveImplementationCheckpoint, rollbackImplementation, noopCheckpoint, noopRollback } from './rollback.mjs';
import {
  appendRunTelemetry,
  readRunTelemetry,
  captureTokenStats,
  getGitHead,
  getBaseRef,
  setBaseRef,
  computeChangeDiff,
  persistChangeDiff,
  computeFingerprint,
  loadGates,
  saveGate,
  validateAllGatesPass,
  agentVerdictPath,
  agentFindingsPath,
  agentBundlePath,
  changeDiffPath,
  summarizeDiff,
  findSpecMarkdownFiles,
  writeRoleBundle,
  readRoleBundle,
  buildDeveloperBundle,
  buildTestEngineerBundle,
  buildCodeReviewerBundle,
  buildSecurityReviewerBundle,
  buildVerifierBundle,
  writeVerdict,
  readVerdict,
  readScoutCache,
  writeScoutCache,
  buildAgentBundle,
  DEFAULT_RISK_GLOBS,
  matchRiskGlobs,
  getEffectiveProfile,
  matchedRiskGlobs,
  parseCoverageMap,
} from './lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const CHANGES_DIR = join(PROJECT_ROOT, 'openspec', 'changes');

const REQUIRED_DESIGN_FIELDS = ['status', 'executive_summary', 'artifacts', 'risks', 'next_recommended'];
const CONTEXT_FILES = ['proposal.md', 'design.md', 'tasks.md'];
const ORCHESTRATOR_COMMAND = 'node scripts/orchestrate.mjs';
const BUNDLE_FORMAT_VERSION = '1';
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const AGENTS = [
  'developer',
  'test-engineer',
  'code-reviewer',
  'security-reviewer',
  'verifier'
];


function printUsage() {
  console.log(`
Usage: node scripts/orchestrate.mjs <change-name> [options]

Options:
  --dry-run          Show the execution plan without running
  --help             Show this help message

Pipeline: developer → test-engineer → [code-reviewer ∥ security-reviewer ∥ verifier] → join → ledger gate → validate → archive
After all pass: openspec validate <change> && openspec archive <change> --yes
`);
}

function isResumeOption(argument) {
  return argument === '--from' || argument.startsWith('--from=');
}

function rejectResumeOptions(args) {
  if (!args.some(isResumeOption)) {
    return;
  }
  console.error('Error: --from has been removed.');
  printFullPipelineRestart();
  process.exit(1);
}

function hasHelpOption(args) {
  return args.includes('--help') || args.includes('-h');
}

function parseChangeOptions(args) {
  const changeName = args.find(arg => !arg.startsWith('--'));
  if (!changeName) {
    console.error('Error: Change name is required');
    printUsage();
    process.exit(1);
  }
  return { changeName, dryRun: args.includes('--dry-run') };
}

function parseArgs() {
  const args = process.argv.slice(2);
  rejectResumeOptions(args);
  if (hasHelpOption(args)) {
    printUsage();
    process.exit(0);
  }
  return parseChangeOptions(args);
}

function printFullPipelineRestart(changeName = '<change-name>') {
  console.error(`Restart the full pipeline with: ${ORCHESTRATOR_COMMAND} ${changeName}`);
}

function validateChangeName(changeName) {
  const validNamePattern = /^[a-z0-9_-]+$/;
  if (!validNamePattern.test(changeName)) {
    throw new Error(
      `Invalid change name "${changeName}". Only [a-z0-9_-] characters are allowed`
    );
  }
}

function runCommand(command, args, options = {}) {
  const env = {
    ...process.env,
    OPENCODE_NON_INTERACTIVE: '1',
    ...options.env
  };
  const spawnResult = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    env,
    stdio: 'inherit',
    ...options
  });
  return spawnResult;
}

function loadOpenSpecConfig(changeName) {
  const configPath = join(CHANGES_DIR, changeName, '.openspec.yaml');
  if (!existsSync(configPath)) {
    return {};
  }
  const config = {};
  const content = readFileSync(configPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (match) {
      const rawKey = match[1].trim();
      // OpenSpec 1.14.3 only accepts tool metadata under an `x-` prefix; accept
      // both spellings by normalizing `x-correction_rounds` -> `correction_rounds`.
      const key = rawKey.startsWith('x-') ? rawKey.slice(2) : rawKey;
      config[key] = match[2].trim();
    }
  }
  return config;
}

/** Agent DAG for each pipeline profile. */
const PROFILE_DAGS = {
  lite: { sequential: ['developer'], parallel: ['code-reviewer', 'verifier'] },
  standard: { sequential: ['developer', 'test-engineer'], parallel: ['code-reviewer', 'security-reviewer', 'verifier'] },
  strict: { sequential: ['developer', 'test-engineer'], parallel: ['code-reviewer', 'security-reviewer', 'verifier'] },
};

/** Parse a `risk_globs` config value (JSON array or comma list), defaulting to the built-in globs. */
function parseRiskGlobsValue(raw) {
  if (!raw) return DEFAULT_RISK_GLOBS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
  } catch {
    // not JSON; fall through to comma-separated parsing
  }
  const parts = raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((part) => part.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  return parts.length > 0 ? parts : DEFAULT_RISK_GLOBS;
}

function designGate(changeName) {
  const changeDir = join(CHANGES_DIR, changeName);
  const openSpecConfig = loadOpenSpecConfig(changeName);
  const skipSpecs = openSpecConfig.skip_specs === 'true';

  if (!existsSync(changeDir)) {
    throw new Error(
      `Design gate failed: change directory "${changeDir}" does not exist. Create the change before running the orchestrator.`
    );
  }

  for (const fileName of CONTEXT_FILES) {
    const filePath = join(changeDir, fileName);
    if (!existsSync(filePath)) {
      throw new Error(
        `Design gate failed: required file "${filePath}" is missing.`
      );
    }
  }

  if (!skipSpecs) {
    const hasSpec = findSpecMarkdownFiles(join(changeDir, 'specs')).length > 0;
    if (!hasSpec) {
      throw new Error(
        `Design gate failed: no spec files found in "${join(changeDir, 'specs')}". At least one spec.md is required.`
      );
    }
  }

  validateDesignFields(changeDir);
  validateProposalSections(changeDir);
}

function validateProposalSections(changeDir) {
  const proposalPath = join(changeDir, 'proposal.md');
  const proposalContent = readFileSync(proposalPath, 'utf8');
  const requiredSections = ['Intent', 'Why', 'What Changes'];
  for (const section of requiredSections) {
    const sectionPattern = new RegExp(`^## ${section}`, 'm');
    if (!sectionPattern.test(proposalContent)) {
      throw new Error(
        `Design gate failed: proposal.md is missing required section "## ${section}".`
      );
    }
  }
}

function validateDesignFields(changeDir) {
  const designPath = join(changeDir, 'design.md');
  const designContent = readFileSync(designPath, 'utf8');
  for (const field of REQUIRED_DESIGN_FIELDS) {
    const fieldPattern = new RegExp(`^## ${field}`, 'm');
    if (!fieldPattern.test(designContent)) {
      throw new Error(
        `Design gate failed: design.md is missing required field "## ${field}".`
      );
    }
  }
}

/** Split a markdown table row into trimmed cells, dropping the empty edges. */
function parseLedgerCells(line) {
  const parts = line.split('|');
  if (parts.length > 0 && parts[0].trim() === '') parts.shift();
  if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
  return parts.map(cell => cell.trim());
}

/** True when a row is the ledger header (needs `id`, `severity`, `status` columns). */
function isLedgerHeader(line) {
  const columns = parseLedgerCells(line).map(cell => cell.toLowerCase());
  return columns.length >= 3
    && columns[0] === 'id'
    && columns.includes('severity')
    && columns.includes('status');
}

/**
 * Parse the Review Findings ledger from tasks.md.
 * Returns the header flag, the column names, and the data rows as cell arrays.
 */
function parseReviewLedgerContent(tasksContent) {
  const lines = tasksContent.split('\n');
  let headerFound = false;
  let columns = [];
  const rows = [];
  for (const line of lines) {
    if (!line.startsWith('|')) {
      if (headerFound) break;
      continue;
    }
    if (/^\|[\s:|-]+\|$/.test(line)) continue; // separator row
    if (!headerFound && isLedgerHeader(line)) {
      headerFound = true;
      columns = parseLedgerCells(line).map(cell => cell.toLowerCase());
      continue;
    }
    if (headerFound) {
      rows.push(parseLedgerCells(line));
    }
  }
  return { headerFound, columns, rows };
}

export { designGate, validateProposalSections, parseReviewLedgerContent };

function injectContextBundle(changeName, agent) {
  const changeDir = join(CHANGES_DIR, changeName);
  const bundleParts = [];

  for (const fileName of CONTEXT_FILES) {
    const filePath = join(changeDir, fileName);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8');
      bundleParts.push(`### ${fileName}\n${content}`);
    }
  }

  const specsDir = join(changeDir, 'specs');
  if (existsSync(specsDir)) {
    const specFiles = findSpecMarkdownFiles(specsDir);
    for (const specFile of specFiles) {
      const content = readFileSync(specFile, 'utf8');
      bundleParts.push(`### ${specFile}\n${content}`);
    }
  }

  const gitDiff = readGitDiff();
  if (gitDiff.trim().length > 0) {
    bundleParts.push(`### git diff\n${gitDiff}`);
  }

  return bundleParts.join('\n\n');
}


function readGitDiff() {
  try {
    return execFileSync('git', ['diff'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    });
  } catch (error) {
    console.error(`Warning: could not read git diff: ${error.message}`);
    return '';
  }
}

/** Read agent definition file for fingerprinting. */
function readAgentDefinition(agent) {
  const paths = [
    join(PROJECT_ROOT, 'opencode', 'agents', `${agent}.md`),
    join(PROJECT_ROOT, '.opencode', 'agents', `${agent}.md`),
  ];
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  return '';
}

/** Get resolved model ID for an agent (from OpenCode config or default). */
function getResolvedModelId(agent) {
  // Try to read from opencode config
  try {
    const configPaths = [
      join(PROJECT_ROOT, '.opencode', 'opencode.json'),
      join(PROJECT_ROOT, '.opencode', 'opencode.jsonc'),
    ];
    for (const p of configPaths) {
      if (existsSync(p)) {
        const content = readFileSync(p, 'utf8');
        const data = JSON.parse(content.replace(/\/\/.*$/gm, ''));
        if (data.models?.agents?.[agent]?.model) {
          return data.models.agents[agent].model;
        }
      }
    }
  } catch {
    // ignore
  }
  return `default-${agent}`;
}

/** Compute fingerprint for a gate. */
async function computeGateFingerprint(changeName, agent) {
  const changeDir = join(CHANGES_DIR, changeName);
  const baseRef = getBaseRef(changeName) || '';
  const diff = readFileSync(changeDiffPath(changeName), 'utf8');
  const proposal = readFileSync(join(changeDir, 'proposal.md'), 'utf8');
  const design = readFileSync(join(changeDir, 'design.md'), 'utf8');
  const tasks = readFileSync(join(changeDir, 'tasks.md'), 'utf8');
  const specsDir = join(changeDir, 'specs');
  let specsContent = '';
  if (existsSync(specsDir)) {
    const specFiles = findSpecMarkdownFiles(specsDir);
    for (const specFile of specFiles) {
      specsContent += readFileSync(specFile, 'utf8');
    }
  }
  const agentDef = readAgentDefinition(agent);
  const modelId = getResolvedModelId(agent);

  return computeFingerprint([
    baseRef,
    diff,
    proposal,
    design,
    tasks,
    specsContent,
    agentDef,
    modelId,
    BUNDLE_FORMAT_VERSION,
  ]);
}

/** Check if gate should be skipped (has PASS with matching fingerprint). */
function shouldSkipGate(changeName, agent, currentFingerprint) {
  const { gates } = loadGates(changeName);
  const gate = gates[agent];
  return gate && gate.verdict === 'PASS' && gate.fingerprint === currentFingerprint;
}

/** Check ledger gate: returns {blocked: boolean, findings: []}. */
function checkLedgerGate(changeName) {
  const changeDir = join(CHANGES_DIR, changeName);
  const tasksPath = join(changeDir, 'tasks.md');
  if (!existsSync(tasksPath)) return { blocked: false, findings: [] };
  const tasksContent = readFileSync(tasksPath, 'utf8');
  const { headerFound, columns, rows } = parseReviewLedgerContent(tasksContent);
  if (!headerFound) return { blocked: false, findings: [] };
  const severityIndex = columns.indexOf('severity');
  const statusIndex = columns.indexOf('status');
  const evidenceIndex = columns.indexOf('evidence');
  if (severityIndex < 0 || statusIndex < 0) return { blocked: false, findings: [] };
  const blockedFindings = [];
  for (const cells of rows) {
    const severity = (cells[severityIndex] || '').toUpperCase();
    const status = (cells[statusIndex] || 'open').toLowerCase();
    const evidence = evidenceIndex >= 0 ? (cells[evidenceIndex] || '').trim() : '';
    if (severity !== 'CRITICAL' && severity !== 'WARNING') continue;
    if (status === 'open') blockedFindings.push({ severity, cells, reason: 'open' });
    else if (status === 'resolved' && evidence === '') {
      blockedFindings.push({ severity, cells, reason: 'resolved without evidence' });
    }
  }
  return { blocked: blockedFindings.length > 0, findings: blockedFindings };
}

/** Parse verdict JSON from agent output. */
async function readAgentVerdict(changeName, agent) {
  const path = agentVerdictPath(changeName, agent);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** Write findings for a failed verdict. */
function writeAgentFindings(changeName, agent, verdict) {
  const path = agentFindingsPath(changeName, agent);
  const findings = verdict.findings || [];
  const content = JSON.stringify({ agent, findings, timestamp: new Date().toISOString() }, null, 2);
  const { mkdirSync, writeFileSync } = require('node:fs');
  const { dirname } = require('node:path');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** Run a single agent with timeout and fingerprint check. */
async function runAgentWithGate(changeName, agent, telemetryInvocation, gateStartTime) {
  const gateName = agent;
  const fingerprint = await computeGateFingerprint(changeName, agent);

  // Check if gate can be skipped
  if (shouldSkipGate(changeName, agent, fingerprint)) {
    console.log(`⏭️  ${agent}: SKIPPED (fingerprint match)`);
    const wallMs = Date.now() - gateStartTime;
    telemetryInvocation.gates.push({
      gate: gateName,
      attempts: 0,
      wall_ms: wallMs,
      exit_code: 0,
      verdict: 'PASS',
      fingerprint,
      skipped: true,
      bundle_bytes: 0,
      tokens: null,
    });
    return { skipped: true, verdict: 'PASS' };
  }

  console.log(`\n=== Running ${agent} for change "${changeName}" ===`);
  const agentStartTime = Date.now();
  const bundlePath = agentBundlePath(changeName, agent);

  // Spawn agent with timeout - pass bundle path via stdin
  const timeoutMs = parseInt(process.env.ORCHESTRATOR_TIMEOUT_MS, 10) || DEFAULT_TIMEOUT_MS;
  const child = spawn(
    'opencode',
    ['run', '--agent', agent, '--', changeName],
    {
      cwd: PROJECT_ROOT,
      env: buildAgentEnv(changeName, agent),
      stdio: ['pipe', 'inherit', 'inherit'],
    }
  );

  // Send bundle and verdict paths to the agent via stdin
  const verdictPath = agentVerdictPath(changeName, agent);
  child.stdin.write(`Change: ${changeName}. Context bundle: ${bundlePath}. Read it first. Write your verdict JSON to: ${verdictPath}
`);
  child.stdin.end();

  let timedOut = false;
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
  }, timeoutMs);

  const exitCode = await new Promise((resolve) => {
    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      resolve(code);
    });
    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      resolve(-1);
    });
  });

  const wallMs = Date.now() - agentStartTime;
  const telemetryTokens = await captureTokenStats();

  // Transport failure: exit code != 0 and no verdict artifact
  const transportFailure = exitCode !== 0;
  let verdict = null;

  if (!transportFailure) {
    verdict = await readAgentVerdict(changeName, agent);
  }

  const gateResult = {
    gate: gateName,
    attempts: 1,
    wall_ms: wallMs,
    exit_code: exitCode,
    verdict: verdict?.verdict || (transportFailure ? 'TRANSPORT_FAILURE' : 'UNKNOWN'),
    fingerprint,
    skipped: false,
    bundle_bytes: 0,
    tokens: telemetryTokens,
  };

  if (transportFailure) {
    console.error(`\n❌ ${agent}: TRANSPORT FAILURE (exit code ${exitCode})`);
    telemetryInvocation.gates.push(gateResult);
    return { transportFailure: true, exitCode };
  }

  if (!verdict) {
    console.error(`\n❌ ${agent}: NO VERDICT ARTIFACT`);
    gateResult.verdict = 'NO_VERDICT';
    telemetryInvocation.gates.push(gateResult);
    return { transportFailure: true, exitCode: -1 };
  }

  if (verdict.verdict === 'FAIL') {
    console.error(`\n❌ ${agent}: VERDICT FAIL`);
    writeAgentFindings(changeName, agent, verdict);
    gateResult.findings_count = verdict.findings?.length || 0;
    telemetryInvocation.gates.push(gateResult);
    return { verdictFailure: true, verdict };
  }

  if (verdict.verdict === 'UNVERIFIABLE') {
    console.error(`\n⚠️  ${agent}: UNVERIFIABLE`);
    gateResult.verdict = 'UNVERIFIABLE';
    telemetryInvocation.gates.push(gateResult);
    return { unverifiable: true, verdict };
  }

  // PASS
  console.log(`✅ ${agent}: PASS`);
  saveGate(changeName, gateName, 'PASS', fingerprint, agentVerdictPath(changeName, agent));
  telemetryInvocation.gates.push(gateResult);
  return { verdict: 'PASS' };
}

/** Run agents in parallel group without killing siblings. */
async function runParallelGroupNoKill(agents, changeName, telemetryInvocation) {
  const gateStartTime = Date.now();
  console.log(`\n=== Parallel group: ${agents.join(', ')} ===`);

  const promises = agents.map(agent => runAgentWithGate(changeName, agent, telemetryInvocation, gateStartTime));
  const results = await Promise.allSettled(promises);

  const outcomes = results.map((r, i) => ({
    agent: agents[i],
    ...(r.status === 'fulfilled' ? r.value : { error: r.reason })
  }));

  return outcomes;
}

/** Run sequential agent (developer, test-engineer) with implementation checkpoint. */
async function runSequentialAgentWithCheckpoint(agent, changeName, telemetryInvocation) {
  const gateStartTime = Date.now();
  saveImplementationCheckpoint(agent);
  const result = await runAgentWithGate(changeName, agent, telemetryInvocation, gateStartTime);
  if (result.transportFailure || result.verdictFailure || result.unverifiable) {
    rollbackImplementation(agent);
  }
  return result;
}

async function main() {
  const { changeName, dryRun } = parseArgs();
  validateChangeName(changeName);
  designGate(changeName);

  if (dryRun) {
    runDryRun(changeName);
    return;
  }

  // Load declared profile and configurable risk globs
  const openSpecConfig = loadOpenSpecConfig(changeName);
  const declaredProfile = openSpecConfig.pipeline || 'standard';
  const riskGlobs = parseRiskGlobsValue(openSpecConfig.risk_globs);

  // Load or create telemetry invocation record
  const invocationId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const telemetryInvocation = {
    invocation_id: invocationId,
    profile: declaredProfile,
    timestamp: new Date().toISOString(),
    gates: [],
  };

  // Capture base_ref on first run
  let baseRef = getBaseRef(changeName);
  if (!baseRef) {
    baseRef = await getGitHead();
    if (baseRef) {
      setBaseRef(changeName, baseRef);
      console.log(`📌 Base ref recorded: ${baseRef.slice(0, 8)}`);
    }
  }

  // Compute and persist change diff
  let diffContent = '';
  if (baseRef) {
    diffContent = await computeChangeDiff(baseRef);
    persistChangeDiff(changeName, diffContent);
    console.log(`📝 Change diff persisted (${diffContent.length} chars)`);
  }

  // Risk-based escalation: a risk-path diff escalates standard -> strict and is a
  // hard error for lite (no agents then run).
  const effectiveProfile = getEffectiveProfile(declaredProfile, diffContent, riskGlobs);
  if (effectiveProfile !== declaredProfile) {
    const escalGlobs = matchedRiskGlobs(diffContent, riskGlobs);
    telemetryInvocation.profile_escalated = true;
    telemetryInvocation.original_profile = declaredProfile;
    telemetryInvocation.matched_globs = escalGlobs;
    telemetryInvocation.profile = effectiveProfile;
    console.log(`⬆️  Profile escalated: ${declaredProfile} → ${effectiveProfile} (risk: ${escalGlobs.join(', ')})`);
  }

  console.log(`\n🚀 Starting orchestration for change "${changeName}" (profile: ${effectiveProfile})`);

  // DAG composition per effective profile
  const dag = PROFILE_DAGS[effectiveProfile] || PROFILE_DAGS.standard;
  let sequentialAgents = [...dag.sequential];
  const parallelAgents = [...dag.parallel];

  // Gap-filler: the standard profile omits test-engineer when the coverage map
  // reports full coverage.
  if (effectiveProfile === 'standard' && sequentialAgents.includes('test-engineer')) {
    const tasksFilePath = join(CHANGES_DIR, changeName, 'tasks.md');
    const coverage = existsSync(tasksFilePath)
      ? parseCoverageMap(readFileSync(tasksFilePath, 'utf8'))
      : { found: false, allCovered: false, covered: 0, gaps: [] };
    if (coverage.found && coverage.allCovered) {
      sequentialAgents = sequentialAgents.filter(agent => agent !== 'test-engineer');
      telemetryInvocation.test_engineer_skipped = true;
      telemetryInvocation.test_engineer_skip_reason = 'full_coverage';
      console.log('⏭️  test-engineer skipped (full coverage)');
    }
  }

  // Run sequential agents
  for (const agent of sequentialAgents) {
    const result = await runSequentialAgentWithCheckpoint(agent, changeName, telemetryInvocation);
    if (result.transportFailure) {
      // Transport failure: 1 retry
      console.log(`🔄 Retrying ${agent} (transport failure)...`);
      const retryResult = await runSequentialAgentWithCheckpoint(agent, changeName, telemetryInvocation);
      if (retryResult.transportFailure) {
        throw new Error(`Agent "${agent}" failed after retry. Restart the full pipeline with: node scripts/orchestrate.mjs ${changeName}`);
      }
    } else if (result.verdictFailure) {
      // Verdict FAIL: route to developer for fix cycle (max 3)
      // For now, escalate immediately (fix cycles handled by re-running orchestrator)
      throw new Error(`Agent "${agent}" verdict FAIL - fix required. Restart the full pipeline with: node scripts/orchestrate.mjs ${changeName}`);
    } else if (result.unverifiable) {
      throw new Error(`Agent "${agent}" UNVERIFIABLE. Restart the full pipeline with: node scripts/orchestrate.mjs ${changeName}`);
    }
  }

  // Run parallel group
  const parallelOutcomes = await runParallelGroupNoKill(parallelAgents, changeName, telemetryInvocation);

  // Check for any failures in parallel group
  const parallelFailures = parallelOutcomes.filter(o =>
    o.transportFailure || o.verdictFailure || o.unverifiable
  );

  if (parallelFailures.length > 0) {
    // Consolidate findings from all (including successful ones)
    console.error('\n❌ Parallel group had failures. Consolidating findings...');
    for (const outcome of parallelOutcomes) {
      if (outcome.verdictFailure) {
        console.error(`  - ${outcome.agent}: ${outcome.verdict.verdict} (${outcome.verdict.findings?.length || 0} findings)`);
      }
    }
    throw new Error(`Parallel group failed - fix required. Restart the full pipeline with: node scripts/orchestrate.mjs ${changeName}`);
  }

  // Ledger gate
  console.log('\n🔍 Checking ledger gate...');
  const ledgerResult = checkLedgerGate(changeName);
  if (ledgerResult.blocked) {
    console.error('❌ Ledger gate BLOCKED: open CRITICAL/WARNING findings');
    for (const f of ledgerResult.findings) {
      console.error(`  - ${f.severity}: ${JSON.stringify(f.cells)}`);
    }
    throw new Error('Ledger gate blocked - resolve findings before archive');
  }
  console.log('✅ Ledger gate passed');

  // Validate all gates current PASS
  const requiredGates = [...sequentialAgents, ...parallelAgents];
  const currentFingerprints = {};
  for (const agent of requiredGates) {
    currentFingerprints[agent] = await computeGateFingerprint(changeName, agent);
  }
  const gatesValidation = validateAllGatesPass(changeName, requiredGates, currentFingerprints);
  if (!gatesValidation.ok) {
    throw new Error(`Gate validation failed: ${gatesValidation.missing ? `missing ${gatesValidation.missing}` : `stale ${gatesValidation.stale}`}`);
  }

  // Persist telemetry
  appendRunTelemetry(changeName, telemetryInvocation);

  // Post steps
  runOpenspecValidate(changeName);
  runOpenspecArchive(changeName);

  console.log(`\n🎉 Change "${changeName}" successfully archived!`);
}

function runDryRun(changeName) {
  const declaredProfile = loadOpenSpecConfig(changeName).pipeline || 'standard';
  const profile = PROFILE_DAGS[declaredProfile] ? declaredProfile : 'standard';
  const dag = PROFILE_DAGS[profile];
  console.log(`\n📋 Execution plan for change "${changeName}" (profile: ${profile}):`);
  dag.sequential.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent} (sequential)`);
  });
  const parallelLabel = profile === 'lite'
    ? 'code-reviewer (unified clean-code + security)'
    : dag.parallel.join(' ∥ ');
  const step = dag.sequential.length + 1;
  console.log(`  ${step}. ${parallelLabel} (parallel)`);
  console.log(`  ${step + 1}. Ledger gate`);
  console.log(`  ${step + 2}. Gate validation (fingerprint)`);
  console.log(`  ${step + 3}. openspec validate ${changeName}`);
  console.log(`  ${step + 4}. openspec archive ${changeName} --yes`);
  console.log('\nDry run complete. Run without --dry-run to execute.');
}

function runOpenspecValidate(changeName) {
  console.log(`\n=== Running openspec validate ===`);
  const validateResult = runCommand('npx', ['openspec', 'validate', changeName, '--strict']);
  if (validateResult.status !== 0) {
    console.error(`\n❌ openspec validate failed with exit code ${validateResult.status}`);
    process.exit(validateResult.status || 1);
  }
  console.log(`✅ openspec validate passed`);
}

function runOpenspecArchive(changeName) {
  console.log(`\n=== Running openspec archive ===`);
  const archiveResult = runCommand('npx', ['openspec', 'archive', changeName, '--yes']);
  if (archiveResult.status !== 0) {
    console.error(`\n❌ openspec archive failed with exit code ${archiveResult.status}`);
    process.exit(archiveResult.status || 1);
  }
  console.log(`✅ openspec archive completed`);
}

function buildAgentEnv(changeName, agent) {
  const bundle = buildAgentBundle(changeName, agent);
  writeRoleBundle(changeName, agent, bundle);
  return {
    ...process.env,
    OPENCODE_NON_INTERACTIVE: '1',
    OPENCODE_CONTEXT_BUNDLE: bundle,
  };
}


if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
