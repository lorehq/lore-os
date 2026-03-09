// Shared utilities for Lore OS hook scripts.
// Vanilla Node.js — no npm packages.

import { readFileSync, readSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { createHash } from "node:crypto";

// ── Stdin ───────────────────────────────────────────────────────────

/** Read all of stdin synchronously and parse as JSON. */
export function readStdin() {
  const chunks = [];
  const buf = Buffer.alloc(4096);
  try {
    let n;
    while ((n = readSync(0, buf)) > 0) {
      chunks.push(Buffer.from(buf.subarray(0, n)));
    }
  } catch {
    // EOF or broken pipe
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── Config / Profile ────────────────────────────────────────────────

const LORE_OS_DIR = resolve(dirname(new URL(import.meta.url).pathname), "..");

/** Load Lore OS config.json (profiles + thresholds). */
function loadOSConfig() {
  try {
    return JSON.parse(readFileSync(join(LORE_OS_DIR, "config.json"), "utf8"));
  } catch {
    return { profiles: {}, defaultProfile: "standard" };
  }
}

/** Read the active profile name from .lore/config.json. */
function readProjectProfile() {
  try {
    const data = JSON.parse(
      readFileSync(join(process.cwd(), ".lore", "config.json"), "utf8")
    );
    return data.profile || "";
  } catch {
    return "";
  }
}

/** Resolve the active profile's behavior flags + thresholds. */
export function resolveProfile() {
  const os = loadOSConfig();
  const profiles = os.profiles || {};
  const name = readProjectProfile() || os.defaultProfile || "standard";
  const profile = profiles[name] || profiles["standard"] || {};
  return { name, ...profile };
}

// ── Path helpers ────────────────────────────────────────────────────

export function globalPath() {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) return join(xdg, "lore");
  return join(homedir(), ".config", "lore");
}

export function extractFilePath(toolName, toolInput) {
  if (!toolInput) return "";
  switch (toolName) {
    case "Read":
    case "Write":
    case "Edit":
      return toolInput.file_path || "";
    case "Glob":
    case "Grep":
      return toolInput.path || "";
    case "Bash":
      return toolInput.command || ""; // best effort
    default:
      return "";
  }
}

export function isWriteTool(tool) {
  return tool === "Write" || tool === "Edit";
}

export function isReadTool(tool) {
  return tool === "Read" || tool === "Glob";
}

export function isReadOnlyTool(tool) {
  return ["Read", "Glob", "Grep", "WebFetch", "WebSearch"].includes(tool);
}

export function isBashTool(tool) {
  return tool === "Bash";
}

export function isKnowledgeTool(tool) {
  return tool.startsWith("mcp__MEMORY__") || tool.startsWith("lore_");
}

export function isMemoryAccess(tool, filePath) {
  if (tool !== "Read" && tool !== "Write" && tool !== "Edit") return false;
  if (basename(filePath) !== "MEMORY.md") return false;
  const expected = join(process.cwd(), "MEMORY.md");
  try {
    return resolve(filePath) === expected;
  } catch {
    return false;
  }
}

export function isClaudeAutoMemory(filePath) {
  if (!filePath) return false;
  try {
    const abs = resolve(filePath);
    const claudeProjects = join(homedir(), ".claude", "projects");
    return abs.startsWith(claudeProjects) && abs.includes("/memory/");
  } catch {
    return false;
  }
}

export function isGlobalPath(filePath) {
  if (!filePath) return false;
  try {
    const abs = resolve(filePath);
    const gp = globalPath();
    return abs === gp || abs.startsWith(gp + "/");
  } catch {
    return false;
  }
}

export function isIndexedPath(filePath) {
  if (!filePath) return false;
  const prefixes = ["docs/", ".lore/AGENTIC/SKILLS/", ".lore/AGENTIC/RULES/"];
  return prefixes.some((p) => filePath.includes(p));
}

// ── Counter state ───────────────────────────────────────────────────

function counterPath() {
  const cwd = process.cwd();
  const hash = createHash("md5").update(cwd).digest("hex").slice(0, 8);
  const gitDir = join(cwd, ".git");
  try {
    statSync(gitDir);
    return join(gitDir, `lore-bash-count-${hash}.json`);
  } catch {
    return join(tmpdir(), `lore-bash-count-${hash}.json`);
  }
}

export function incrementBashCounter() {
  const path = counterPath();
  let state = { count: 0, updated: "" };
  try {
    state = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    // first invocation
  }
  state.count++;
  state.updated = new Date().toISOString();
  try {
    writeFileSync(path, JSON.stringify(state), "utf8");
  } catch {
    // can't persist — counter resets next invocation
  }
  return state.count;
}

// ── Session nonce ───────────────────────────────────────────────────

/** Read the session nonce from .lore/.session-nonce. */
export function readNonce() {
  try {
    const data = readFileSync(
      join(process.cwd(), ".lore", ".session-nonce"),
      "utf8"
    );
    const n = data.trim();
    return n || "0000";
  } catch {
    return "0000";
  }
}

// ── Prompt loading ──────────────────────────────────────────────────

/**
 * Load a prompt file from PROMPTS/<hook>/<name>.md.
 * Strips YAML frontmatter, returns the body text.
 * Automatically injects the session nonce into {{NONCE}} placeholders.
 */
export function loadPrompt(relativePath) {
  const fullPath = join(LORE_OS_DIR, "PROMPTS", relativePath);
  let content;
  try {
    content = readFileSync(fullPath, "utf8");
  } catch {
    return `[prompt not found: ${relativePath}]`;
  }
  // Strip YAML frontmatter (--- ... ---)
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  let body = match ? match[1].trim() : content.trim();
  // Inject session nonce
  body = body.replaceAll("{{NONCE}}", readNonce());
  return body;
}

// ── Output helpers ──────────────────────────────────────────────────

/** Build a PreToolUse response. */
export function preToolUseOutput(decision, message) {
  const hso = { hookEventName: "PreToolUse" };
  if (decision) {
    hso.permissionDecision = decision;
    hso.permissionDecisionReason = message;
  } else {
    hso.additionalContext = message;
  }
  return { hookSpecificOutput: hso };
}

/** Emit a JSON response to stdout. */
export function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}
