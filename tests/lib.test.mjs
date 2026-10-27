#!/usr/bin/env node
// tests/lib.test.mjs - Tests for interactive input helpers in scripts/lib.mjs
//   node tests/lib.test.mjs

import assert from "node:assert";
import { EventEmitter } from "node:events";

import {
  ask,
  askText,
  askYesNo,
  closePrompts,
  isInteractive,
  readInput,
} from "../scripts/lib.mjs";

let passed = 0;
let failed = 0;

async function tick() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  }
}

// Mock stdin: an EventEmitter that emits "data" when push() is called and
// exposes the TTY / end-of-stream flags the prompts read.
class MockStdin extends EventEmitter {
  constructor({ tty = false, ended = false } = {}) {
    super();
    this.isTTY = tty;
    this.rawMode = false;
    this.readableEnded = ended;
  }
  setRawMode(mode) {
    this.rawMode = mode;
    return true;
  }
  push(chunk) {
    this.emit("data", chunk);
  }
}

// Mock stdout: a minimal write collector that records what prompts printed.
class MockStdout {
  constructor({ tty = false } = {}) {
    this.isTTY = tty;
    this.written = "";
  }
  write(chunk) {
    this.written += String(chunk);
    return true;
  }
  output() {
    return this.written;
  }
}

function stdinStream({ tty = false, ended = false } = {}) {
  return new MockStdin({ tty, ended });
}

function stdoutStream({ tty = false } = {}) {
  return new MockStdout({ tty });
}

(async () => {
  // ------------------------------------------------------------------
  // isInteractive
  // ------------------------------------------------------------------
  await testAsync("isInteractive is false when stdin is not a TTY", async () => {
    assert.strictEqual(
      isInteractive(stdinStream({ tty: false }), stdoutStream({ tty: false })),
      false,
    );
  });

  await testAsync("isInteractive is true when both are TTYs", async () => {
    assert.strictEqual(
      isInteractive(stdinStream({ tty: true }), stdoutStream({ tty: true })),
      true,
    );
  });

  // ------------------------------------------------------------------
  // askYesNo — non-interactive (no stdin read)
  // ------------------------------------------------------------------
  await testAsync("askYesNo returns defaultYes when non-interactive", async () => {
    assert.strictEqual(
      await askYesNo("Keep going?", { stdin: stdinStream(), stdout: stdoutStream() }),
      true,
    );
  });

  await testAsync("askYesNo returns false when non-interactive and defaultYes=false", async () => {
    assert.strictEqual(
      await askYesNo("Keep going?", { defaultYes: false, stdin: stdinStream(), stdout: stdoutStream() }),
      false,
    );
  });

  // ------------------------------------------------------------------
  // askYesNo — interactive (reads stdin via ask / readInput)
  // ------------------------------------------------------------------
  await testAsync("askYesNo 'y' returns true", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("y\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo 'yes' returns true", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("yes\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo 'Y' returns true (case-insensitive)", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("Y\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo 'n' returns false", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("n\n");
    assert.strictEqual(await promise, false);
  });

  await testAsync("askYesNo 'no' returns false", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("no\n");
    assert.strictEqual(await promise, false);
  });

  await testAsync("askYesNo empty answer returns defaultYes", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, true);
  });

  await testAsync("askYesNo empty answer returns defaultYes=false", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askYesNo("Agree?", { defaultYes: false, stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, false);
  });

  await testAsync("askYesNo EOF returns defaultYes", async () => {
    assert.strictEqual(
      await askYesNo("Agree?", {
        stdin: stdinStream({ tty: true, ended: true }),
        stdout: stdoutStream({ tty: true }),
      }),
      true,
    );
  });

  // ------------------------------------------------------------------
  // askText
  // ------------------------------------------------------------------
  await testAsync("askText returns typed value", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askText("Name?", { stdin: input, stdout: output });
    await tick();
    input.push("Ada\n");
    assert.strictEqual(await promise, "Ada");
  });

  await testAsync("askText returns fallback on empty answer", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askText("Name?", { fallback: "guest", stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, "guest");
  });

  await testAsync("askText returns fallback on EOF (null)", async () => {
    assert.strictEqual(
      await askText("Name?", {
        fallback: "guest",
        stdin: stdinStream({ tty: true, ended: true }),
        stdout: stdoutStream({ tty: true }),
      }),
      "guest",
    );
  });

  await testAsync("askText default fallback is empty string", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = askText("Name?", { stdin: input, stdout: output });
    await tick();
    input.push("\n");
    assert.strictEqual(await promise, "");
  });

  // ------------------------------------------------------------------
  // ask
  // ------------------------------------------------------------------
  await testAsync("ask returns typed value", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = ask("Say something: ", input, output);
    await tick();
    input.push("hello\n");
    assert.strictEqual(await promise, "hello");
  });

  await testAsync("ask returns null on EOF", async () => {
    assert.strictEqual(
      await ask("Say something: ", stdinStream({ tty: true, ended: true }), stdoutStream({ tty: true })),
      null,
    );
  });

  // ------------------------------------------------------------------
  // readInput — TTY input
  // ------------------------------------------------------------------
  await testAsync("readInput TTY returns trimmed value without EOF", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = readInput("q: ", {
      stdin: input,
      stdout: output,
      timeout: 5000,
      fallback: "",
    });
    await tick();
    input.push("  trimmed  \n");
    const outcome = await promise;
    assert.strictEqual(outcome.value, "trimmed");
    assert.strictEqual(outcome.eof, false);
  });

  // ------------------------------------------------------------------
  // readInput — piped input (not a TTY, data arrives)
  // ------------------------------------------------------------------
  await testAsync("readInput piped input returns value without EOF", async () => {
    const input = stdinStream({ tty: false });
    const output = stdoutStream({ tty: false });
    const promise = readInput("q: ", {
      stdin: input,
      stdout: output,
      timeout: 5000,
      fallback: "",
    });
    await tick();
    input.push("piped-data\n");
    const outcome = await promise;
    assert.strictEqual(outcome.value, "piped-data");
    assert.strictEqual(outcome.eof, false);
  });

  // ------------------------------------------------------------------
  // readInput — EOF
  // ------------------------------------------------------------------
  await testAsync("readInput returns EOF when readableEnded is true", async () => {
    const outcome = await readInput("q: ", {
      stdin: stdinStream({ tty: true, ended: true }),
      stdout: stdoutStream({ tty: true }),
      timeout: 5000,
      fallback: "",
    });
    assert.strictEqual(outcome.value, null);
    assert.strictEqual(outcome.eof, true);
  });

  await testAsync("readInput returns EOF on 'end' event", async () => {
    const input = stdinStream({ tty: true });
    const output = stdoutStream({ tty: true });
    const promise = readInput("q: ", {
      stdin: input,
      stdout: output,
      timeout: 5000,
      fallback: "",
    });
    await tick();
    input.emit("end");
    const outcome = await promise;
    assert.strictEqual(outcome.value, null);
    assert.strictEqual(outcome.eof, true);
  });

  // ------------------------------------------------------------------
  // readInput — timeout
  // ------------------------------------------------------------------
  await testAsync("readInput returns fallback on timeout without EOF", async () => {
    const outcome = await readInput("q: ", {
      stdin: stdinStream({ tty: true }),
      stdout: stdoutStream({ tty: true }),
      timeout: 30,
      fallback: "fb",
    });
    assert.strictEqual(outcome.value, "fb");
    assert.strictEqual(outcome.eof, false);
  });

  await testAsync("readInput default fallback is empty string on timeout", async () => {
    const outcome = await readInput("q: ", {
      stdin: stdinStream({ tty: true }),
      stdout: stdoutStream({ tty: true }),
      timeout: 30,
    });
    assert.strictEqual(outcome.value, "");
    assert.strictEqual(outcome.eof, false);
  });

  await testAsync("closePrompts does not throw", () => {
    closePrompts();
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
