#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { opencodeConfigDir, parseArgs, REPO_DIR } from "./lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const sourceDirectory = join(REPO_DIR, "opencode", "plugins", "agent-models");
const configDirectory = opencodeConfigDir();
const targetDirectory = join(configDirectory, "plugins", "agent-models");
const REQUIRED_PLUGIN_FILES = [
  "package.json",
  "index.js",
  "tui.js",
  "routing.mjs",
  "project-config.mjs",
  "model-reference.mjs",
  "secure-project-fs.mjs",
];

if (flags.has("help")) {
  console.log(`install-agent-models.mjs - Install the user-global model selector.

Options:
  --dry-run   Show what would be copied without writing anything
  --force     Overwrite an existing global plugin copy
  --help      Show this help`);
  process.exit(0);
}

if (!existsSync(sourceDirectory)) {
  console.error("ERROR: bundled agent model plugin sources are missing; reinstall the toolkit.");
  process.exit(1);
}

if (!hasRequiredPluginFiles(sourceDirectory)) {
  console.error("ERROR: bundled agent model plugin sources are incomplete; reinstall the toolkit.");
  process.exit(1);
}

const sourceFiles = collectPluginFilesSafely(sourceDirectory);
if (!sourceFiles) process.exit(1);
if (sourceFiles.length === 0) {
  console.error("ERROR: bundled agent model plugin contains no files.");
  process.exit(1);
}

if (flags.has("dry-run")) {
  console.log(`Would install ${sourceFiles.length} plugin files to ${targetDirectory}:`);
  for (const sourceFile of sourceFiles) console.log(`  ${relative(sourceDirectory, sourceFile)}`);
  process.exit(0);
}

const secureFileSystem = await loadSecureFileSystem();
const {
  closeProjectDescriptor,
  copyProjectFileAtomically,
  createProjectChildDirectory,
  openProjectDirectory,
  tryOpenProjectChildDirectory,
} = secureFileSystem;

installGlobalPlugin({
  sourceRoot: sourceDirectory,
  sourceFiles,
  targetPath: targetDirectory,
  installerFlags: flags,
  configPath: configDirectory,
});

async function loadSecureFileSystem() {
  try {
    return await import("../opencode/plugins/agent-models/secure-project-fs.mjs");
  } catch (error) {
    console.error("ERROR: race-resistant plugin file support is missing; reinstall the toolkit.");
    process.exit(1);
  }
}

function collectPluginFilesSafely(directory) {
  try {
    return collectPluginFiles(directory);
  } catch (error) {
    console.error(`ERROR: ${installerFailureMessage(error)}`);
    return undefined;
  }
}

function collectPluginFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((fileEntry) => {
    const absolutePath = join(directory, fileEntry.name);
    return fileEntry.isDirectory() ? collectPluginFiles(absolutePath) : [absolutePath];
  });
}

function hasRequiredPluginFiles(directory) {
  return REQUIRED_PLUGIN_FILES.every((fileName) => existsSync(join(directory, fileName)));
}

function installGlobalPlugin({ sourceRoot, sourceFiles, targetPath, installerFlags, configPath }) {
  let configRootDescriptor;
  try {
    verifyFileSystemSupport();
    mkdirSync(configPath, { recursive: true, mode: 0o700 });
    configRootDescriptor = openProjectDirectory(configPath);
    reportGlobalInstall(configRootDescriptor, { sourceRoot, sourceFiles, targetPath, installerFlags });
  } catch (error) {
    console.error(`ERROR: ${installerFailureMessage(error)}`);
    process.exitCode = 1;
  } finally {
    if (configRootDescriptor !== undefined) closeProjectDescriptor(configRootDescriptor);
  }
}

function verifyFileSystemSupport() {
  const workingDirectoryDescriptor = openProjectDirectory(process.cwd());
  closeProjectDescriptor(workingDirectoryDescriptor);
}

function reportGlobalInstall(configRootDescriptor, { sourceRoot, sourceFiles, targetPath, installerFlags }) {
  const wasInstalled = installerFlags.has("force")
    ? installForcedCopy(configRootDescriptor, sourceRoot, sourceFiles)
    : installIfMissing(configRootDescriptor, sourceRoot, sourceFiles);
  reportInstallStatus(targetPath, sourceFiles.length, wasInstalled);
}

function installIfMissing(configRootDescriptor, sourceRoot, sourceFiles) {
  const existingDirectory = tryOpenGlobalPluginDirectory(configRootDescriptor);
  if (existingDirectory !== undefined) {
    closeProjectDescriptor(existingDirectory);
    return false;
  }
  return copyIntoPluginDirectory(
    createGlobalPluginDirectory(configRootDescriptor),
    sourceRoot,
    sourceFiles,
  );
}

function installForcedCopy(configRootDescriptor, sourceRoot, sourceFiles) {
  const pluginDirectory =
    tryOpenGlobalPluginDirectory(configRootDescriptor) ?? createGlobalPluginDirectory(configRootDescriptor);
  return copyIntoPluginDirectory(pluginDirectory, sourceRoot, sourceFiles);
}

function copyIntoPluginDirectory(pluginDirectory, sourceRoot, sourceFiles) {
  try {
    for (const sourceFile of sourceFiles) {
      copyPluginFile(pluginDirectory, sourceRoot, sourceFile);
    }
    return true;
  } finally {
    closeProjectDescriptor(pluginDirectory);
  }
}

function copyPluginFile(pluginDirectory, sourceRoot, sourceFile) {
  const pathSegments = relative(sourceRoot, sourceFile).split(sep);
  const fileName = pathSegments.pop();
  const nestedDescriptors = openPluginSubdirectories(pluginDirectory, pathSegments);
  const destinationDescriptor = nestedDescriptors.at(-1) ?? pluginDirectory;
  try {
    copyProjectFileAtomically(sourceFile, destinationDescriptor, fileName);
  } finally {
    for (const directoryDescriptor of nestedDescriptors.reverse()) {
      closeProjectDescriptor(directoryDescriptor);
    }
  }
}

function openPluginSubdirectories(pluginDirectory, pathSegments) {
  const openedDirectories = [];
  let parentDescriptor = pluginDirectory;
  try {
    for (const directoryName of pathSegments) {
      parentDescriptor = openPluginSubdirectory(parentDescriptor, directoryName, openedDirectories);
    }
    return openedDirectories;
  } catch (error) {
    closePluginSubdirectories(openedDirectories);
    throw error;
  }
}

function openPluginSubdirectory(parentDescriptor, directoryName, openedDirectories) {
  const childDescriptor = createProjectChildDirectory(parentDescriptor, directoryName);
  openedDirectories.push(childDescriptor);
  return childDescriptor;
}

function closePluginSubdirectories(openedDirectories) {
  for (const directoryDescriptor of openedDirectories.reverse()) {
    closeProjectDescriptor(directoryDescriptor);
  }
}

function tryOpenGlobalPluginDirectory(configRootDescriptor) {
  const pluginsDirectory = tryOpenProjectChildDirectory(configRootDescriptor, "plugins");
  if (pluginsDirectory === undefined) return undefined;
  try {
    return tryOpenProjectChildDirectory(pluginsDirectory, "agent-models");
  } finally {
    closeProjectDescriptor(pluginsDirectory);
  }
}

function createGlobalPluginDirectory(configRootDescriptor) {
  const pluginsDirectory = createProjectChildDirectory(configRootDescriptor, "plugins");
  try {
    return createProjectChildDirectory(pluginsDirectory, "agent-models");
  } finally {
    closeProjectDescriptor(pluginsDirectory);
  }
}

function reportInstallStatus(targetPath, fileCount, wasInstalled) {
  if (!wasInstalled) {
    console.log(`Plugin already exists at ${targetPath}; skipped (use --force to overwrite).`);
    return;
  }
  console.log(`Installed ${fileCount} agent model plugin files globally to ${targetPath}`);
  console.log("Restart OpenCode (or start a new session) to load the TUI command.");
}

function installerFailureMessage(error) {
  if (error.code === "ERR_SECURE_PROJECT_FS_UNAVAILABLE") return error.message;
  if (error.code === "EACCES" || error.code === "EPERM") {
    return "Global plugin install failed safely. Check OpenCode config-directory permissions and retry.";
  }
  if (error.code === "ELOOP" || error.code === "ENOTDIR") {
    return "Global plugin install failed safely. Check for symlinks or invalid entries under the OpenCode config directory.";
  }
  return "Global plugin install failed safely. Check the OpenCode config directory and retry.";
}
