#!/usr/bin/env node

import { spawnSync, spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { saveCheckpoint, rollbackToCheckpoint } from './rollback.mjs';

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

const MAX_RETRIES = 3;
const REQUIRED_DESIGN_FIELDS = ['status', 'executive_summary', 'artifacts', 'risks', 'next_recommended'];
const CONTEXT_FILES = ['proposal.md', 'design.md', 'tasks.md'];
const ORCHESTRATOR_COMMAND = 'node scripts/orchestrate.mjs';

const failureCounts = new Map();

function printUsage() {
  console.log(`
Usage: node scripts/orchestrate.mjs <change-name> [options]

Options:
  --dry-run          Show the execution plan without running
  --help             Show this help message

Pipeline: developer → test-engineer → [code-reviewer + security-reviewer] → verifier
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

function getFailureCount(changeName, agent) {
  return failureCounts.get(`${changeName}:${agent}`) || 0;
}

function incrementFailureCount(changeName, agent) {
  const key = `${changeName}:${agent}`;
  const current = failureCounts.get(key) || 0;
  failureCounts.set(key, current + 1);
}

function resetFailureCounts(changeName) {
  for (const key of failureCounts.keys()) {
    if (key.startsWith(`${changeName}:`)) {
      failureCounts.delete(key);
    }
  }
}

function hasExceededMaxRetries(changeName, agent) {
  return getFailureCount(changeName, agent) >= MAX_RETRIES;
}

function buildAgentEnv(changeName, agent) {
  const bundle = injectContextBundle(changeName, agent);
  return {
    ...process.env,
    OPENCODE_NON_INTERACTIVE: '1',
    OPENCODE_CONTEXT_BUNDLE: bundle,
  };
}

function runAgent(agent, changeName) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n=== Running ${agent} for change "${changeName}" (attempt ${attempt}/${MAX_RETRIES}) ===`);

    const agentResult = runCommand('npx', ['opencode', 'run', '-a', agent, '--', changeName], {
      env: buildAgentEnv(changeName, agent),
    });

    if (agentResult.status === 0) {
      console.log(`✅ ${agent} completed successfully`);
      return;
    }

    incrementFailureCount(changeName, agent);
    lastError = new Error(`Agent "${agent}" failed with exit code ${agentResult.status}`);
    console.error(`\n❌ Agent "${agent}" failed with exit code ${agentResult.status} (retry ${getFailureCount(changeName, agent)}/${MAX_RETRIES})`);
    printFullPipelineRestart(changeName);
    if (getFailureCount(changeName, agent) >= MAX_RETRIES) {
      const escalationMsg = `Agent "${agent}" exceeded ${MAX_RETRIES} retries for change "${changeName}". Escalating to architect.`;
      console.error(`\n❌ ${escalationMsg}`);
      throw new Error(escalationMsg);
    }
  }
  throw lastError || new Error(`Agent "${agent}" failed after ${MAX_RETRIES} attempts`);
}

function spawnAgent(agent, changeName) {
  console.log(`\n=== Running ${agent} for change "${changeName}" ===`);
  return spawn(
    'npx',
    ['opencode', 'run', '-a', agent, '--', changeName],
    {
      cwd: PROJECT_ROOT,
      env: buildAgentEnv(changeName, agent),
      stdio: 'inherit',
    }
  );
}

function waitForAgent(child, agent, changeName) {
  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code !== 0) {
        incrementFailureCount(changeName, agent);
        console.error(`\n❌ Agent "${agent}" failed with exit code ${code}`);
        printFullPipelineRestart(changeName);
        reject(new Error(`Agent "${agent}" failed with exit code ${code}`));
        return;
      }
      console.log(`✅ ${agent} completed successfully`);
      resolve();
    });
    child.on('error', (err) => {
      incrementFailureCount(changeName, agent);
      reject(err);
    });
  });
}

function runAgentAsync(agent, changeName) {
  const child = spawnAgent(agent, changeName);
  return waitForAgent(child, agent, changeName);
}

async function runAgentAsyncWithRetry(agent, changeName) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await runAgentAsync(agent, changeName);
      return;
    } catch (error) {
      lastError = error;
      console.error(`\n❌ Agent "${agent}" failed (attempt ${attempt}/${MAX_RETRIES})`);
      printFullPipelineRestart(changeName);
      if (attempt >= MAX_RETRIES) {
        const escalationMsg = `Agent "${agent}" exceeded ${MAX_RETRIES} retries for change "${changeName}". Escalating to architect.`;
        console.error(`\n❌ ${escalationMsg}`);
        throw new Error(escalationMsg);
      }
    }
  }
  throw lastError || new Error(`Agent "${agent}" failed after ${MAX_RETRIES} attempts`);
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

function loadOpenSpecConfig(changeName) {
  const configPath = join(CHANGES_DIR, changeName, '.openspec.yaml');
  if (!existsSync(configPath)) {
    return {};
  }
  const config = {};
  const content = readFileSync(configPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([\w]+):\s*(.*)$/);
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

  // 1. El directorio del change debe existir.
  if (!existsSync(changeDir)) {
    throw new Error(
      `Design gate failed: change directory "${changeDir}" does not exist. Create the change before running the orchestrator.`
    );
  }

  // 2. proposal.md, design.md y tasks.md deben existir.
  for (const fileName of CONTEXT_FILES) {
    const filePath = join(changeDir, fileName);
    if (!existsSync(filePath)) {
      throw new Error(
        `Design gate failed: required file "${filePath}" is missing.`
      );
    }
  }

  // 3. Al menos un spec en specs/*/spec.md (salvo skip_specs: true).
  if (!skipSpecs) {
    const hasSpec = findSpecMarkdownFiles(join(changeDir, 'specs')).length > 0;
    if (!hasSpec) {
      throw new Error(
        `Design gate failed: no spec files found in "${join(changeDir, 'specs')}". At least one spec.md is required.`
      );
    }
  }

  // 4. design.md debe contener los 5 campos obligatorios.
  validateDesignFields(changeDir);

  // 5. proposal.md debe contener las secciones ## Intent, ## Why, ## What Changes.
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

async function main() {
  const { changeName, dryRun } = parseArgs();

  validateChangeName(changeName);
  designGate(changeName);
  resetFailureCounts(changeName);

  if (dryRun) {
    runDryRun(changeName);
    return;
  }

  console.log(`\n🚀 Starting orchestration for change "${changeName}"`);
  await runAgents(AGENTS, changeName);
  runPostSteps(changeName);
}

function runDryRun(changeName) {
  console.log(`\n📋 Execution plan for change "${changeName}":`);
  console.log('  1. developer');
  console.log('  2. test-engineer (sequential, after developer)');
  console.log('  3. code-reviewer + security-reviewer (parallel, after test-engineer)');
  console.log('  4. verifier (after all quality agents)');
  console.log(`  5. openspec validate ${changeName}`);
  console.log(`  6. openspec archive ${changeName} --yes`);
  console.log('\nDry run complete. Run without --dry-run to execute.');
}

async function runAgents(agentsToRun, changeName) {
  let index = 0;
  while (index < agentsToRun.length) {
    const agent = agentsToRun[index];

    if (isParallelGroupStart(agentsToRun, index)) {
      await runParallelGroup(agentsToRun, index, changeName);
      index += 2;
      continue;
    }

    await runSequentialAgent(agent, changeName);
    index += 1;
  }
}

function isParallelGroupStart(agentsToRun, index) {
  return (
    agentsToRun[index] === 'code-reviewer' &&
    agentsToRun[index + 1] === 'security-reviewer'
  );
}

async function runParallelGroup(agentsToRun, index, changeName) {
  const agents = [agentsToRun[index], agentsToRun[index + 1]];
  agents.forEach(agent => saveCheckpoint(agent));
  const children = agents.map(agent => spawnAgent(agent, changeName));
  try {
    await Promise.all(children.map((child, i) => waitForAgent(child, agents[i], changeName)));
  } catch (error) {
    for (const child of children) {
      if (child.exitCode === null && typeof child.kill === 'function') {
        child.kill();
      }
    }
    rollbackToCheckpoint();
    throw error;
  }
}

async function runSequentialAgent(agent, changeName) {
  try {
    saveCheckpoint(agent);
    runAgent(agent, changeName);
  } catch (error) {
    rollbackToCheckpoint();
    throw error;
  }
}

function runPostSteps(changeName) {
  runOpenspecValidate(changeName);
  runOpenspecArchive(changeName);

  console.log(`\n🎉 Change "${changeName}" successfully archived!`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
