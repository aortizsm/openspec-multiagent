import {
  readProjectConfiguration,
  writeProjectAssignment,
} from "./project-config.mjs";
import {
  closeProjectDescriptor,
  openProjectDirectory,
} from "./secure-project-fs.mjs";
import {
  formatModelReference,
  isCatalogModel,
  isCatalogVariant,
  parseModelReference,
} from "./model-reference.mjs";
import {
  MAX_MODEL_CHOICES,
  MAX_VARIANT_CHOICES,
  MODEL_CATALOG_LIMIT,
  PROJECT_CONFIG_DEPTH_LIMIT,
  PROJECT_CONFIG_SIZE_LIMIT,
  safetyLimitError,
} from "./safety-limits.mjs";

export const BUNDLED_ROLES = Object.freeze([
  { id: "architect", title: "@architect", primary: true },
  { id: "developer", title: "@developer" },
  { id: "test-engineer", title: "@test-engineer" },
  { id: "verifier", title: "@verifier" },
  { id: "ux-designer", title: "@ux-designer" },
  { id: "repo-scout", title: "@repo-scout" },
  { id: "diff-summarizer", title: "@diff-summarizer" },
  { id: "code-reviewer", title: "@code-reviewer" },
  { id: "security-reviewer", title: "@security-reviewer" },
]);

const COMMAND_ID = "openspec-multiagent.agent-models";
export function registerAgentModelsCommand(context) {
  context.keymap.layer(() => ({
    mode: "global",
    commands: [createAgentModelsCommand(context)],
  }));
}

function createAgentModelsCommand(context) {
  return {
    id: COMMAND_ID,
    title: "Choose OpenSpec agent models",
    group: "OpenSpec Multi-Agent",
    palette: true,
    slash: { name: "agent-models" },
    run: () => runAgentModelMenu(context),
  };
}

async function runAgentModelMenu(context) {
  let projectRootDescriptor;
  try {
    projectRootDescriptor = openProjectDirectory(projectLocation(context));
  } catch (error) {
    showProjectAccessFailure(context, error);
    return;
  }
  try {
    await runMenuAtProject(context, projectRootDescriptor);
  } finally {
    closeProjectDescriptor(projectRootDescriptor);
  }
}

async function runMenuAtProject(context, projectRootDescriptor) {
  const configState = readMenuConfiguration(context, projectRootDescriptor);
  if (!configState) return;
  const roleId = await chooseRole(context, configState);
  if (!roleId) return;
  await chooseAssignment(context, configState, roleId);
}

function readMenuConfiguration(context, projectRootDescriptor) {
  try {
    return readProjectConfiguration(projectRootDescriptor);
  } catch (error) {
    showFeedback(context, projectReadFailureMessage(error));
    return undefined;
  }
}

function projectReadFailureMessage(error) {
  if (error.code === PROJECT_CONFIG_SIZE_LIMIT) {
    return "Project config exceeds the 1 MiB safety limit; no assignment was changed.";
  }
  if (error.code === PROJECT_CONFIG_DEPTH_LIMIT) {
    return "Project config exceeds the 64-level nesting safety limit; no assignment was changed.";
  }
  return "Project configuration could not be read safely. Check its JSONC syntax and file permissions.";
}

function projectLocation(context) {
  return context.location.project?.directory ?? context.location.directory;
}

async function chooseRole(context, configState) {
  const selection = await context.ui.dialog.select({
    title: "Choose an agent — use arrows and Enter; Esc cancels",
    options: BUNDLED_ROLES.map((role) => roleOption(role, configState)),
  });
  return selection;
}

function roleOption(role, configState) {
  const currentAssignment = configState.assignments[role.id];
  return {
    title: role.title,
    value: role.id,
    description: `Current model: ${currentAssignment ?? "not set"}`,
  };
}

async function chooseAssignment(context, configState, roleId) {
  const role = BUNDLED_ROLES.find((entry) => entry.id === roleId);
  if (!role) return;
  const models = await availableModels(context);
  if (models === undefined) return;
  if (models.length === 0) {
    await context.ui.dialog.alert({ title: "No models available", message: "No models are available in this project location. Connect a provider or retry later." });
    return;
  }
  const selection = await chooseModel(context, role, models, configState.assignments[role.id]);
  if (!selection) return;
  await persistAssignment(context, configState, role, selection);
}

async function availableModels(context) {
  context.ui.toast.show({
    message: "Loading models available in this project…",
    duration: 30_000,
  });
  const location = context.location ?? context.data.location.default();
  try {
    return await loadLocationModels(context, location);
  } catch (error) {
    await showCatalogFailure(context, error);
    return undefined;
  }
}

async function loadLocationModels(context, location) {
  await context.data.location.model.sync(location);
  const availableModels = context.data.location.model.list(location) ?? [];
  if (availableModels.length > MAX_MODEL_CHOICES) {
    throw safetyLimitError(
      MODEL_CATALOG_LIMIT,
      "This project exposes more than 2,000 models; no assignment was saved.",
    );
  }
  return normalizedModels(availableModels);
}

async function showCatalogFailure(context, error) {
  const message = catalogFailureMessage(error);
  await context.ui.dialog.alert({
    title: "Model catalog unavailable",
    message,
  });
}

function catalogFailureMessage(error) {
  if (error.code === MODEL_CATALOG_LIMIT) return error.message;
  return "OpenCode could not load models for this project. Check provider access and try again; no assignment was saved.";
}

function normalizedModels(models) {
  return models.filter(isCatalogModel);
}

async function chooseModel(context, role, models, current) {
  const selection = await context.ui.dialog.select({
    title: modelDialogTitle(role),
    current: currentModelBase(current),
    options: models.map(modelOption),
  });
  if (!selection) return undefined;
  const model = models.find((entry) => modelIdentifier(entry) === selection);
  if (!model) return undefined;
  const variant = role.primary ? undefined : await chooseVariant(context, model, current);
  if (!role.primary && variant === undefined) return undefined;
  if (!isVariantSelectionValid(role, model, variant)) {
    showFeedback(context, "Selected variant is not available for this model; no assignment was saved.");
    return undefined;
  }
  return { model, variant };
}

function modelDialogTitle(role) {
  if (role.primary) return "@architect: choose a model (project default has no variant)";
  return `${role.title}: choose an available model — Esc cancels`;
}

function modelOption(model) {
  const identifier = modelIdentifier(model);
  return {
    title: `${model.providerID}/${model.name}`,
    value: identifier,
    description: identifier,
  };
}

function modelIdentifier(model) {
  return formatModelReference({ providerID: model.providerID, modelID: model.id });
}

function currentModelBase(current) {
  if (typeof current !== "string") return undefined;
  const parsedReference = parseModelReference(current);
  return formatModelReference(parsedReference);
}

async function chooseVariant(context, model, current) {
  if (hasTooManyVariants(model)) {
    await showVariantLimitFailure(context);
    return undefined;
  }
  const variants = modelVariants(model);
  if (variants.length === 0) return "";
  return context.ui.dialog.select({
    title: "Choose a subagent variant — Default uses the model's default; Esc cancels",
    current: currentVariant(current),
    options: variantOptions(variants),
  });
}

function hasTooManyVariants(model) {
  return Array.isArray(model.variants) && model.variants.length > MAX_VARIANT_CHOICES;
}

async function showVariantLimitFailure(context) {
  await context.ui.dialog.alert({
    title: "Variant list unavailable",
    message: "This model exposes more than 256 variants; no assignment was saved.",
  });
}

function isVariantSelectionValid(role, model, variant) {
  if (role.primary) return variant === undefined;
  if (variant === undefined) return false;
  if (variant === "") return true;
  return modelVariants(model).includes(variant);
}

function variantOptions(variants) {
  return [
    { title: "Default (no variant)", value: "" },
    ...variants.map((variant) => ({
      title: variant,
      value: variant,
      description: `Variant: ${variant}`,
    })),
  ];
}

function modelVariants(model) {
  if (!Array.isArray(model.variants)) return [];
  return model.variants.filter((variant) => isCatalogVariant(variant?.id)).map((variant) => variant.id);
}

function currentVariant(current) {
  if (typeof current !== "string") return "";
  return parseModelReference(current).variant ?? "";
}

async function persistAssignment(context, configState, role, selection) {
  if (role.primary && !(await confirmPrimaryDefault(context, selection.model))) return;
  try {
    writeProjectAssignment(
      configState.projectRootDescriptor,
      role.id,
      assignmentIdentifier(selection),
    );
    showSavedAssignment(context, role, selection);
  } catch (error) {
    showFeedback(context, assignmentWriteFailureMessage(error));
  }
}

function assignmentWriteFailureMessage(error) {
  if (error.code === PROJECT_CONFIG_SIZE_LIMIT) {
    return "Assignment was not saved: project config exceeds the 1 MiB safety limit.";
  }
  if (error.code === PROJECT_CONFIG_DEPTH_LIMIT) {
    return "Assignment was not saved: project config exceeds the 64-level nesting safety limit.";
  }
  return "Assignment was not saved. Check the project config's JSONC syntax and write permissions, then retry.";
}

function showSavedAssignment(context, role, selection) {
  context.ui.toast.show({
    title: "Assignment saved",
    message: `${role.title} now uses ${assignmentIdentifier(selection)} in this project.`,
    variant: "success",
  });
}

async function confirmPrimaryDefault(context, model) {
  return context.ui.dialog.confirm({
    title: "Change the project default model?",
    message: `Set @architect to ${modelIdentifier(model)}? This default applies to all primary agents in new sessions and does not change an already-open session.`,
    label: { confirm: "Save project default", cancel: "Cancel" },
  });
}

function assignmentIdentifier(selection) {
  return formatModelReference({
    providerID: selection.model.providerID,
    modelID: selection.model.id,
    variant: selection.variant || undefined,
  });
}

function showFeedback(context, message) {
  context.ui.toast.show({ title: "Agent model assignment", message, variant: "error" });
}

function showProjectAccessFailure(context, error) {
  const message = error.code === "ERR_SECURE_PROJECT_FS_UNAVAILABLE"
    ? error.message
    : "Project configuration could not be opened safely; no file was changed.";
  showFeedback(context, message);
}
