import {
  MAX_MODEL_REFERENCE_LENGTH,
  MODEL_REFERENCE_LIMIT,
  safetyLimitError,
} from "./safety-limits.mjs";

const MAX_PROVIDER_LENGTH = 128;
const MAX_MODEL_LENGTH = 128;
const MAX_VARIANT_LENGTH = 64;
const MAX_DISPLAY_LENGTH = 512;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;

export function parseModelReference(reference) {
  if (typeof reference !== "string" || CONTROL_CHARACTERS.test(reference)) {
    throw new Error("Model reference must be a plain string without control characters.");
  }
  if (reference.length > MAX_MODEL_REFERENCE_LENGTH) {
    throw modelReferenceLimitError();
  }
  const separator = reference.indexOf("/");
  if (separator < 0) throw new Error("Model reference must include provider and model IDs.");
  const providerID = reference.slice(0, separator);
  const modelWithVariant = reference.slice(separator + 1);
  const variantStart = modelWithVariant.indexOf("#");
  const modelID = variantStart < 0 ? modelWithVariant : modelWithVariant.slice(0, variantStart);
  const variant = variantStart < 0 ? undefined : modelWithVariant.slice(variantStart + 1);
  validateProviderID(providerID);
  validateModelID(modelID);
  if (variant !== undefined) validateVariantID(variant);
  return { providerID, modelID, variant };
}

export function formatModelReference({ providerID, modelID, variant }) {
  validateProviderID(providerID);
  validateModelID(modelID);
  const modelReference = `${providerID}/${modelID}`;
  if (variant === undefined) return validateReferenceLength(modelReference);
  return validateReferenceLength(`${modelReference}#${validateVariantID(variant)}`);
}

export function isCatalogModel(model) {
  try {
    formatModelReference({ providerID: model?.providerID, modelID: model?.id });
    validateDisplayName(model?.name);
    return true;
  } catch (error) {
    return false;
  }
}

export function isCatalogVariant(variantID) {
  try {
    validateVariantID(variantID);
    return true;
  } catch (error) {
    return false;
  }
}

function validateProviderID(providerID) {
  validateText(providerID, "Provider ID", MAX_PROVIDER_LENGTH);
  if (providerID.includes("/") || providerID.includes("#")) {
    throw new Error("Provider ID contains a reserved model-reference separator.");
  }
}

function validateModelID(modelID) {
  validateText(modelID, "Model ID", MAX_MODEL_LENGTH);
  if (modelID.includes("#")) throw new Error("Model ID cannot contain '#'.");
}

function validateVariantID(variantID) {
  validateText(variantID, "Variant ID", MAX_VARIANT_LENGTH);
  if (variantID.includes("#")) throw new Error("Variant ID cannot contain '#'.");
  return variantID;
}

function validateDisplayName(displayName) {
  validateText(displayName, "Model name", MAX_DISPLAY_LENGTH);
}

function validateText(text, label, maximumLength) {
  if (typeof text !== "string") throw new Error(`${label} must be a string.`);
  if (text.length === 0) throw new Error(`${label} cannot be empty.`);
  if (text.length > maximumLength) throw new Error(`${label} exceeds the maximum supported length.`);
  if (CONTROL_CHARACTERS.test(text)) throw new Error(`${label} cannot contain control characters.`);
}

function validateReferenceLength(reference) {
  if (reference.length > MAX_MODEL_REFERENCE_LENGTH) throw modelReferenceLimitError();
  return reference;
}

function modelReferenceLimitError() {
  return safetyLimitError(
    MODEL_REFERENCE_LIMIT,
    "Model reference exceeds the OpenCode provider/model/variant limits.",
  );
}
