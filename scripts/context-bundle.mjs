#!/usr/bin/env node
// context-bundle.mjs - Genera un bundle Markdown con todos los artefactos
// de un cambio OpenSpec para entrega de contexto entre agentes.
//
// Lee proposal.md, design.md, tasks.md y spec.md del directorio del cambio,
// añade el `git diff` del working tree e imprime el resultado en stdout.
//
//   node scripts/context-bundle.mjs <nombre-del-cambio>
//
// Exporta contextBundle(changeName) que devuelve el bundle como string.
// Salida por defecto: stdout. Cambio inexistente: mensaje de error y exit 1.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { execSync } from "node:child_process";

const REPO_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGES_DIR = join(REPO_DIR, "openspec", "changes");

// Guard para ejecución directa: node scripts/context-bundle.mjs <cambio>
const SELF_PATH = fileURLToPath(import.meta.url);
if (SELF_PATH === resolve(process.argv[1] ?? "")) {
  const changeName = process.argv[2];
  if (!changeName) {
    console.error("ERROR: se requiere el nombre del cambio como argumento.");
    console.error("Uso: node scripts/context-bundle.mjs <nombre-del-cambio>");
    process.exit(1);
  }
  console.log(contextBundle(changeName));
}

// API pública -----------------------------------------------------------------

/**
 * Devuelve el bundle de Markdown de un cambio: propuesta, diseño, tareas,
 * spec y git diff, en ese orden.
 *
 * @param {string} changeName - nombre del directorio del cambio bajo openspec/changes/
 * @returns {string} bundle de Markdown listo para pegar en un prompt de agente
 */
export function contextBundle(changeName) {
  validateChangeName(changeName);
  const changeDir = join(CHANGES_DIR, changeName);
  if (!existsSync(changeDir)) {
    emitMissingChangeError(changeName);
  }

  const bundleSections = [`# Context Bundle: ${changeName}`];
  appendArtifactSections(bundleSections, changeDir);
  appendSpecSection(bundleSections, changeDir);
  appendGitDiffSection(bundleSections);

  return bundleSections.join("\n\n");
}

// Helpers ---------------------------------------------------------------------

function emitMissingChangeError(changeName) {
  console.error(`ERROR: change '${changeName}' not found`);
  process.exit(1);
}

function validateChangeName(changeName) {
  if (hasPathTraversal(changeName)) {
    console.error(`ERROR: invalid change name: '${changeName}'`);
    process.exit(1);
  }
}

function hasPathTraversal(changeName) {
  return changeName.includes("/") || changeName.includes("\\") || changeName.includes("..");
}

function appendArtifactSections(bundleSections, changeDir) {
  for (const [title, fileName] of [
    ["## Proposal", "proposal.md"],
    ["## Design", "design.md"],
    ["## Tasks", "tasks.md"],
  ]) {
    bundleSections.push(title);
    bundleSections.push(withTrailingNewline(readChangeArtifact(changeDir, fileName)));
  }
}

function readChangeArtifact(changeDir, fileName) {
  const filePath = join(changeDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`change artifact not found: ${filePath}`);
  }
  return readFileSync(filePath, "utf8");
}

function appendSpecSection(bundleSections, changeDir) {
  const specPath = findSpecMarkdown(changeDir);
  bundleSections.push("## Spec");
  bundleSections.push(withTrailingNewline(readFileSync(specPath, "utf8")));
}

function findSpecMarkdown(changeDir) {
  const specsDir = join(changeDir, "specs");
  if (!existsSync(specsDir)) {
    throw new Error(`specs directory not found: ${specsDir}`);
  }
  const markdownFiles = [];
  collectMarkdownFiles(specsDir, markdownFiles);
  markdownFiles.sort();
  if (markdownFiles.length === 0) {
    throw new Error(`no spec markdown found under ${specsDir}`);
  }
  return markdownFiles[0];
}

function collectMarkdownFiles(dir, markdownFiles) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(entryPath, markdownFiles);
    } else if (entry.name.endsWith(".md")) {
      markdownFiles.push(entryPath);
    }
  }
}

function appendGitDiffSection(bundleSections) {
  const diffOutput = execSync("git diff", { cwd: REPO_DIR, encoding: "utf8" });
  bundleSections.push("## Git Diff");
  bundleSections.push(withTrailingNewline(diffOutput));
}

function withTrailingNewline(text) {
  return text.endsWith("\n") ? text : `${text}\n`;
}
