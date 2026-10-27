#!/usr/bin/env node
// tests/mock-loader.mjs - Loader that redirects `node:child_process` to the
// tests/mock-child-process.mjs mock so rollback tests can assert on the exact
// git commands without running real git.
import { pathToFileURL } from "node:url";

const mockUrl = pathToFileURL(
  new URL("./mock-child-process.mjs", import.meta.url).pathname
).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "node:child_process") {
    return { url: mockUrl, format: "module", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
