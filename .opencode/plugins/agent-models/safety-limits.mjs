export const MAX_PROJECT_CONFIG_BYTES = 1024 * 1024;
export const MAX_PROJECT_CONFIG_DEPTH = 64;
export const MAX_MODEL_CHOICES = 2000;
export const MAX_VARIANT_CHOICES = 256;
export const MAX_MODEL_REFERENCE_LENGTH = 322;

export const PROJECT_CONFIG_SIZE_LIMIT = "ERR_PROJECT_CONFIG_SIZE_LIMIT";
export const PROJECT_CONFIG_DEPTH_LIMIT = "ERR_PROJECT_CONFIG_DEPTH_LIMIT";
export const MODEL_CATALOG_LIMIT = "ERR_MODEL_CATALOG_LIMIT";
export const MODEL_REFERENCE_LIMIT = "ERR_MODEL_REFERENCE_LIMIT";

export function safetyLimitError(code, message) {
  const limitError = new Error(message);
  limitError.code = code;
  return limitError;
}
