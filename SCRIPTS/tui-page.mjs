// TUI Page — Lore OS dashboard with Memory, Workspace, and DATABANK sub-tabs.
// Invoked by the binary via: node SCRIPTS/tui-page.mjs < {input JSON}
// Vanilla Node.js — no npm packages.

import { readFileSync, readSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import http from "node:http";

const BUNDLE_DIR = resolve(dirname(new URL(import.meta.url).pathname), "..");
const DATABANK_DIR = join(process.env.HOME || "/tmp", "LORE-OS", "DATABANK");

// ── Config ──────────────────────────────────────────────────────────

function getBundleConfig() {
  try {
    return JSON.parse(readFileSync(join(BUNDLE_DIR, "config.json"), "utf8"));
  } catch {
    return {};
  }
}

function getSidecarPort() {
  return getBundleConfig().sidecarPort || 9184;
}

function getToken() {
  try {
    const content = readFileSync(join(BUNDLE_DIR, ".env"), "utf8");
    const match = content.match(/^LORE_TOKEN=(.*)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

// ── HTTP ────────────────────────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const req = http.get(url, { headers, timeout: 5000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("invalid JSON"));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function sidecarUrl(pathname) {
  return `http://localhost:${getSidecarPort()}${pathname}`;
}

// ── Stdin ───────────────────────────────────────────────────────────

function readStdin() {
  const chunks = [];
  const buf = Buffer.alloc(4096);
  try {
    let n;
    while ((n = readSync(0, buf)) > 0) {
      chunks.push(Buffer.from(buf.subarray(0, n)));
    }
  } catch {
    // EOF
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── Session ─────────────────────────────────────────────────────────

function readCurrentSession(cwd) {
  const sessDir = join(cwd, ".lore", ".sessions");
  let entries;
  try {
    entries = readdirSync(sessDir);
  } catch {
    return null;
  }
  let newest = null;
  let newestMtime = 0;
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    try {
      const stat = statSync(join(sessDir, name));
      if (stat.mtimeMs > newestMtime) {
        newestMtime = stat.mtimeMs;
        newest = name;
      }
    } catch {
      /* skip */
    }
  }
  if (!newest) return null;
  try {
    return JSON.parse(readFileSync(join(sessDir, newest), "utf8"));
  } catch {
    return null;
  }
}

// ── Filesystem helpers ───────────────────────────────────────────────

function listDirs(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

function listMdFiles(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name.replace(/\.md$/, ""))
      .sort();
  } catch {
    return [];
  }
}

function listMdFilesRecursive(dir, prefix) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) {
        results.push(...listMdFilesRecursive(join(dir, e.name), rel));
      } else if (e.name.endsWith(".md")) {
        results.push(rel.replace(/\.md$/, ""));
      }
    }
  } catch {
    // dir doesn't exist
  }
  return results.sort();
}

function readDescription(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const match = content.match(/^description:\s*(.+)$/m);
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

// ── Sub-tab builders ─────────────────────────────────────────────────

function buildMemorySubtab(facts, stats, health) {
  const sections = [];

  // Hot Memory
  const hotItems = facts.map((f) => {
    const score = typeof f.score === "number" ? f.score.toFixed(1) : "?";
    let scope = f.scope || "";
    let topic = f.topic || "";
    if (!topic && f.key) {
      const key = f.key;
      if (key.startsWith("lore:hot:session:")) {
        scope = scope || "session";
        topic = key.replace(/^lore:hot:session:[^:]+:/, "");
      } else if (key.startsWith("lore:hot:project:")) {
        scope = scope || "project";
        topic = key.replace(/^lore:hot:project:[^:]+:/, "");
      } else if (key.startsWith("lore:hot:global:")) {
        scope = scope || "global";
        topic = key.replace(/^lore:hot:global:/, "");
      } else {
        scope = scope || "?";
        topic = key;
      }
    }
    if (!topic && f.path) topic = f.path;
    if (!scope) scope = "?";
    if (!topic) topic = "?";
    return {
      label: `${scope}:${topic}`,
      detail: f.content
        ? f.content.slice(0, 60) + (f.content.length > 60 ? "…" : "")
        : f.description || "",
      badge: score,
    };
  });

  sections.push({
    name: "Hot Memory",
    badge: String(facts.length),
    collapsed: false,
    items:
      hotItems.length > 0
        ? hotItems
        : [{ label: "(empty)", detail: "No entries in hot memory", badge: "" }],
  });

  // Stats
  const s = stats?.stats || {};
  sections.push({
    name: "Stats",
    badge: "",
    collapsed: false,
    items: [
      { label: "Total entries", detail: "", badge: String(s.total || 0) },
      { label: "Global",        detail: "", badge: String(s.global || 0) },
      { label: "Project",       detail: "", badge: String(s.project || 0) },
      { label: "Session",       detail: "", badge: String(s.session || 0) },
    ],
  });

  // Search Engine
  if (health) {
    sections.push({
      name: "Search Engine",
      badge: "",
      collapsed: true,
      items: [
        { label: "Files indexed", detail: "",                        badge: String(health.file_count || 0) },
        { label: "Chunks",        detail: "",                        badge: String(health.chunk_count || 0) },
        { label: "Model",         detail: health.model || "unknown", badge: "" },
      ],
    });
  }

  return { name: "Memory", badge: String(facts.length), sections };
}

function buildWorkspaceSubtab() {
  const sections = [];

  // Initiatives
  const initDir = join(DATABANK_DIR, "workspace", "work-items", "initiatives");
  const initiatives = listDirs(initDir).map((slug) => ({
    label: slug,
    detail: readDescription(join(initDir, slug, "index.md")),
    badge: "",
  }));
  sections.push({
    name: "Initiatives",
    badge: String(initiatives.length),
    collapsed: false,
    items: initiatives.length > 0
      ? initiatives
      : [{ label: "(none)", detail: "", badge: "" }],
  });

  // Brainstorms
  const brainstormDir = join(DATABANK_DIR, "workspace", "drafts", "brainstorms");
  const brainstorms = listDirs(brainstormDir).map((slug) => ({
    label: slug,
    detail: readDescription(join(brainstormDir, slug, "index.md")),
    badge: "",
  }));
  sections.push({
    name: "Brainstorms",
    badge: String(brainstorms.length),
    collapsed: false,
    items: brainstorms.length > 0
      ? brainstorms
      : [{ label: "(none)", detail: "", badge: "" }],
  });

  // Notes
  const notesDir = join(DATABANK_DIR, "workspace", "drafts", "notes");
  const notes = listMdFiles(notesDir).map((slug) => ({
    label: slug,
    detail: readDescription(join(notesDir, slug + ".md")),
    badge: "",
  }));
  sections.push({
    name: "Notes",
    badge: String(notes.length),
    collapsed: false,
    items: notes.length > 0
      ? notes
      : [{ label: "(none)", detail: "", badge: "" }],
  });

  const total = initiatives.length + brainstorms.length + notes.length;
  return { name: "Workspace", badge: String(total), sections };
}

function buildDatabankSubtab() {
  const sections = [];

  // Fieldnotes
  const fieldnotesDir = join(DATABANK_DIR, "KNOWLEDGE_BASE", "fieldnotes");
  const fieldnotes = listDirs(fieldnotesDir).map((slug) => ({
    label: slug,
    detail: readDescription(join(fieldnotesDir, slug, "FIELDNOTE.md")),
    badge: "",
  }));
  sections.push({
    name: "Fieldnotes",
    badge: String(fieldnotes.length),
    collapsed: false,
    items: fieldnotes.length > 0
      ? fieldnotes
      : [{ label: "(none)", detail: "", badge: "" }],
  });

  // Runbooks
  const runbooksDir = join(DATABANK_DIR, "KNOWLEDGE_BASE", "runbooks");
  const runbooks = listMdFilesRecursive(runbooksDir, "").map((name) => ({
    label: name,
    detail: "",
    badge: "",
  }));
  sections.push({
    name: "Runbooks",
    badge: String(runbooks.length),
    collapsed: true,
    items: runbooks.length > 0
      ? runbooks
      : [{ label: "(none)", detail: "", badge: "" }],
  });

  // Environment
  const envDir = join(DATABANK_DIR, "KNOWLEDGE_BASE", "environment");
  const envDocs = listMdFiles(envDir).map((name) => ({
    label: name,
    detail: readDescription(join(envDir, name + ".md")),
    badge: "",
  }));
  sections.push({
    name: "Environment",
    badge: String(envDocs.length),
    collapsed: true,
    items: envDocs.length > 0
      ? envDocs
      : [{ label: "(none)", detail: "", badge: "" }],
  });

  const total = fieldnotes.length + runbooks.length + envDocs.length;
  return { name: "DATABANK", badge: String(total), sections };
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const input = readStdin();
  const cwd = input.cwd || process.cwd();
  const project = input.project || "";

  const session = readCurrentSession(cwd);
  const sessionId = session ? session.id : "";

  const [recallResult, statsResult, healthResult] = await Promise.allSettled([
    httpGet(sidecarUrl(`/memory/hot/recall?limit=20&scope=all&project=${encodeURIComponent(project)}&session_id=${encodeURIComponent(sessionId)}`)),
    httpGet(sidecarUrl(`/memory/hot/stats?project=${encodeURIComponent(project)}&session_id=${encodeURIComponent(sessionId)}`)),
    httpGet(sidecarUrl("/health")),
  ]);

  const recall = recallResult.status === "fulfilled" ? recallResult.value : null;
  const stats  = statsResult.status  === "fulfilled" ? statsResult.value  : null;
  const health = healthResult.status === "fulfilled" ? healthResult.value : null;
  const facts  = recall?.facts || [];

  const subtabs = [
    buildMemorySubtab(facts, stats, health),
    buildWorkspaceSubtab(),
    buildDatabankSubtab(),
  ];

  const statusParts = [health?.ok ? "Services: connected" : "Services: disconnected"];
  if (sessionId) statusParts.push(`Session: ${sessionId.slice(0, 8)}`);
  statusParts.push(`Project: ${project || "(unknown)"}`);

  process.stdout.write(JSON.stringify({ subtabs, status: statusParts.join(" | ") }) + "\n");
}

main().catch((err) => {
  process.stdout.write(JSON.stringify({ subtabs: [], status: `Error: ${err.message}` }) + "\n");
});
