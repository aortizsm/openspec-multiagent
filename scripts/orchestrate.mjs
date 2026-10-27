#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { saveCheckpoint, rollbackToCheckpoint } from './rollback.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

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
  --from <agent>     Resume from a specific agent (developer, test-engineer, code-reviewer, security-reviewer, verifier)
  --dry-run          Show the execution plan without running
  --help             Show this help message

Agents run in order: ${AGENTS.join(' → ')}
After all pass: openspec validate <change> && openspec archive <change> --yes
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const changeName = args.find(arg => !arg.startsWith('--'));
  const fromIndex = args.indexOf('--from');
  const fromAgent = fromIndex !== -1 ? args[fromIndex + 1] : null;
  const dryRun = args.includes('--dry-run');

  if (!changeName) {
    console.error('Error: Change name is required');
    printUsage();
    process.exit(1);
  }

  if (fromAgent && !AGENTS.includes(fromAgent)) {
    console.error(`Error: Invalid agent "${fromAgent}". Valid agents: ${AGENTS.join(', ')}`);
    process.exit(1);
  }

  return { changeName, fromAgent, dryRun };
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

function runAgent(agent, changeName) {
  console.log(`\n=== Running ${agent} for change "${changeName}" ===`);
  
  const agentResult = runCommand('npx', ['opencode', 'run', '-a', agent, '--', changeName]);
  
  if (agentResult.status !== 0) {
    const resumeCmd = `node scripts/orchestrate.mjs ${changeName} --from ${agent}`;
    console.error(`\n❌ Agent "${agent}" failed with exit code ${agentResult.status}`);
    console.error(`Resume with: ${resumeCmd}`);
    throw new Error(`Agent "${agent}" failed with exit code ${agentResult.status}`);
  }
  
  console.log(`✅ ${agent} completed successfully`);
}

function runOpenspecValidate(changeName) {
  console.log(`\n=== Running openspec validate ===`);
  const validateResult = runCommand('npx', ['openspec', 'validate', changeName]);
  
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

function main() {
  const { changeName, fromAgent, dryRun } = parseArgs();

  validateChangeName(changeName);

  let startIndex = 0;
  if (fromAgent) {
    startIndex = AGENTS.indexOf(fromAgent);
  }

  const agentsToRun = AGENTS.slice(startIndex);

  if (dryRun) {
    runDryRun(changeName, fromAgent, startIndex);
    return;
  }

  console.log(`\n🚀 Starting orchestration for change "${changeName}"`);
  if (fromAgent) {
    console.log(`Resuming from: ${fromAgent}`);
  }

  runAgents(agentsToRun, changeName);
  runPostSteps(changeName);
}

function runDryRun(changeName, fromAgent, startIndex) {
  const agentsToRun = AGENTS.slice(startIndex);

  console.log(`\n📋 Execution plan for change "${changeName}":`);
  console.log(`Starting from: ${fromAgent || AGENTS[0]}`);
  console.log('\nAgents to run:');
  agentsToRun.forEach((agent, i) => {
    console.log(`  ${startIndex + i + 1}. ${agent}`);
  });
  const validateStep = AGENTS.length + 1;
  const archiveStep = AGENTS.length + 2;
  console.log(`  ${validateStep}. openspec validate ${changeName}`);
  console.log(`  ${archiveStep}. openspec archive ${changeName} --yes`);
  console.log('\nDry run complete. Run without --dry-run to execute.');
}

function runAgents(agentsToRun, changeName) {
  for (const agent of agentsToRun) {
    try {
      saveCheckpoint(agent);
      runAgent(agent, changeName);
    } catch (error) {
      rollbackToCheckpoint();
      process.exit(1);
    }
  }
}

function runPostSteps(changeName) {
  runOpenspecValidate(changeName);
  runOpenspecArchive(changeName);

  console.log(`\n🎉 Change "${changeName}" successfully archived!`);
}

main();