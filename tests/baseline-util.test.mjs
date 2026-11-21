#!/usr/bin/env node
// tests/baseline-util.test.mjs

import assert from "node:assert";
import { formatTimestamp, formatCustomTimestamp } from "../scripts/baseline-util.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
}

test("formatTimestamp returns ISO string", () => {
  const result = formatTimestamp();
  assert.match(result, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("formatTimestamp accepts custom date", () => {
  const date = new Date("2024-01-15T10:30:00.000Z");
  const result = formatTimestamp(date);
  assert.strictEqual(result, "2024-01-15T10:30:00.000Z");
});

test("formatCustomTimestamp with iso format", () => {
  const date = new Date("2024-01-15T10:30:00.000Z");
  const result = formatCustomTimestamp(date, "iso");
  assert.strictEqual(result, "2024-01-15T10:30:00.000Z");
});

test("formatCustomTimestamp with unix format", () => {
  const date = new Date("2024-01-15T10:30:00.000Z");
  const result = formatCustomTimestamp(date, "unix");
  assert.strictEqual(result, "1705314600");
});

test("formatCustomTimestamp with locale format", () => {
  const date = new Date("2024-01-15T10:30:00.000Z");
  const result = formatCustomTimestamp(date, "locale");
  assert.ok(typeof result === "string" && result.length > 0);
});

test("formatCustomTimestamp defaults to iso", () => {
  const date = new Date("2024-01-15T10:30:00.000Z");
  const result = formatCustomTimestamp(date);
  assert.strictEqual(result, "2024-01-15T10:30:00.000Z");
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
