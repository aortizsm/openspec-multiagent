#!/usr/bin/env node
// tui.mjs - Text User Interface helpers for the installer.
// Pure Node, no third-party dependencies. Uses readline for reliable input.
//
// Works in any terminal. When stdin is not a TTY every function falls back to
// its default so CI and scripts never hang.

import { createInterface } from "node:readline/promises";

const { stdin, stdout } = process;

// --- helpers ------------------------------------------------------------------
export function clearScreen() {
  if (stdin.isTTY) stdout.write("\x1b[2J\x1b[H");
}

export function hideCursor() {
  if (stdin.isTTY) stdout.write("\x1b[?25l");
}

export function showCursor() {
  if (stdin.isTTY) stdout.write("\x1b[?25h");
}

// --- menus --------------------------------------------------------------------
/**
 * Interactive single-choice menu with numbered options.
 * User types the number and Enter. Falls back to defaultIndex when not a TTY.
 */
export async function selectMenu(title, options, { defaultIndex = 0 } = {}) {
  if (!stdin.isTTY) return options[defaultIndex]?.value ?? null;

  hideCursor();
  try {
    clearScreen();
    stdout.write(`${title}\n`);
    stdout.write("═".repeat(title.length) + "\n\n");

    options.forEach((opt, i) => {
      const marker = i === defaultIndex ? "▸ " : "  ";
      const hint = opt.hint ? `  ${opt.hint}` : "";
      stdout.write(`  ${marker}${i + 1}) ${opt.label}${hint}\n`);
    });

    stdout.write(`\nElige 1-${options.length} (Enter = ${options[defaultIndex].label}): `);

    const rl = createInterface({ input: stdin, output: stdout });
    const answer = (await rl.question("")).trim();
    rl.close();

    if (!answer) return options[defaultIndex].value;

    const picked = Number.parseInt(answer, 10);
    if (Number.isInteger(picked) && picked >= 1 && picked <= options.length) {
      return options[picked - 1].value;
    }
    return options[defaultIndex].value;
  } finally {
    showCursor();
    clearScreen();
  }
}

/**
 * Interactive yes/no prompt. Falls back to defaultYes when not a TTY.
 */
export async function confirm(message, { defaultYes = true } = {}) {
  const options = [
    { label: defaultYes ? "Sí" : "No", value: true, hint: defaultYes ? "(default)" : "" },
    { label: defaultYes ? "No" : "Sí", value: false, hint: defaultYes ? "" : "(default)" },
  ];

  const picked = await selectMenu(message, options, {
    defaultIndex: defaultYes ? 0 : 1,
  });
  return picked ?? defaultYes;
}

/**
 * Free-text input (e.g. paste an API key). Falls back to fallback when not a
 * TTY or on empty answer.
 */
export async function inputText(message, { fallback = "" } = {}) {
  if (!stdin.isTTY) return fallback;

  hideCursor();
  try {
    clearScreen();
    stdout.write(`${message}\n`);
    if (fallback) stdout.write(`(Enter para usar: ${fallback})\n`);
    stdout.write("\n> ");

    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question("");
    rl.close();
    return answer.trim() || fallback;
  } finally {
    showCursor();
    clearScreen();
  }
}

/**
 * Show a status block and wait for Enter.
 */
export async function pause(message) {
  if (!stdin.isTTY) return;

  hideCursor();
  try {
    clearScreen();
    stdout.write(`${message}\n\n`);
    stdout.write("Presiona Enter para continuar...");
    const rl = createInterface({ input: stdin, output: stdout });
    await rl.question("");
    rl.close();
  } finally {
    showCursor();
    clearScreen();
  }
}
