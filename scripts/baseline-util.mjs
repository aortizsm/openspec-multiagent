// baseline-util.mjs - Simple utility for baseline testing

/** Returns current timestamp in ISO 8601 format. */
export function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

/** Returns a formatted timestamp with custom format. */
export function formatCustomTimestamp(date = new Date(), format = 'iso') {
  switch (format) {
    case 'iso':
      return date.toISOString();
    case 'unix':
      return Math.floor(date.getTime() / 1000).toString();
    case 'locale':
      return date.toLocaleString();
    default:
      return date.toISOString();
  }
}
