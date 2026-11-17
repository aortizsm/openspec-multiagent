import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  mkdirSync,
  openSync,
  lstatSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { randomBytes } from "node:crypto";
import { sep } from "node:path";
import {
  MAX_PROJECT_CONFIG_BYTES,
  PROJECT_CONFIG_SIZE_LIMIT,
  safetyLimitError,
} from "./safety-limits.mjs";

const DESCRIPTOR_ROOT = "/proc/self/fd";
const DIRECTORY_FLAGS = constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW;

export function openProjectDirectory(projectPath) {
  requireAnchoredFilesystem();
  const canonicalPath = realpathSync(projectPath);
  let directoryDescriptor = openSync(sep, DIRECTORY_FLAGS);
  try {
    for (const pathSegment of canonicalPath.split(sep).filter(Boolean)) {
      const childDescriptor = openProjectChildDirectory(directoryDescriptor, pathSegment);
      closeSync(directoryDescriptor);
      directoryDescriptor = childDescriptor;
    }
    return directoryDescriptor;
  } catch (error) {
    closeSync(directoryDescriptor);
    throw error;
  }
}

export function closeProjectDescriptor(directoryDescriptor) {
  closeSync(directoryDescriptor);
}

export function openProjectChildDirectory(parentDescriptor, directoryName) {
  validateEntryName(directoryName);
  return openSync(
    descriptorEntryPath(parentDescriptor, directoryName),
    DIRECTORY_FLAGS,
  );
}

export function tryOpenProjectChildDirectory(parentDescriptor, directoryName) {
  try {
    return openProjectChildDirectory(parentDescriptor, directoryName);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export function createProjectChildDirectory(parentDescriptor, directoryName) {
  validateEntryName(directoryName);
  try {
    mkdirSync(descriptorEntryPath(parentDescriptor, directoryName), 0o700);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  return openProjectChildDirectory(parentDescriptor, directoryName);
}

export function tryReadProjectFile(
  directoryDescriptor,
  fileName,
  maximumBytes = MAX_PROJECT_CONFIG_BYTES,
) {
  try {
    return readProjectFile(directoryDescriptor, fileName, maximumBytes);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export function readProjectFile(
  directoryDescriptor,
  fileName,
  maximumBytes = MAX_PROJECT_CONFIG_BYTES,
) {
  validateEntryName(fileName);
  const fileDescriptor = openSync(
    descriptorEntryPath(directoryDescriptor, fileName),
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  try {
    if (!fstatSync(fileDescriptor).isFile()) {
      throw new Error("Project configuration must be a regular file.");
    }
    if (fstatSync(fileDescriptor).size > maximumBytes) {
      throw configSizeLimitError(maximumBytes);
    }
    return readFileWithinLimit(fileDescriptor, maximumBytes);
  } finally {
    closeSync(fileDescriptor);
  }
}

function readFileWithinLimit(fileDescriptor, maximumBytes) {
  const fileChunks = [];
  let totalBytes = 0;
  while (totalBytes <= maximumBytes) {
    const bufferSize = Math.min(64 * 1024, maximumBytes - totalBytes + 1);
    const buffer = Buffer.alloc(bufferSize);
    const bytesRead = readSync(fileDescriptor, buffer, 0, bufferSize, null);
    if (bytesRead === 0) break;
    totalBytes += bytesRead;
    if (totalBytes > maximumBytes) throw configSizeLimitError(maximumBytes);
    fileChunks.push(buffer.subarray(0, bytesRead));
  }
  return Buffer.concat(fileChunks, totalBytes).toString("utf8");
}

function configSizeLimitError(maximumBytes) {
  return safetyLimitError(
    PROJECT_CONFIG_SIZE_LIMIT,
    `Project config exceeds the ${maximumBytes} byte safety limit.`,
  );
}

export function writeProjectFileAtomically(directoryDescriptor, fileName, contents) {
  validateEntryName(fileName);
  assertRegularProjectFile(directoryDescriptor, fileName);
  const temporaryName = temporaryFileName(fileName);
  try {
    writeTemporaryProjectFile(directoryDescriptor, temporaryName, contents);
    renameSync(
      descriptorEntryPath(directoryDescriptor, temporaryName),
      descriptorEntryPath(directoryDescriptor, fileName),
    );
  } catch (error) {
    removeProjectFile(directoryDescriptor, temporaryName);
    throw error;
  }
}

export function copyProjectFileAtomically(sourcePath, directoryDescriptor, fileName) {
  const sourceContents = readFileSync(sourcePath);
  writeProjectFileAtomically(directoryDescriptor, fileName, sourceContents);
}

function assertRegularProjectFile(directoryDescriptor, fileName) {
  try {
    if (!lstatSync(descriptorEntryPath(directoryDescriptor, fileName)).isFile()) {
      throw new Error("Project file destination must be a regular file.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function writeTemporaryProjectFile(directoryDescriptor, temporaryName, contents) {
  const temporaryDescriptor = openSync(
    descriptorEntryPath(directoryDescriptor, temporaryName),
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  );
  try {
    writeFileSync(temporaryDescriptor, contents, "utf8");
  } finally {
    closeSync(temporaryDescriptor);
  }
}

export function removeProjectFile(directoryDescriptor, fileName) {
  try {
    unlinkSync(descriptorEntryPath(directoryDescriptor, fileName));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function descriptorEntryPath(directoryDescriptor, entryName) {
  return `${DESCRIPTOR_ROOT}/${directoryDescriptor}/${entryName}`;
}

function temporaryFileName(fileName) {
  return `.${fileName}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
}

function validateEntryName(entryName) {
  if (isUnsafeEntryName(entryName)) {
    throw new Error("Project file operations require a single safe path component.");
  }
}

function isUnsafeEntryName(entryName) {
  return hasPathSeparator(entryName) || isUnsafeSimpleName(entryName);
}

function isUnsafeSimpleName(entryName) {
  return isMissingEntryName(entryName) || isDotEntryName(entryName);
}

function hasPathSeparator(entryName) {
  return entryName.includes("/") || entryName.includes("\\");
}

function isMissingEntryName(entryName) {
  return !entryName;
}

function isDotEntryName(entryName) {
  return entryName === "." || entryName === "..";
}

function requireAnchoredFilesystem() {
  if (process.platform === "linux" && constants.O_NOFOLLOW !== undefined) {
    requireDescriptorDirectory();
    return;
  }
  throw unsupportedFilesystemError();
}

function requireDescriptorDirectory() {
  if (constants.O_DIRECTORY !== undefined && existsSync(DESCRIPTOR_ROOT)) return;
  throw unsupportedFilesystemError();
}

function unsupportedFilesystemError() {
  const unsupportedError = new Error(
    "Race-resistant project file operations require Linux with /proc/self/fd; no project files were changed.",
  );
  unsupportedError.code = "ERR_SECURE_PROJECT_FS_UNAVAILABLE";
  return unsupportedError;
}
