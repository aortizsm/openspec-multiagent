#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import {
  BUNDLED_ROLES,
  registerAgentModelsCommand,
} from "../opencode/plugins/agent-models/routing.mjs";
import {
  closeProjectDescriptor,
  copyProjectFileAtomically,
  createProjectChildDirectory,
  openProjectChildDirectory,
  openProjectDirectory,
} from "../opencode/plugins/agent-models/secure-project-fs.mjs";
import { readJsonc } from "../scripts/lib.mjs";

const CATALOG = [
  {
    id: "model-a",
    providerID: "provider-a",
    name: "Model A",
    variants: [{ id: "fast" }, { id: "deep" }],
  },
  { id: "model-b", providerID: "provider-b", name: "Model B", variants: [] },
];
const CONFIG_BYTE_LIMIT = 1024 * 1024;
const CONFIG_DEPTH_LIMIT = 64;
const MODEL_CHOICE_LIMIT = 2000;
const VARIANT_CHOICE_LIMIT = 256;
const MODEL_REFERENCE_LIMIT = 322;

let passed = 0;
let failed = 0;

async function test(name, runCase) {
  try {
    await runCase();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  ✗ ${name}`);
    console.log(`      ${error.message}`);
  }
}

function makeProject() {
  return mkdtempSync(join(tmpdir(), "agent-model-menu-"));
}

function makeHarness(projectDirectory, selections, catalog = CATALOG) {
  const harnessState = createHarnessState(selections);
  const context = createHarnessContext({ projectDirectory, selections, catalog, harnessState });
  registerAgentModelsCommand(context);
  return createHarnessResult(context, harnessState);
}

function createHarnessState(selections) {
  return { events: [], menus: [], messages: [], selections, trace: [] };
}

function createHarnessContext({ projectDirectory, selections, catalog, harnessState }) {
  return {
    location: { directory: projectDirectory, project: { directory: projectDirectory } },
    data: createLocationData(catalog, harnessState),
    keymap: {
      layer: (factory) => registerHarnessCommand(factory, harnessState),
    },
    ui: createUiApi(selections, harnessState),
  };
}

function createLocationData(catalog, harnessState) {
  return { location: { model: createModelApi(catalog, harnessState) } };
}

function createUiApi(selections, harnessState) {
  return {
    dialog: createDialogApi(selections, harnessState),
    toast: createToastApi(harnessState),
  };
}

function createModelApi(catalog, harnessState) {
  return {
    async sync(location) {
      harnessState.trace.push(["sync", location]);
      harnessState.events.push("catalog-sync");
    },
    list(location) {
      harnessState.trace.push(["list", location]);
      return catalog;
    },
  };
}

function createDialogApi(selections, harnessState) {
  return {
    async select(dialog) {
      harnessState.menus.push(dialog);
      return selections.shift();
    },
    async alert(message) {
      harnessState.messages.push(["alert", message]);
    },
    async confirm(message) {
      harnessState.messages.push(["confirm", message]);
      return selections.shift();
    },
  };
}

function createToastApi(harnessState) {
  return {
    show(message) {
      harnessState.messages.push(["toast", message]);
      harnessState.events.push(message.message);
    },
  };
}

function registerHarnessCommand(factory, harnessState) {
  const layer = factory();
  harnessState.registeredCommand = layer.commands.find((command) => command.slash?.name === "agent-models");
  harnessState.runCommand = harnessState.registeredCommand?.run;
}

function createHarnessResult(context, harnessState) {
  return {
    context,
    ...harnessState,
    run: () => harnessState.runCommand(),
  };
}

async function withProject(runCase) {
  const projectDirectory = makeProject();
  try {
    await runCase(projectDirectory);
  } finally {
    rmSync(projectDirectory, { recursive: true, force: true });
  }
}

async function withUserConfigFixture(runCase) {
  const configHome = mkdtempSync(join(tmpdir(), "agent-model-global-"));
  const globalPath = writeUserConfigSentinel(configHome);
  const savedHome = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = configHome;
  try {
    await runCase(globalPath, configHome);
  } finally {
    restoreConfigHome(savedHome);
    rmSync(configHome, { recursive: true, force: true });
  }
}

function writeUserConfigSentinel(configHome) {
  const globalDirectory = join(configHome, "opencode");
  const globalPath = join(globalDirectory, "opencode.json");
  mkdirSync(globalDirectory, { recursive: true });
  writeFileSync(globalPath, '{"model":"user/model"}');
  return globalPath;
}

function restoreConfigHome(savedHome) {
  if (savedHome === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = savedHome;
}

function writeProjectConfig(projectDirectory, configText) {
  const configDirectory = join(projectDirectory, ".opencode");
  mkdirSync(configDirectory, { recursive: true });
  writeFileSync(join(configDirectory, "opencode.jsonc"), configText);
}

function readProjectConfig(projectDirectory) {
  return readFileSync(join(projectDirectory, ".opencode", "opencode.jsonc"), "utf8");
}

function parseProjectConfig(configPath) {
  return readJsonc(configPath).data;
}

function configWithByteLength(byteLength) {
  const prefix = '{"padding":"';
  const suffix = '"}';
  return `${prefix}${"x".repeat(byteLength - prefix.length - suffix.length)}${suffix}`;
}

function configWithNestingDepth(depth) {
  const nestedArrayDepth = depth - 1;
  return `{"padding":${"[".repeat(nestedArrayDepth)}0${"]".repeat(nestedArrayDepth)}}`;
}

function makeCatalogModel(index) {
  return {
    id: `model-${index}`,
    providerID: "provider-catalog",
    name: `Catalog Model ${index}`,
    variants: [],
  };
}

function catalogWithModelCount(modelCount) {
  return Array.from({ length: modelCount }, (_, index) => makeCatalogModel(index));
}

function catalogWithVariantCount(variantCount) {
  return [{
    id: "bounded-model",
    providerID: "bounded-provider",
    name: "Bounded Model",
    variants: Array.from({ length: variantCount }, (_, index) => ({ id: `variant-${index}` })),
  }];
}

function catalogAtReferenceFieldLimits() {
  return [{
    id: "m".repeat(128),
    providerID: "p".repeat(128),
    name: "Maximum Length Model",
    variants: [{ id: "v".repeat(64) }],
  }];
}

async function verifyConfigByteLimit(projectDirectory) {
  const boundaryConfig = configWithByteLength(CONFIG_BYTE_LIMIT);
  writeProjectConfig(projectDirectory, boundaryConfig);
  await assertConfigAccepted(projectDirectory, boundaryConfig);
  await assertConfigWriteLimit(projectDirectory, boundaryConfig);
  await assertConfigTooLarge(projectDirectory);
}

async function assertConfigAccepted(projectDirectory, configText) {
  const harness = makeHarness(projectDirectory, []);
  await harness.run();
  assert.strictEqual(harness.menus[0].options.length, BUNDLED_ROLES.length);
  assert.strictEqual(readProjectConfig(projectDirectory), configText);
}

async function assertConfigWriteLimit(projectDirectory, originalConfig) {
  const harness = makeHarness(projectDirectory, ["developer", "provider-a/model-a", ""]);
  await harness.run();
  assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
  assert.ok(harness.messages.some(([, message]) => /exceeds the 1 MiB safety limit/i.test(message.message)));
}

async function assertConfigTooLarge(projectDirectory) {
  const oversizedConfig = configWithByteLength(CONFIG_BYTE_LIMIT + 1);
  writeProjectConfig(projectDirectory, oversizedConfig);
  const harness = makeHarness(projectDirectory, []);
  await harness.run();
  assert.strictEqual(harness.menus.length, 0);
  assert.ok(harness.messages.some(([, message]) => /1 MiB safety limit/i.test(message.message)));
  assert.strictEqual(readProjectConfig(projectDirectory), oversizedConfig);
}

async function verifyConfigDepthLimit(projectDirectory) {
  const boundaryConfig = configWithNestingDepth(CONFIG_DEPTH_LIMIT);
  writeProjectConfig(projectDirectory, boundaryConfig);
  await assertConfigAccepted(projectDirectory, boundaryConfig);
  await assertConfigTooDeep(projectDirectory);
}

async function assertConfigTooDeep(projectDirectory) {
  const oversizedConfig = configWithNestingDepth(CONFIG_DEPTH_LIMIT + 1);
  writeProjectConfig(projectDirectory, oversizedConfig);
  const harness = makeHarness(projectDirectory, []);
  await harness.run();
  assert.strictEqual(harness.menus.length, 0);
  assert.ok(harness.messages.some(([, message]) => /64-level nesting safety limit/i.test(message.message)));
  assert.strictEqual(readProjectConfig(projectDirectory), oversizedConfig);
}

async function verifyModelCatalogLimit(projectDirectory) {
  const boundaryHarness = makeHarness(
    projectDirectory,
    ["developer", undefined],
    catalogWithModelCount(MODEL_CHOICE_LIMIT),
  );
  await boundaryHarness.run();
  assert.strictEqual(boundaryHarness.menus[1].options.length, MODEL_CHOICE_LIMIT);
  await assertModelCatalogTooLarge(projectDirectory);
}

async function assertModelCatalogTooLarge(projectDirectory) {
  const harness = makeHarness(
    projectDirectory,
    ["developer"],
    catalogWithModelCount(MODEL_CHOICE_LIMIT + 1),
  );
  await harness.run();
  assert.strictEqual(harness.menus.length, 1);
  assert.ok(harness.messages.some(([, message]) => /more than 2,000 models/i.test(message.message)));
  assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "opencode.jsonc")), false);
}

async function verifyVariantCatalogLimit(projectDirectory) {
  await assertVariantCatalogAccepted(projectDirectory);
  const originalConfig = readProjectConfig(projectDirectory);
  await assertVariantCatalogTooLarge(projectDirectory, originalConfig);
}

async function assertVariantCatalogAccepted(projectDirectory) {
  const harness = makeHarness(
    projectDirectory,
    ["developer", "bounded-provider/bounded-model", "variant-255"],
    catalogWithVariantCount(VARIANT_CHOICE_LIMIT),
  );
  await harness.run();
  assert.strictEqual(harness.menus[2].options.length, VARIANT_CHOICE_LIMIT + 1);
  assert.match(readProjectConfig(projectDirectory), /#variant-255/);
}

async function assertVariantCatalogTooLarge(projectDirectory, originalConfig) {
  const harness = makeHarness(
    projectDirectory,
    ["developer", "bounded-provider/bounded-model"],
    catalogWithVariantCount(VARIANT_CHOICE_LIMIT + 1),
  );
  await harness.run();
  assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
  assert.ok(harness.messages.some(([, message]) => /more than 256 variants/i.test(message.message)));
}

async function verifyModelReferenceLimit(projectDirectory) {
  const providerID = "p".repeat(128);
  const modelID = "m".repeat(128);
  const variantID = "v".repeat(64);
  const modelReference = `${providerID}/${modelID}#${variantID}`;
  const model = { id: modelID, providerID, name: "Boundary Model", variants: [{ id: variantID }] };
  const harness = makeHarness(projectDirectory, ["developer", `${providerID}/${modelID}`, variantID], [model]);
  await harness.run();
  assert.strictEqual(modelReference.length, MODEL_REFERENCE_LIMIT);
  assert.strictEqual(readSavedSubagentModel(projectDirectory), modelReference);
}

function readSavedSubagentModel(projectDirectory) {
  const configPath = join(projectDirectory, ".opencode", "opencode.jsonc");
  return parseProjectConfig(configPath).agents.developer.model;
}

async function verifyUnavailableVariantLimit(projectDirectory) {
  const originalConfig = '{"permission":{"shell":"ask"}}';
  writeProjectConfig(projectDirectory, originalConfig);
  const model = catalogAtReferenceFieldLimits()[0];
  const oversizedVariant = "x".repeat(65);
  const harness = makeHarness(
    projectDirectory,
    ["developer", `${model.providerID}/${model.id}`, oversizedVariant],
    [model],
  );
  await harness.run();
  assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
  assert.ok(harness.messages.some(([, message]) => /variant is not available/i.test(message.message)));
}

function runInstaller(projectDirectory, flags = [], environment = {}) {
  const packageManifest = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
  const installerBin = packageManifest.bin["openspec-multiagent-install-agent-models"];
  return spawnSync(
    process.execPath,
    [join(process.cwd(), installerBin), ...flags],
    {
      cwd: projectDirectory,
      encoding: "utf8",
      env: installerEnvironment(projectDirectory, environment),
    },
  );
}

function installerEnvironment(projectDirectory, environment) {
  return {
    ...process.env,
    XDG_CONFIG_HOME: join(projectDirectory, ".xdg-config"),
    ...environment,
  };
}

function createIncompleteToolkit(fixtureRoot) {
  const toolkitRoot = join(fixtureRoot, "toolkit");
  const scriptsDirectory = join(toolkitRoot, "scripts");
  const pluginDirectory = join(toolkitRoot, "opencode", "plugins", "agent-models");
  mkdirSync(scriptsDirectory, { recursive: true });
  mkdirSync(pluginDirectory, { recursive: true });
  cpSync(join(process.cwd(), "scripts", "install-agent-models.mjs"), join(scriptsDirectory, "install-agent-models.mjs"));
  cpSync(join(process.cwd(), "scripts", "lib.mjs"), join(scriptsDirectory, "lib.mjs"));
  cpSync(
    join(process.cwd(), "opencode", "plugins", "agent-models", "secure-project-fs.mjs"),
    join(pluginDirectory, "secure-project-fs.mjs"),
  );
  return join(scriptsDirectory, "install-agent-models.mjs");
}

function createExecutable(binDirectory, name, contents) {
  const executablePath = join(binDirectory, name);
  writeFileSync(executablePath, contents);
  chmodSync(executablePath, 0o755);
}

function createPrivateGitPackage(fixtureRoot) {
  const packageRoot = join(fixtureRoot, "package");
  mkdirSync(join(packageRoot, "scripts"), { recursive: true });
  cpSync(join(process.cwd(), "scripts", "install-agent-models.mjs"), join(packageRoot, "scripts", "install-agent-models.mjs"));
  cpSync(join(process.cwd(), "scripts", "lib.mjs"), join(packageRoot, "scripts", "lib.mjs"));
  cpSync(join(process.cwd(), "opencode", "plugins", "agent-models"), join(packageRoot, "opencode", "plugins", "agent-models"), { recursive: true });
  writePrivatePackageManifest(packageRoot);
  initializePrivateGitRepository(packageRoot);
  return packageRoot;
}

function writePrivatePackageManifest(packageRoot) {
  const packageManifest = {
    name: "openspec-multiagent",
    version: "1.1.0",
    private: true,
    type: "module",
    bin: { "openspec-multiagent-install-agent-models": "scripts/install-agent-models.mjs" },
  };
  writeFileSync(join(packageRoot, "package.json"), JSON.stringify(packageManifest));
}

function initializePrivateGitRepository(packageRoot) {
  runGitCommand(packageRoot, ["init"]);
  runGitCommand(packageRoot, ["add", "."]);
  runGitCommand(packageRoot, [
    "-c", "user.name=Fixture",
    "-c", "user.email=fixture@example.invalid",
    "commit", "-m", "private package fixture",
  ]);
}

function runGitCommand(packageRoot, gitArguments) {
  const gitRun = spawnSync("git", gitArguments, { cwd: packageRoot, encoding: "utf8" });
  if (gitRun.status !== 0) throw new Error(`Git fixture setup failed: ${gitRun.stderr}`);
}

async function verifyPrivateGitInstaller(projectDirectory) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "agent-model-git-package-"));
  try {
    const packageRoot = createPrivateGitPackage(fixtureRoot);
    const packageManifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
    assert.strictEqual(packageManifest.private, true);
    const installRun = runPrivateGitInstaller(packageRoot, projectDirectory, fixtureRoot);
    assert.strictEqual(installRun.status, 0, `${installRun.stdout}\n${installRun.stderr}`);
    assert.ok(existsSync(join(fixtureRoot, "config", "opencode", "plugins", "agent-models", "package.json")));
    assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "plugins")), false);
    assert.match(installRun.stdout, /config.*opencode.*plugins.*agent-models/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function runPrivateGitInstaller(packageRoot, projectDirectory, fixtureRoot) {
  return spawnSync("npx", privateGitInstallerArguments(packageRoot), {
    cwd: projectDirectory,
    encoding: "utf8",
    env: privateGitInstallerEnvironment(fixtureRoot),
  });
}

function privateGitInstallerArguments(packageRoot) {
  return [
    "--yes",
    "--offline",
    `--package=git+file://${packageRoot}`,
    "openspec-multiagent-install-agent-models",
  ];
}

function privateGitInstallerEnvironment(fixtureRoot) {
  return {
    ...process.env,
    NPM_CONFIG_CACHE: join(fixtureRoot, "npm-cache"),
    XDG_CONFIG_HOME: join(fixtureRoot, "config"),
  };
}

function nextTurn() {
  return new Promise((resolve) => setImmediate(resolve));
}

function runInit(projectDirectory, environment) {
  return spawnSync(
    process.execPath,
    [
      join(process.cwd(), "scripts", "init.mjs"),
      "--skip-openspec-init",
      "--skip-context7",
      "--engram",
      "none",
      "--no-prompt",
    ],
    { cwd: projectDirectory, env: environment, encoding: "utf8" },
  );
}

function assertLoadingPrecedesCatalogSync(harness) {
  const loadingIndex = harness.events.findIndex((event) => event.includes("Loading"));
  assert.ok(loadingIndex >= 0, "loading status is shown");
  assert.ok(loadingIndex < harness.events.indexOf("catalog-sync"), "loading is announced before catalog loading");
}

if (process.platform !== "linux" || !existsSync("/proc/self/fd")) {
  await test("selector fails closed when anchored project file operations are unavailable", async () => {
    await withProject(async (projectDirectory) => {
      const harness = makeHarness(projectDirectory, []);
      await harness.run();
      assert.strictEqual(harness.menus.length, 0);
      assert.ok(harness.messages.some(([, message]) => /Linux with \/proc\/self\/fd/i.test(message.message)));
      assert.strictEqual(existsSync(join(projectDirectory, ".opencode")), false);
      const installerRun = runInstaller(projectDirectory);
      assert.notStrictEqual(installerRun.status, 0);
      assert.strictEqual(existsSync(join(projectDirectory, ".opencode")), false);
      assert.strictEqual(existsSync(join(projectDirectory, ".xdg-config")), false);
    });
  });
  console.log(`\nAgent model plugin tests: ${passed} passed, ${failed} failed; Linux descriptor tests skipped`);
  process.exit(failed > 0 ? 1 : 0);
}

await test("registers /agent-models and displays all bundled roles with current assignments", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(projectDirectory, '{"model":"provider-a/model-a","agents":{"developer":{"model":"retired/old"}}}');
    const harness = makeHarness(projectDirectory, []);
    await harness.run();
    const roleDialog = harness.menus[0];
    assert.ok(roleDialog, "role selector opened");
    assert.strictEqual(harness.registeredCommand.slash.name, "agent-models");
    assert.match(roleDialog.title, /use arrows and Enter; Esc cancels/i);
    assert.strictEqual(roleDialog.options.length, BUNDLED_ROLES.length);
    assert.ok(roleDialog.options.some((option) => option.title.includes("@architect")));
    assert.ok(roleDialog.options.some((option) => option.description?.includes("retired/old")));
  });
});

await test("reads object-form root and subagent model selectors", async () => {
  await withProject(async (projectDirectory) => {
    const config = {
      model: { providerID: "openrouter", model: "anthropic/claude-sonnet", variant: "high" },
      agents: {
        developer: {
          model: { providerID: "provider-a", model: "model-a", variant: "deep" },
        },
      },
    };
    writeProjectConfig(projectDirectory, JSON.stringify(config));
    const harness = makeHarness(projectDirectory, []);
    await harness.run();
    assert.ok(harness.menus[0].options.some((option) =>
      option.description?.includes("openrouter/anthropic/claude-sonnet#high"),
    ));
    assert.ok(harness.menus[0].options.some((option) =>
      option.description?.includes("provider-a/model-a#deep"),
    ));
  });
});

await test("replaces object-form root model selector after architect confirmation", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(
      projectDirectory,
      '{"model":{"providerID":"provider-a","model":"model-a"},"permission":{"shell":"ask"}}',
    );
    const harness = makeHarness(projectDirectory, ["architect", "provider-b/model-b", true]);
    await harness.run();
    const persistedConfig = parseProjectConfig(join(projectDirectory, ".opencode", "opencode.jsonc"));
    assert.strictEqual(persistedConfig.model, "provider-b/model-b");
    assert.strictEqual(persistedConfig.permission.shell, "ask");
  });
});

await test("replaces object-form subagent model selector with the selected assignment", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(
      projectDirectory,
      '{"agents":{"developer":{"model":{"providerID":"provider-a","model":"model-a","variant":"deep"},"temperature":0.2}}}',
    );
    const harness = makeHarness(projectDirectory, ["developer", "provider-b/model-b"]);
    await harness.run();
    const persistedConfig = parseProjectConfig(join(projectDirectory, ".opencode", "opencode.jsonc"));
    assert.strictEqual(persistedConfig.agents.developer.model, "provider-b/model-b");
    assert.strictEqual(persistedConfig.agents.developer.temperature, 0.2);
  });
});

await test("plugin package exposes server and TUI entries with valid JavaScript sources", async () => {
  const pluginDirectory = join(process.cwd(), "opencode", "plugins", "agent-models");
  const packageManifest = JSON.parse(readFileSync(join(pluginDirectory, "package.json"), "utf8"));
  assert.strictEqual(packageManifest.exports["."], "./index.js");
  assert.strictEqual(packageManifest.exports["./tui"], "./tui.js");
  assert.strictEqual(
    JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"))
      .bin["openspec-multiagent-install-agent-models"],
    "scripts/install-agent-models.mjs",
  );
  for (const sourceFile of [
    "index.js",
    "tui.js",
    "routing.mjs",
    "project-config.mjs",
    "model-reference.mjs",
    "secure-project-fs.mjs",
    "safety-limits.mjs",
  ]) {
    const syntaxCheck = spawnSync(process.execPath, ["--check", join(pluginDirectory, sourceFile)], {
      encoding: "utf8",
    });
    assert.strictEqual(syntaxCheck.status, 0, `${sourceFile}: ${syntaxCheck.stderr}`);
  }
});

await test("installer errors do not disclose toolkit or target paths", async () => {
  await withProject(async (projectDirectory) => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "agent-model-incomplete-toolkit-"));
    try {
      const installerScript = createIncompleteToolkit(fixtureRoot);
      const installRun = spawnSync(process.execPath, [installerScript], {
        cwd: projectDirectory,
        encoding: "utf8",
      });
      assert.strictEqual(installRun.status, 1);
      assert.match(installRun.stderr, /plugin sources are incomplete; reinstall the toolkit/i);
      assert.strictEqual(installRun.stderr.includes(fixtureRoot), false);
      assert.strictEqual(installRun.stderr.includes(projectDirectory), false);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});

await test("private Git package bin installs plugin from a temporary target project", async () => {
  await withProject(verifyPrivateGitInstaller);
});

await test("loads the active location catalog and offers subagent variants plus default", async () => {
  await withProject(async (projectDirectory) => {
    const harness = makeHarness(projectDirectory, ["developer", "provider-a/model-a", "fast"]);
    await harness.run();
    assertLoadingPrecedesCatalogSync(harness);
    assert.deepStrictEqual(harness.trace, [
      ["sync", harness.context.location],
      ["list", harness.context.location],
    ]);
    assert.deepStrictEqual(
      harness.menus[1].options.map((option) => option.value),
      ["provider-a/model-a", "provider-b/model-b"],
    );
    assert.ok(harness.menus[1].options.every((option) => option.title && option.description));
    assert.deepStrictEqual(harness.menus[2].options.map((option) => option.value), ["", "fast", "deep"]);
    assert.match(readProjectConfig(projectDirectory), /provider-a\/model-a#fast/);
  });
});

await test("rejects empty, oversized, and control-character catalog identifiers and variants", async () => {
  await withProject(async (projectDirectory) => {
    const catalog = [
      ...CATALOG,
      { id: "", providerID: "provider-a", name: "Empty ID" },
      { id: "x".repeat(129), providerID: "provider-a", name: "Long ID" },
      { id: "bad\nmodel", providerID: "provider-a", name: "Control ID" },
      { id: "model", providerID: "", name: "Empty provider" },
      { id: "model", providerID: "p".repeat(129), name: "Long provider" },
      { id: "model", providerID: "provider\nid", name: "Control provider" },
      { id: "model", providerID: "provider-a", name: "" },
      { id: "model", providerID: "provider-a", name: "n".repeat(513) },
      { id: "unsafe-name", providerID: "provider-a", name: "Bad\u001bName" },
      {
        id: "model-c",
        providerID: "provider-c",
        name: "Model C",
        variants: [{ id: "" }, { id: "v".repeat(65) }, { id: "bad\nvariant" }, { id: "valid" }],
      },
    ];
    const harness = makeHarness(
      projectDirectory,
      ["developer", "provider-c/model-c", "valid"],
      catalog,
    );
    await harness.run();
    assert.deepStrictEqual(
      harness.menus[1].options.map((option) => option.value),
      ["provider-a/model-a", "provider-b/model-b", "provider-c/model-c"],
    );
    assert.deepStrictEqual(harness.menus[2].options.map((option) => option.value), ["", "valid"]);
  });
});

await test("refuses empty, oversized, and control-character configured references", async () => {
  await withProject(async (projectDirectory) => {
    const invalidReferences = [
      "",
      `provider/${"m".repeat(129)}`,
      `${"p".repeat(129)}/model`,
      "provider/model\ninjection",
      "provider/model#",
      `provider/model#${"v".repeat(65)}`,
      "provider/model#bad\nvariant",
    ];
    for (const invalidReference of invalidReferences) {
      const configText = JSON.stringify({
        agents: { developer: { model: invalidReference } },
      });
      writeProjectConfig(projectDirectory, configText);
      const harness = makeHarness(projectDirectory, []);
      await harness.run();
      assert.strictEqual(readProjectConfig(projectDirectory), configText);
      assert.ok(harness.messages.some(([, message]) => /could not be read safely/i.test(message.message)));
    }
  });
});

await test("accepts OpenCode provider, model, and variant IDs at their schema maxima", () =>
  withProject(verifyModelReferenceLimit));

await test("rejects over-limit and unavailable variants without persisting a combined model reference", () =>
  withProject(verifyUnavailableVariantLimit));

await test("accepts a 1 MiB config and rejects a larger file without writing", () =>
  withProject(verifyConfigByteLimit));

await test("accepts 64 config nesting levels and rejects the 65th without writing", () =>
  withProject(verifyConfigDepthLimit));

await test("accepts 2,000 catalog models and rejects model 2,001 before building choices", () =>
  withProject(verifyModelCatalogLimit));

await test("accepts 256 variants and rejects variant 257 without writing", () =>
  withProject(verifyVariantCatalogLimit));

await test("accepts exact model-reference field bounds and persists a 322-character reference", () =>
  withProject(verifyModelReferenceLimit));

await test("rejects injected unavailable variants that exceed the combined reference limit", () =>
  withProject(verifyUnavailableVariantLimit));

await test("does not offer variants for @architect and confirms the primary-session effect", async () => {
  await withProject(async (projectDirectory) => {
    const harness = makeHarness(projectDirectory, ["architect", "provider-a/model-a", true]);
    await harness.run();
    assert.strictEqual(harness.menus.length, 2);
    assert.strictEqual(harness.menus[1].options.length, CATALOG.length);
    assert.strictEqual(harness.messages.at(-2)[0], "confirm");
    assert.match(harness.messages.at(-2)[1].message, /all primary agents in new sessions/i);
    assert.match(harness.messages.at(-2)[1].message, /already-open session/i);
    assert.match(readProjectConfig(projectDirectory), /"model":\s*"provider-a\/model-a"/);
  });
});

await test("offers a no-variant choice and cancels without writing", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(projectDirectory, '{"agents":{"developer":{"model":"provider-a/model-a"}}}');
    const originalConfig = readProjectConfig(projectDirectory);
    const harness = makeHarness(projectDirectory, ["developer", "provider-a/model-a", ""]);
    await harness.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
    assert.ok(harness.menus[2].options.some((option) => option.value === ""));
  });
});

await test("keeps unavailable current model identifiers visible for replacement", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(projectDirectory, '{"agents":{"developer":{"model":"retired/old#legacy"}}}');
    const harness = makeHarness(projectDirectory, []);
    await harness.run();
    assert.ok(harness.menus[0].options.some((option) => option.description?.includes("retired/old#legacy")));
  });
});

await test("replaces an unavailable subagent assignment with a catalog model", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(projectDirectory, '{"agents":{"developer":{"model":"retired/old#legacy"}}}');
    const harness = makeHarness(projectDirectory, ["developer", "provider-b/model-b"]);
    await harness.run();
    assert.strictEqual(
      parseProjectConfig(join(projectDirectory, ".opencode", "opencode.jsonc")).agents.developer.model,
      "provider-b/model-b",
    );
    assert.ok(harness.menus[0].options.some((option) => option.description?.includes("retired/old#legacy")));
  });
});

await test("empty catalog explains no models and leaves configuration unchanged", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(projectDirectory, '{"model":"existing/model"}');
    const originalConfig = readProjectConfig(projectDirectory);
    const harness = makeHarness(projectDirectory, ["developer"], []);
    await harness.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
    assert.ok(harness.messages.some(([, message]) => /no models are available/i.test(message.message)));
  });
});

await test("catalog errors explain failure without changing configuration", async () => {
  await withProject(async (projectDirectory) => {
    writeProjectConfig(projectDirectory, '{"model":"existing/model"}');
    const originalConfig = readProjectConfig(projectDirectory);
    const harness = makeHarness(projectDirectory, ["developer"]);
    harness.context.data.location.model.sync = async () => {
      throw new Error("catalog unavailable");
    };
    await harness.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
    assert.ok(harness.messages.some(([, message]) => /could not load models/i.test(message.message)));
  });
});

await test("architect confirmation cancellation and role cancellation do not write", async () => {
  await withProject(async (projectDirectory) => {
    const originalConfig = '{"model":"existing/model"}';
    writeProjectConfig(projectDirectory, originalConfig);
    const cancelledConfirmation = makeHarness(projectDirectory, ["architect", "provider-a/model-a", false]);
    await cancelledConfirmation.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
    const cancelledRole = makeHarness(projectDirectory, []);
    await cancelledRole.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
  });
});

await test("configuration write stays project-local when .opencode is replaced before save", async () => {
  await withProject(async (projectDirectory) => {
    const externalDirectory = makeProject();
    try {
      const externalConfig = join(externalDirectory, "opencode.jsonc");
      writeFileSync(externalConfig, '{"model":"outside/model"}');
      writeProjectConfig(projectDirectory, '{"agents":{"developer":{"model":"provider-a/model-a"}}}');
      const harness = makeHarness(projectDirectory, ["developer", "provider-b/model-b"]);
      replaceConfigDirectoryDuringModelChoice(harness, projectDirectory, externalDirectory);
      await harness.run();
      assert.strictEqual(readFileSync(externalConfig, "utf8"), '{"model":"outside/model"}');
      assert.ok(harness.messages.some(([, message]) => /assignment was not saved/i.test(message.message)));
      assert.strictEqual(
        harness.messages.some(([, message]) => message.title === "Assignment saved"),
        false,
      );
    } finally {
      rmSync(externalDirectory, { recursive: true, force: true });
    }
  });
});

function replaceConfigDirectoryDuringModelChoice(harness, projectDirectory, externalDirectory) {
  const selectDialog = harness.context.ui.dialog.select;
  harness.context.ui.dialog.select = async (dialog) => {
    const selection = await selectDialog(dialog);
    if (dialog.title.includes("choose an available model")) {
      renameSync(join(projectDirectory, ".opencode"), join(projectDirectory, ".opencode-held"));
      symlinkSync(externalDirectory, join(projectDirectory, ".opencode"), "dir");
    }
    return selection;
  };
}

await test("updates JSONC in project config while preserving comments and unrelated settings", async () => {
  await withProject(async (projectDirectory) => {
    await verifyJsoncAssignment(projectDirectory);
  });
});

function jsoncFixtureText() {
  return `{
  // Keep project behavior.
  "permission": { "shell": "ask" },
  "agents": {
    // Keep this role setting.
    "developer": { "temperature": 0.2 }
  }
}`;
}

async function verifyJsoncAssignment(projectDirectory) {
  writeProjectConfig(projectDirectory, jsoncFixtureText());
  await makeHarness(projectDirectory, ["developer", "provider-a/model-a", "deep"]).run();
  assertJsoncAssignment(projectDirectory);
}

function assertJsoncAssignment(projectDirectory) {
  const updatedConfig = readProjectConfig(projectDirectory);
  assert.ok(updatedConfig.includes("// Keep project behavior."));
  assert.ok(updatedConfig.includes("// Keep this role setting."));
  assert.ok(updatedConfig.includes('"temperature": 0.2'));
  assert.ok(updatedConfig.includes('"model": "provider-a/model-a#deep"'));
  const parsedConfig = parseProjectConfig(join(projectDirectory, ".opencode", "opencode.jsonc"));
  assert.strictEqual(parsedConfig.agents.developer.model, "provider-a/model-a#deep");
  assert.strictEqual(parsedConfig.permission.shell, "ask");
}

await test("refuses malformed JSONC and reports that configuration cannot be read safely", async () => {
  await withProject(async (projectDirectory) => {
    const originalConfig = `{"agents": // broken`;
    writeProjectConfig(projectDirectory, originalConfig);
    const harness = makeHarness(projectDirectory, ["developer", "provider-a/model-a", "fast"]);
    await harness.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
    assert.ok(harness.messages.some(([, message]) => /could not be read safely/i.test(message.message)));
  });
});

await test("reports a failed assignment and preserves invalid role configuration", async () => {
  await withProject(async (projectDirectory) => {
    const originalConfig = '{"agents":{"developer":"custom"}}';
    writeProjectConfig(projectDirectory, originalConfig);
    const harness = makeHarness(projectDirectory, ["developer", "provider-a/model-a", "fast"]);
    await harness.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
    assert.ok(harness.messages.some(([, message]) => /assignment was not saved/i.test(message.message)));
  });
});

await test("cancelling model or variant selection makes no config change", async () => {
  await withProject(async (projectDirectory) => {
    const originalConfig = '{"agents":{"developer":{"model":"existing/model"}}}';
    writeProjectConfig(projectDirectory, originalConfig);
    const cancelledModel = makeHarness(projectDirectory, ["developer"]);
    await cancelledModel.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
    const cancelledVariant = makeHarness(projectDirectory, ["developer", "provider-a/model-a"]);
    await cancelledVariant.run();
    assert.strictEqual(readProjectConfig(projectDirectory), originalConfig);
  });
});

await test("writes only project configuration and leaves user-level config untouched", async () => {
  await withProject(async (projectDirectory) => {
    await withUserConfigFixture(async (globalPath) => {
      await makeHarness(projectDirectory, ["developer", "provider-b/model-b"]).run();
      assertUnchangedGlobalConfig(globalPath);
      assertProjectModelSaved(projectDirectory, "provider-b/model-b");
    });
  });
});

await test("creates the project-local default config when no recognized config exists", async () => {
  await withProject(async (projectDirectory) => {
    const defaultConfig = join(projectDirectory, ".opencode", "opencode.jsonc");
    await makeHarness(projectDirectory, ["developer", "provider-b/model-b"]).run();
    assert.strictEqual(parseProjectConfig(defaultConfig).agents.developer.model, "provider-b/model-b");
  });
});

await test("model assignments remain independent across active projects", async () => {
  await withProject(async (firstProject) => {
    await withProject(async (secondProject) => {
      await withUserConfigFixture(async (globalPath) => {
        await makeHarness(firstProject, ["developer", "provider-a/model-a", "fast"]).run();
        await makeHarness(secondProject, ["developer", "provider-b/model-b"]).run();
        await makeHarness(firstProject, ["developer", "provider-b/model-b"]).run();
        await makeHarness(firstProject, ["developer", "provider-a/model-a", "fast"]).run();
        assert.strictEqual(readSavedSubagentModel(firstProject), "provider-a/model-a#fast");
        assert.strictEqual(readSavedSubagentModel(secondProject), "provider-b/model-b");
        assertUnchangedGlobalConfig(globalPath);
      });
    });
  });
});

function assertUnchangedGlobalConfig(globalPath) {
  assert.strictEqual(readFileSync(globalPath, "utf8"), '{"model":"user/model"}');
}

function assertProjectModelSaved(projectDirectory, modelReference) {
  const savedConfig = readProjectConfig(projectDirectory);
  assert.ok(savedConfig.includes(modelReference));
}

await test("success feedback is emitted only after the project write completes", async () => {
  await withProject(async (projectDirectory) => {
    const harness = makeHarness(projectDirectory, ["developer", "provider-b/model-b"]);
    await harness.run();
    const savedConfig = readProjectConfig(projectDirectory);
    assert.match(savedConfig, /"model": "provider-b\/model-b"/);
    assert.ok(harness.messages.some(([, message]) => message.title === "Assignment saved"));
  });
});

await test("waits for the project model catalog before allowing model selection", async () => {
  await withProject(async (projectDirectory) => {
    const harness = makeHarness(projectDirectory, ["developer", "provider-b/model-b"]);
    let finishCatalog;
    harness.context.data.location.model.sync = () => new Promise((resolve) => {
      finishCatalog = resolve;
    });
    const menuRun = harness.run();
    await nextTurn();
    assert.strictEqual(harness.menus.length, 1, "only the role menu is available while catalog loads");
    finishCatalog();
    await menuRun;
    assert.strictEqual(harness.menus.length, 2, "model menu opens after catalog completes");
  });
});

await test("writes to a recognized project-root config when no .opencode config exists", async () => {
  await withProject(async (projectDirectory) => {
    const rootConfigPath = join(projectDirectory, "opencode.jsonc");
    writeFileSync(rootConfigPath, '{"model":"existing/model"}');
    await makeHarness(projectDirectory, ["developer", "provider-b/model-b"]).run();
    assert.match(readFileSync(rootConfigPath, "utf8"), /provider-b\/model-b/);
    assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "opencode.jsonc")), false);
  });
});

await test("prefers the effective .opencode config over a conflicting project-root config", async () => {
  await withProject(async (projectDirectory) => {
    const rootConfigPath = join(projectDirectory, "opencode.jsonc");
    const localConfigPath = join(projectDirectory, ".opencode", "opencode.jsonc");
    const rootConfigText = '{"agents":{"developer":{"model":"provider-a/model-a"}}}';
    writeFileSync(
      rootConfigPath,
      rootConfigText,
    );
    writeProjectConfig(
      projectDirectory,
      '{"agents":{"developer":{"model":"provider-b/model-b"}}}',
    );

    const harness = makeHarness(projectDirectory, ["developer", "provider-a/model-a", ""]);
    await harness.run();

    const localRole = harness.menus[0].options.find((option) => option.value === "developer");
    assert.match(localRole.description, /provider-b\/model-b/);
    assert.strictEqual(
      parseProjectConfig(localConfigPath).agents.developer.model,
      "provider-a/model-a",
    );
    assert.strictEqual(readFileSync(rootConfigPath, "utf8"), rootConfigText);
  });
});

await test("updates the effective JSONC config when both .opencode config files exist", async () => {
  await withProject(async (projectDirectory) => {
    const configDirectory = join(projectDirectory, ".opencode");
    mkdirSync(configDirectory, { recursive: true });
    writeFileSync(
      join(configDirectory, "opencode.json"),
      '{"model":"provider-a/model-a","agents":{"developer":{"model":"provider-a/model-a"}}}',
    );
    writeFileSync(
      join(configDirectory, "opencode.jsonc"),
      '// OpenCode merges this after opencode.json.\n{"model":"provider-b/model-b","agents":{"developer":{"model":"provider-b/model-b"}}}',
    );
    const harness = makeHarness(projectDirectory, ["developer", "provider-a/model-a", ""]);
    await harness.run();
    assert.ok(harness.menus[0].options.find((option) => option.value === "developer")
      .description.includes("provider-b/model-b"));
    const effectiveConfig = parseProjectConfig(join(configDirectory, "opencode.jsonc"));
    assert.strictEqual(effectiveConfig.agents.developer.model, "provider-a/model-a");
    assert.strictEqual(effectiveConfig.model, "provider-b/model-b");
    assert.match(readFileSync(join(configDirectory, "opencode.json"), "utf8"), /provider-a\/model-a/);
  });
});

await test("plugin installer dry-run reports the global destination without writing", async () => {
  await withProject(async (projectDirectory) => {
    const installPreview = runInstaller(projectDirectory, ["--dry-run"]);
    assert.strictEqual(installPreview.status, 0, installPreview.stderr);
    assert.match(installPreview.stdout, /\.xdg-config.*opencode.*plugins.*agent-models/);
    assert.strictEqual(existsSync(join(projectDirectory, ".xdg-config")), false);
    assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "plugins")), false);
  });
});

await test("plugin installer skips the global copy unless force is selected", async () => {
  await withProject(async (projectDirectory) => {
    const firstInstall = runInstaller(projectDirectory);
    assert.strictEqual(firstInstall.status, 0, firstInstall.stderr);
    const pluginPath = join(projectDirectory, ".xdg-config", "opencode", "plugins", "agent-models");
    const routingPath = join(pluginPath, "routing.mjs");
    assert.ok(existsSync(join(pluginPath, "package.json")));
    const originalRouting = readFileSync(routingPath, "utf8");
    writeFileSync(routingPath, "custom plugin copy");
    const skippedInstall = runInstaller(projectDirectory);
    assert.strictEqual(skippedInstall.status, 0, skippedInstall.stderr);
    assert.strictEqual(readFileSync(routingPath, "utf8"), "custom plugin copy");
    const forcedInstall = runInstaller(projectDirectory, ["--force"]);
    assert.strictEqual(forcedInstall.status, 0, forcedInstall.stderr);
    assert.strictEqual(readFileSync(routingPath, "utf8"), originalRouting);
    assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "plugins")), false);
  });
});

await test("global plugin installation leaves global JSON and project plugin directories unchanged", async () => {
  await withProject(async (projectDirectory) => {
    await withUserConfigFixture(async (globalPath, configHome) => {
      const install = runInstaller(projectDirectory, [], { XDG_CONFIG_HOME: configHome });
      assert.strictEqual(install.status, 0, install.stderr);
      assert.ok(existsSync(join(configHome, "opencode", "plugins", "agent-models", "package.json")));
      assertUnchangedGlobalConfig(globalPath);
      assert.strictEqual(existsSync(join(configHome, "opencode", "cli.json")), false);
      assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "plugins")), false);
    });
  });
});

await test("plugin installer refuses symlink global plugin destinations", async () => {
  if (process.platform === "win32") return;
  await withProject(async (projectDirectory) => {
    const externalDirectory = makeProject();
    const configHome = join(projectDirectory, ".xdg-config");
    const globalDirectory = join(configHome, "opencode");
    try {
      mkdirSync(globalDirectory, { recursive: true });
      symlinkSync(externalDirectory, join(globalDirectory, "plugins"), "dir");
      const install = runInstaller(projectDirectory, ["--force"], { XDG_CONFIG_HOME: configHome });
      assert.notStrictEqual(install.status, 0);
      assert.strictEqual(install.stderr.includes(projectDirectory), false);
      assert.strictEqual(install.stderr.includes(externalDirectory), false);
      assert.strictEqual(existsSync(join(externalDirectory, "agent-models")), false);
    } finally {
      rmSync(externalDirectory, { recursive: true, force: true });
    }
  });
});

await test("plugin installer fails safely when the global plugins path is unavailable", async () => {
  await withProject(async (projectDirectory) => {
    const configHome = join(projectDirectory, ".xdg-config");
    const globalDirectory = join(configHome, "opencode");
    mkdirSync(globalDirectory, { recursive: true });
    writeFileSync(join(globalDirectory, "opencode.json"), '{"model":"user/model"}');
    writeFileSync(join(globalDirectory, "plugins"), "blocked destination");
    const install = runInstaller(projectDirectory, [], { XDG_CONFIG_HOME: configHome });
    assert.notStrictEqual(install.status, 0);
    assert.strictEqual(readFileSync(join(globalDirectory, "opencode.json"), "utf8"), '{"model":"user/model"}');
    assert.strictEqual(readFileSync(join(globalDirectory, "plugins"), "utf8"), "blocked destination");
    assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "plugins")), false);
  });
});

await test("plugin installer refuses broken file symlinks during forced replacement", async () => {
  if (process.platform === "win32") return;
  await withProject(async (projectDirectory) => {
    const externalDirectory = makeProject();
    try {
      await verifyBrokenSymlinkRefusal(projectDirectory, externalDirectory);
    } finally {
      rmSync(externalDirectory, { recursive: true, force: true });
    }
  });
});

await test("anchored plugin copy stays inside the pinned project after path replacement", async () => {
  await withProject(async (projectDirectory) => {
    const externalDirectory = makeProject();
    const externalPlugin = join(externalDirectory, "plugins", "agent-models");
    mkdirSync(externalPlugin, { recursive: true });
    const outsideFile = join(externalPlugin, "routing.mjs");
    writeFileSync(outsideFile, "outside marker");
    const descriptors = openPinnedPluginDirectory(projectDirectory);
    try {
      renameSync(join(projectDirectory, ".opencode"), join(projectDirectory, ".opencode-held"));
      symlinkSync(externalDirectory, join(projectDirectory, ".opencode"), "dir");
      const sourceFile = join(process.cwd(), "opencode", "plugins", "agent-models", "routing.mjs");
      copyProjectFileAtomically(sourceFile, descriptors.pluginDescriptor, "routing.mjs");
      const containedCopy = join(projectDirectory, ".opencode-held", "plugins", "agent-models", "routing.mjs");
      assert.strictEqual(readFileSync(containedCopy, "utf8"), readFileSync(sourceFile, "utf8"));
      assert.strictEqual(readFileSync(outsideFile, "utf8"), "outside marker");
    } finally {
      closeProjectDescriptor(descriptors.pluginDescriptor);
      closeProjectDescriptor(descriptors.rootDescriptor);
      rmSync(externalDirectory, { recursive: true, force: true });
    }
  });
});

await test("descriptor-relative filesystem rejects traversal components", async () => {
  await withProject(async (projectDirectory) => {
    const rootDescriptor = openProjectDirectory(projectDirectory);
    try {
      assert.throws(
        () => openProjectChildDirectory(rootDescriptor, "../outside"),
        /single safe path component/,
      );
    } finally {
      closeProjectDescriptor(rootDescriptor);
    }
  });
});

function openPinnedPluginDirectory(projectDirectory) {
  const rootDescriptor = openProjectDirectory(projectDirectory);
  try {
    const opencodeDescriptor = createProjectChildDirectory(rootDescriptor, ".opencode");
    try {
      return openPinnedPluginSubdirectory(rootDescriptor, opencodeDescriptor);
    } finally {
      closeProjectDescriptor(opencodeDescriptor);
    }
  } catch (error) {
    closeProjectDescriptor(rootDescriptor);
    throw error;
  }
}

function openPinnedPluginSubdirectory(rootDescriptor, opencodeDescriptor) {
  const pluginsDescriptor = createProjectChildDirectory(opencodeDescriptor, "plugins");
  try {
    const pluginDescriptor = createProjectChildDirectory(pluginsDescriptor, "agent-models");
    return { pluginDescriptor, rootDescriptor };
  } finally {
    closeProjectDescriptor(pluginsDescriptor);
  }
}

async function verifyBrokenSymlinkRefusal(projectDirectory, externalDirectory) {
  const install = runInstaller(projectDirectory);
  assert.strictEqual(install.status, 0, install.stderr);
  const routingPath = join(projectDirectory, ".xdg-config", "opencode", "plugins", "agent-models", "routing.mjs");
  const externalFile = join(externalDirectory, "routing.mjs");
  rmSync(routingPath);
  symlinkSync(externalFile, routingPath, "file");
  const forcedInstall = runInstaller(projectDirectory, ["--force"]);
  assert.notStrictEqual(forcedInstall.status, 0);
  assert.strictEqual(forcedInstall.stderr.includes(projectDirectory), false);
  assert.strictEqual(forcedInstall.stderr.includes(externalDirectory), false);
  assert.strictEqual(existsSync(externalFile), false);
}

await test("init installs project agents and selector with external integrations isolated", async () => {
  await withProject(verifyIsolatedInitialization);
});

async function verifyIsolatedInitialization(projectDirectory) {
  const fixture = createInitFixture();
  const secondProject = makeProject();
  try {
    verifyInitAcrossProjects(projectDirectory, secondProject, fixture);
  } finally {
    rmSync(secondProject, { recursive: true, force: true });
    rmSync(fixture.directory, { recursive: true, force: true });
  }
}

function verifyInitAcrossProjects(firstProject, secondProject, fixture) {
  const firstInit = runInit(firstProject, fixture.environment);
  assertInitInstall(firstInit, firstProject, fixture.globalPath);
  const pluginPath = join(fixture.directory, "config", "opencode", "plugins", "agent-models", "routing.mjs");
  const installedRouting = readFileSync(pluginPath, "utf8");
  const secondInit = runInit(secondProject, fixture.environment);
  assertInitInstall(secondInit, secondProject, fixture.globalPath);
  const repeatedInit = runInit(firstProject, fixture.environment);
  assertInitInstall(repeatedInit, firstProject, fixture.globalPath);
  assert.strictEqual(readFileSync(pluginPath, "utf8"), installedRouting);
}

function createInitFixture() {
  const directory = mkdtempSync(join(tmpdir(), "agent-model-init-"));
  const fixturePaths = createInitFixturePaths(directory);
  prepareInitFixture(fixturePaths);
  return { directory, environment: initEnvironment(fixturePaths), globalPath: fixturePaths.globalPath };
}

function createInitFixturePaths(directory) {
  const binDirectory = join(directory, "bin");
  const configHome = join(directory, "config");
  const globalDirectory = join(configHome, "opencode");
  mkdirSync(binDirectory, { recursive: true });
  mkdirSync(globalDirectory, { recursive: true });
  return { binDirectory, configHome, globalDirectory, globalPath: join(globalDirectory, "opencode.json") };
}

function prepareInitFixture(fixturePaths) {
  writeFileSync(fixturePaths.globalPath, '{"model":"user/model"}');
  createExecutable(fixturePaths.binDirectory, "codegraph", "#!/bin/sh\nexit 0\n");
  createExecutable(fixturePaths.binDirectory, "openspec", "#!/bin/sh\nprintf '1.14.3\\n'\n");
  createExecutable(fixturePaths.binDirectory, "ctx7", "#!/bin/sh\nexit 0\n");
}

function initEnvironment(fixturePaths) {
  return {
    ...process.env,
    PATH: `${fixturePaths.binDirectory}${delimiter}${process.env.PATH}`,
    XDG_CONFIG_HOME: fixturePaths.configHome,
  };
}

function assertInitInstall(initRun, projectDirectory, globalPath) {
  assert.strictEqual(initRun.status, 0, `${initRun.stdout}\n${initRun.stderr}`);
  assert.ok(existsSync(join(projectDirectory, ".opencode", "agents", "architect.md")));
  assert.ok(existsSync(join(projectDirectory, ".opencode", "agents", "developer.md")));
  assert.ok(existsSync(join(globalPath, "..", "plugins", "agent-models", "package.json")));
  assert.strictEqual(existsSync(join(projectDirectory, ".opencode", "plugins")), false);
  assert.strictEqual(existsSync(join(globalPath, "..", "cli.json")), false);
  assertUnchangedGlobalConfig(globalPath);
}
console.log(`\nAgent model plugin tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
