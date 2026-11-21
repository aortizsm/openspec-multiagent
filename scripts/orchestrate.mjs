#!/usr/bin/env node

import {
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
  agentBundlePath, spawnSync, spawn, execFileSync } from 'node:child_process';
import {
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
  agentBundlePath, fileURLToPath } from 'node:url';
import {
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
  agentBundlePath, dirname, join } from 'node:path';
import {
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
  agentBundlePath, existsSync, readFileSync } from 'node:fs';
import {
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
  agentBundlePath, saveCheckpoint, rollbackToCheckpoint, saveImplementationCheckpoint, rollbackImplementation, noopCheckpoint, noopRollback } from './rollback.mjs';
import {
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
  agentBundlePath,
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
} from './lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const CHANGES_DIR = join(PROJECT_ROOT, 'openspec', 'changes');

const AGENTS = [
  'developer',
  'test-engineer',
  'code-reviewer',
  'security-reviewer',
  'verifier'
];

const REQUIRED_DESIGN_FIELDS = ['status', 'executive_summary', 'artifacts', 'risks', 'next_recommended'];
const CONTEXT_FILES = ['proposal.md', 'design.md', 'tasks.md'];
const ORCHESTRATOR_COMMAND = 'node scripts/orchestrate.mjs';
const BUNDLE_FORMAT_VERSION = '1';
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

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
      config[match[1].trim()] = match[2].trim();
    }
  }
  return config;
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

function isLedgerHeader(line) {
  const columns = line.split('|').map(c => c.trim().toLowerCase());
  return columns.length >= 9
    && columns[0] === 'id'
    && columns[2] === 'severity'
    && columns.some(c => c.includes('evidence'))
    && columns.some(c => c === 'status');
}

function readLedgerSectionWithoutHeader(sectionLines) {
  const tableRows = sectionLines.filter(
    line => line.startsWith('|') && line.endsWith('|')
  );
  if (tableRows.length > 0) {
    throw new Error('Review Findings section has no valid ledger table in tasks.md.');
  }
  return { exists: true, rows: [] };
}

export { designGate, validateProposalSections };

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

function findSpecMarkdownFiles(specsDir) {
  const results = [];
  try {
    const entries = execFileSync('find', [specsDir, '-name', 'spec.md', '-type', 'f'], {
      encoding: 'utf8',
    }).trim().split('\n').filter(Boolean);
    for (const entry of entries) {
      results.push(entry);
    }
  } catch (error) {
    console.error(`Warning: could not list spec files: ${error.message}`);
  }
  return results;
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
  const { headerFound, rows } = parseReviewLedgerContent(tasksContent);
  if (!headerFound) return { blocked: false, findings: [] };
  const blockedFindings = [];
  for (const cells of rows) {
    if (cells.length >= 3) {
      const severity = cells[2].toUpperCase();
      const status = cells.length >= 8 ? cells[7].toLowerCase() : 'open';
      if ((severity === 'CRITICAL' || severity === 'WARNING') && status === 'open') {
        blockedFindings.push({ severity, cells });
      }
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

  // Spawn agent with timeout
  const timeoutMs = parseInt(process.env.ORCHESTRATOR_TIMEOUT_MS, 10) || DEFAULT_TIMEOUT_MS;
  const child = spawn(
      'opencode',
      ['run', '--agent', agent, '--', changeName],
      {
        cwd: PROJECT_ROOT,
        env: buildAgentEnv(changeName, agent),
        stdio: 'inherit',
      }
    );
    'opencode',
    ['run', '--agent', agent, '--', changeName],
    {
      cwd: PROJECT_ROOT,
      env: buildAgentEnv(changeName, agent),
      stdio: 'inherit',
    }
  );

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

  // Load or create telemetry invocation record
  const invocationId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const profile = loadOpenSpecConfig(changeName).pipeline || 'standard';
  const telemetryInvocation = {
    invocation_id: invocationId,
    profile,
    timestamp: new Date().toISOString(),
    gates: [],
  };

  console.log(`\n🚀 Starting orchestration for change "${changeName}" (profile: ${profile})`);

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
  if (baseRef) {
    const diff = await computeChangeDiff(baseRef);
    persistChangeDiff(changeName, diff);
    console.log(`📝 Change diff persisted (${diff.length} chars)`);
  }

  // New DAG: developer → test-engineer → [code-reviewer ∥ security-reviewer ∥ verifier] → join → ledger → validate → archive
  const sequentialAgents = ['developer', 'test-engineer'];
  const parallelAgents = ['code-reviewer', 'security-reviewer', 'verifier'];

  // Run sequential agents
  for (const agent of sequentialAgents) {
    const result = await runSequentialAgentWithCheckpoint(agent, changeName, telemetryInvocation);
    if (result.transportFailure) {
      // Transport failure: 1 retry
      console.log(`🔄 Retrying ${agent} (transport failure)...`);
      const retryResult = await runSequentialAgentWithCheckpoint(agent, changeName, telemetryInvocation);
      if (retryResult.transportFailure) {
        throw new Error(`Agent "${agent}" failed after retry`);
      }
    } else if (result.verdictFailure) {
      // Verdict FAIL: route to developer for fix cycle (max 3)
      // For now, escalate immediately (fix cycles handled by re-running orchestrator)
      throw new Error(`Agent "${agent}" verdict FAIL - fix required`);
    } else if (result.unverifiable) {
      throw new Error(`Agent "${agent}" UNVERIFIABLE`);
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
    throw new Error('Parallel group failed - fix required');
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
  console.log(`\n📋 Execution plan for change "${changeName}":`);
  console.log('  1. developer (sequential)');
  console.log('  2. test-engineer (sequential)');
  console.log('  3. code-reviewer ∥ security-reviewer ∥ verifier (parallel)');
  console.log('  4. Ledger gate');
  console.log('  5. Gate validation (fingerprint)');
  console.log(`  6. openspec validate ${changeName}`);
  console.log(`  7. openspec archive ${changeName} --yes`);
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
  const bundle = injectContextBundle(changeName, agent);
  return {
    ...process.env,
    OPENCODE_NON_INTERACTIVE: '1',
    OPENCODE_CONTEXT_BUNDLE: bundle,
  };
}

function changeDiffPath(changeName) {
  const runDir = join(PROJECT_ROOT, '.opencode', 'run', changeName);
  return join(runDir, 'change.diff');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
