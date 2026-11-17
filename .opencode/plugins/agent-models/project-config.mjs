import {
  closeProjectDescriptor,
  createProjectChildDirectory,
  tryOpenProjectChildDirectory,
  tryReadProjectFile,
  writeProjectFileAtomically,
} from "./secure-project-fs.mjs";
import { formatModelReference, parseModelReference } from "./model-reference.mjs";
import {
  MAX_PROJECT_CONFIG_BYTES,
  MAX_PROJECT_CONFIG_DEPTH,
  PROJECT_CONFIG_DEPTH_LIMIT,
  PROJECT_CONFIG_SIZE_LIMIT,
  safetyLimitError,
} from "./safety-limits.mjs";

const PROJECT_CONFIG_NAMES = ["opencode.json", "opencode.jsonc"];
const OPCODE_CONFIG_NAMES = ["opencode.jsonc", "opencode.json"];

export function readProjectConfiguration(projectRootDescriptor) {
  const configLocation = findProjectConfig(projectRootDescriptor);
  const document = parseJsoncDocument(configLocation.source ?? "{}");
  return { projectRootDescriptor, assignments: currentAssignments(document.root, configLocation.source ?? "{}") };
}

export function writeProjectAssignment(projectRootDescriptor, roleId, modelReference) {
  const validatedReference = validateAssignment(roleId, modelReference);
  const projectConfig = loadProjectConfig(projectRootDescriptor);
  const updatedConfig = transformAssignment(projectConfig, roleId, validatedReference);
  validateUpdatedProjectConfig(updatedConfig);
  persistProjectConfig(projectRootDescriptor, projectConfig.location, updatedConfig);
}

function validateAssignment(roleId, modelReference) {
  const parsedReference = parseModelReference(modelReference);
  if (roleId === "architect" && parsedReference.variant !== undefined) {
    throw new Error("@architect project defaults cannot store model variants.");
  }
  return formatModelReference(parsedReference);
}

function loadProjectConfig(projectRootDescriptor) {
  const location = findProjectConfig(projectRootDescriptor);
  const source = location.source ?? "{}";
  return { document: parseJsoncDocument(source), location, source };
}

function transformAssignment(projectConfig, roleId, modelReference) {
  return assignmentConfig(
    projectConfig.source,
    projectConfig.document.root,
    roleId,
    modelReference,
  );
}

function persistProjectConfig(projectRootDescriptor, location, updatedConfig) {
  writeConfigLocation(projectRootDescriptor, location, updatedConfig);
}

function validateUpdatedProjectConfig(updatedConfig) {
  parseJsoncDocument(updatedConfig);
}

function currentAssignments(rootNode, source) {
  const assignments = {};
  const primarySelector = findProperty(rootNode, "model")?.value;
  if (primarySelector) assignments.architect = readModelSelector(primarySelector, source);
  const agentsNode = findProperty(rootNode, "agents")?.value;
  if (agentsNode?.type !== "object") return assignments;
  for (const agentProperty of agentsNode.properties) {
    const modelNode = findProperty(agentProperty.value, "model")?.value;
    if (modelNode) assignments[agentProperty.key] = readModelSelector(modelNode, source);
  }
  return assignments;
}

function readModelSelector(modelNode, source) {
  if (modelNode.type === "string") {
    return formatModelReference(parseModelReference(readStringNode(modelNode, source)));
  }
  if (modelNode.type === "object") return readObjectModelSelector(modelNode, source);
  throw new Error("Configured model selector must be a string or OpenCode model object.");
}

function readObjectModelSelector(modelNode, source) {
  const providerID = readStringNode(findProperty(modelNode, "providerID")?.value, source);
  const modelID = readStringNode(findProperty(modelNode, "model")?.value, source);
  const variantNode = findProperty(modelNode, "variant")?.value;
  const variant = variantNode === undefined
    ? undefined
    : requireStringNode(variantNode, source, "variant");
  return formatModelReference({ providerID, modelID, variant });
}

function requireStringNode(node, source, fieldName) {
  const stringValue = readStringNode(node, source);
  if (stringValue === undefined) throw new Error(`Model selector '${fieldName}' must be a string.`);
  return stringValue;
}

function assignmentConfig(source, rootNode, roleId, modelReference) {
  if (roleId === "architect") {
    return setObjectProperty(source, rootNode, "model", modelReference);
  }
  return setSubagentModel(source, rootNode, roleId, modelReference);
}

function setSubagentModel(source, rootNode, roleId, modelReference) {
  const agentsProperty = findProperty(rootNode, "agents");
  if (!agentsProperty) {
    return insertProperty(source, rootNode, "agents", { [roleId]: { model: modelReference } });
  }
  const agentsNode = requireObject(agentsProperty.value, "The project agents setting must be an object.");
  const roleProperty = findProperty(agentsNode, roleId);
  if (!roleProperty) return insertProperty(source, agentsNode, roleId, { model: modelReference });
  const roleNode = requireObject(roleProperty.value, "The selected agent setting must be an object.");
  return setObjectProperty(source, roleNode, "model", modelReference);
}

function setObjectProperty(source, objectNode, key, modelReference) {
  const property = findProperty(objectNode, key);
  if (!property) return insertProperty(source, objectNode, key, modelReference);
  if (property.value.type !== "string" && property.value.type !== "object") {
    throw new Error(`The ${key} config field must use a string or model selector object.`);
  }
  return replaceNode(source, property.value, JSON.stringify(modelReference));
}

function findProjectConfig(projectRootDescriptor) {
  const codeDirectory = tryOpenProjectChildDirectory(projectRootDescriptor, ".opencode");
  if (codeDirectory !== undefined) {
    try {
      const localConfig = findConfigInDirectory(codeDirectory, [".opencode"]);
      if (localConfig) return localConfig;
    } finally {
      closeProjectDescriptor(codeDirectory);
    }
  }
  return findConfigInDirectory(projectRootDescriptor, []) ?? defaultConfigLocation();
}

function findConfigInDirectory(directoryDescriptor, directorySegments) {
  const fileNames = directorySegments.length === 0
    ? PROJECT_CONFIG_NAMES
    : OPCODE_CONFIG_NAMES;
  for (const fileName of fileNames) {
    const source = tryReadProjectFile(
      directoryDescriptor,
      fileName,
      MAX_PROJECT_CONFIG_BYTES,
    );
    if (source !== undefined) return { directorySegments, fileName, source };
  }
  return undefined;
}

function defaultConfigLocation() {
  return { directorySegments: [".opencode"], fileName: "opencode.jsonc", source: undefined };
}

function writeConfigLocation(projectRootDescriptor, configLocation, configText) {
  const directorySegments = configLocation.directorySegments;
  if (directorySegments.length === 0) {
    writeProjectFileAtomically(projectRootDescriptor, configLocation.fileName, configText);
    return;
  }
  const directoryDescriptor = createProjectChildDirectory(projectRootDescriptor, directorySegments[0]);
  try {
    writeProjectFileAtomically(directoryDescriptor, configLocation.fileName, configText);
  } finally {
    closeProjectDescriptor(directoryDescriptor);
  }
}

function parseJsoncDocument(source) {
  if (Buffer.byteLength(source, "utf8") > MAX_PROJECT_CONFIG_BYTES) {
    throw safetyLimitError(
      PROJECT_CONFIG_SIZE_LIMIT,
      "Project config exceeds the 1 MiB safety limit.",
    );
  }
  const parser = { source, index: 0, depth: 0 };
  skipTrivia(parser);
  const root = parseNode(parser);
  skipTrivia(parser);
  if (parser.index !== source.length) throw new Error("Unexpected content after project config.");
  requireObject(root, "The project config root must be an object.");
  return { root };
}

function parseNode(parser) {
  skipTrivia(parser);
  const token = parser.source[parser.index];
  if (token !== "{" && token !== "[") return parseToken(parser, token);
  return parseContainer(parser, token);
}

function parseContainer(parser, token) {
  if (parser.depth >= MAX_PROJECT_CONFIG_DEPTH) {
    throw safetyLimitError(
      PROJECT_CONFIG_DEPTH_LIMIT,
      "Project config exceeds the 64-level nesting safety limit.",
    );
  }
  parser.depth += 1;
  try {
    return parseToken(parser, token);
  } finally {
    parser.depth -= 1;
  }
}

function parseToken(parser, token) {
  if (token === "{") return parseObject(parser);
  if (token === "[") return parseArray(parser);
  if (token === '"') return parseString(parser);
  return parsePrimitive(parser);
}

function parseObject(parser) {
  const start = parser.index++;
  const properties = [];
  skipTrivia(parser);
  if (parser.source[parser.index] === "}") return emptyObject(parser, start);
  return parseObjectProperties(parser, start, properties);
}

function emptyObject(parser, start) {
  return { type: "object", start, end: ++parser.index, properties: [], trailingComma: false };
}

function parseObjectProperties(parser, start, properties) {
  while (true) {
    const property = parseProperty(parser);
    properties.push(property);
    skipTrivia(parser);
    const separator = parser.source[parser.index++];
    if (separator === "}") return { type: "object", start, end: parser.index, properties, trailingComma: false };
    if (separator !== ",") throw new Error("Expected a comma or closing brace in project config.");
    skipTrivia(parser);
    if (parser.source[parser.index] === "}") {
      return { type: "object", start, end: ++parser.index, properties, trailingComma: true };
    }
  }
}

function parseProperty(parser) {
  const keyNode = parseString(parser);
  skipTrivia(parser);
  if (parser.source[parser.index++] !== ":") throw new Error("Expected a colon after a project config key.");
  const parsedValue = parseNode(parser);
  return { key: JSON.parse(parser.source.slice(keyNode.start, keyNode.end)), start: keyNode.start, value: parsedValue };
}

function parseArray(parser) {
  const start = parser.index++;
  const elements = [];
  skipTrivia(parser);
  if (parser.source[parser.index] === "]") return { type: "array", start, end: ++parser.index };
  return parseArrayElements(parser, start, elements);
}

function parseArrayElements(parser, start, elements) {
  while (true) {
    elements.push(parseNode(parser));
    skipTrivia(parser);
    const separator = parser.source[parser.index++];
    if (separator === "]") return { type: "array", start, end: parser.index };
    if (separator !== ",") throw new Error("Expected a comma or closing bracket in project config.");
    skipTrivia(parser);
    if (parser.source[parser.index] === "]") return { type: "array", start, end: ++parser.index };
  }
}

function parseString(parser) {
  const start = parser.index;
  if (parser.source[parser.index++] !== '"') throw new Error("Project config object keys must be strings.");
  while (parser.index < parser.source.length) {
    const token = parser.source[parser.index++];
    if (token === "\\") parser.index += 1;
    else if (token === '"') {
      const end = parser.index;
      JSON.parse(parser.source.slice(start, end));
      return { type: "string", start, end };
    }
  }
  throw new Error("Unterminated string in project config.");
}

function parsePrimitive(parser) {
  const start = parser.index;
  while (parser.index < parser.source.length && !isPrimitiveEnd(parser.source[parser.index])) parser.index += 1;
  if (start === parser.index) throw new Error("Invalid value in project config.");
  const token = parser.source.slice(start, parser.index);
  const parsed = JSON.parse(token);
  return { type: parsed === null ? "null" : typeof parsed, start, end: parser.index };
}

function isPrimitiveEnd(token) {
  return /[\s,}\]]/.test(token) || token === "/";
}

function skipTrivia(parser) {
  while (parser.index < parser.source.length) {
    const token = parser.source[parser.index];
    if (/\s/.test(token)) {
      parser.index += 1;
      continue;
    }
    if (token !== "/") return;
    skipComment(parser);
  }
}

function skipComment(parser) {
  const nextToken = parser.source[parser.index + 1];
  if (nextToken === "/") return skipLineComment(parser);
  if (nextToken === "*") return skipBlockComment(parser);
  throw new Error("Unexpected slash in project config.");
}

function skipLineComment(parser) {
  parser.index += 2;
  while (parser.index < parser.source.length && parser.source[parser.index] !== "\n") parser.index += 1;
}

function skipBlockComment(parser) {
  parser.index += 2;
  while (parser.index < parser.source.length) {
    if (parser.source[parser.index] === "*" && parser.source[parser.index + 1] === "/") {
      parser.index += 2;
      return;
    }
    parser.index += 1;
  }
  throw new Error("Unterminated comment in project config.");
}

function requireObject(node, message) {
  if (!node || node.type !== "object") throw new Error(message);
  return node;
}

function findProperty(objectNode, key) {
  if (objectNode?.type !== "object") return undefined;
  const matches = objectNode.properties.filter((property) => property.key === key);
  if (matches.length > 1) throw new Error(`The project config contains duplicate '${key}' keys.`);
  return matches[0];
}

function readStringNode(node, source) {
  if (!node || node.type !== "string") return undefined;
  return JSON.parse(source.slice(node.start, node.end));
}

function insertProperty(source, objectNode, key, propertyContent) {
  const insertionPoint = objectNode.end - 1;
  const multiline = source.slice(objectNode.start, objectNode.end).includes("\n");
  const prefix = objectNode.properties.length && !objectNode.trailingComma ? "," : "";
  const serializedProperty = JSON.stringify(propertyContent, null, 2);
  const insertion = propertyInsertion(source, objectNode, key, serializedProperty, multiline, prefix);
  return `${source.slice(0, insertionPoint)}${insertion}${source.slice(insertionPoint)}`;
}

function propertyInsertion(source, objectNode, key, serializedProperty, multiline, prefix) {
  const propertyText = `${JSON.stringify(key)}: ${serializedProperty}`;
  if (!multiline) return `${prefix}${objectNode.properties.length ? " " : ""}${propertyText}`;
  const closingIndent = indentationAt(source, objectNode.end - 1);
  const nestedIndent = childIndentation(source, objectNode, closingIndent);
  return `${prefix}\n${nestedIndent}${propertyText}\n${closingIndent}`;
}

function childIndentation(source, objectNode, closingIndent) {
  const firstProperty = objectNode.properties[0];
  if (!firstProperty) return `${closingIndent}  `;
  return indentationAt(source, firstProperty.start);
}

function indentationAt(source, offset) {
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1;
  return source.slice(lineStart, offset).match(/^\s*/)?.[0] ?? "";
}

function replaceNode(source, node, replacement) {
  return `${source.slice(0, node.start)}${replacement}${source.slice(node.end)}`;
}
