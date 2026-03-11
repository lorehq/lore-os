// TUI Memory Page — renders hot memory and DATABANK stats for the Lore TUI.
// Invoked by the binary via: node SCRIPTS/tui-memory.mjs < {input JSON}
// Vanilla Node.js — no npm packages.

import { readFileSync, readSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import http from "node:http";

const BUNDLE_DIR = resolve(dirname(new URL(import.meta.url).pathname), "..");

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

// ── DATABANK stats ──────────────────────────────────────────────────

function countDatabankFiles(databankDir) {
  const counts = { fieldnotes: 0, runbooks: 0, environment: 0, drafts: 0 };
  const dirs = [
    ["KNOWLEDGE_BASE/fieldnotes", "fieldnotes"],
    ["KNOWLEDGE_BASE/runbooks", "runbooks"],
    ["KNOWLEDGE_BASE/environment", "environment"],
    ["workspace/drafts", "drafts"],
  ];
  for (const [rel, key] of dirs) {
    try {
      counts[key] = countFilesRecursive(join(databankDir, rel));
    } catch {
      // dir doesn't exist
    }
  }
  return counts;
}

function countFilesRecursive(dir) {
  let count = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      count += countFilesRecursive(join(dir, e.name));
    } else if (e.name.endsWith(".md")) {
      count++;
    }
  }
  return count;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const input = readStdin();
  const cwd = input.cwd || process.cwd();
  const project = input.project || "";

  const session = readCurrentSession(cwd);
  const sessionId = session ? session.id : "";

  // Fetch data in parallel
  const [recallResult, statsResult, healthResult] = await Promise.allSettled([
    httpGet(
      sidecarUrl(
        `/memory/hot/recall?limit=20&scope=all&project=${encodeURIComponent(project)}&session_id=${encodeURIComponent(sessionId)}`
      )
    ),
    httpGet(
      sidecarUrl(
        `/memory/hot/stats?project=${encodeURIComponent(project)}&session_id=${encodeURIComponent(sessionId)}`
      )
    ),
    httpGet(sidecarUrl("/health")),
  ]);

  const recall =
    recallResult.status === "fulfilled" ? recallResult.value : null;
  const stats =
    statsResult.status === "fulfilled" ? statsResult.value : null;
  const health =
    healthResult.status === "fulfilled" ? healthResult.value : null;

  // DATABANK file counts
  const databankDir = join(
    process.env.HOME || "/tmp",
    "LORE-OS",
    "DATABANK"
  );
  const dbCounts = countDatabankFiles(databankDir);

  // Build sections
  const sections = [];

  // Section 1: Hot Memory
  const facts = recall?.facts || [];
  const hotItems = facts.map((f) => {
    const score = typeof f.score === "number" ? f.score.toFixed(1) : "?";
    // Handle both v1 (key/tier) and v2 (topic/scope) response formats
    let scope = f.scope || "";
    let topic = f.topic || "";

    // Fallback: extract scope and topic from key field (v1 API format)
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
        // Key prefix already stripped by the API — infer scope from tier
        scope = scope || (f.tier ? "project" : "?");
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

  // Section 2: Memory Stats
  const s = stats?.stats || {};
  const statsItems = [
    { label: "Total entries", detail: "", badge: String(s.total || 0) },
    { label: "Global", detail: "", badge: String(s.global || 0) },
    { label: "Project", detail: "", badge: String(s.project || 0) },
    { label: "Session", detail: "", badge: String(s.session || 0) },
  ];
  sections.push({
    name: "Stats",
    badge: "",
    collapsed: false,
    items: statsItems,
  });

  // Section 3: DATABANK
  const dbItems = [
    { label: "Fieldnotes", detail: "", badge: String(dbCounts.fieldnotes) },
    { label: "Runbooks", detail: "", badge: String(dbCounts.runbooks) },
    { label: "Environment", detail: "", badge: String(dbCounts.environment) },
    { label: "Drafts", detail: "", badge: String(dbCounts.drafts) },
  ];
  sections.push({
    name: "DATABANK",
    badge: "",
    collapsed: true,
    items: dbItems,
  });

  // Section 4: Health
  if (health) {
    const healthItems = [
      {
        label: "Files indexed",
        detail: "",
        badge: String(health.file_count || 0),
      },
      {
        label: "Chunks",
        detail: "",
        badge: String(health.chunk_count || 0),
      },
      { label: "Model", detail: health.model || "unknown", badge: "" },
    ];
    sections.push({
      name: "Search Engine",
      badge: "",
      collapsed: true,
      items: healthItems,
    });
  }

  // Status line
  const statusParts = [];
  if (health?.ok) {
    statusParts.push("Services: connected");
  } else {
    statusParts.push("Services: disconnected");
  }
  if (sessionId) {
    statusParts.push(`Session: ${sessionId.slice(0, 8)}`);
  }
  statusParts.push(`Project: ${project || "(unknown)"}`);

  const output = {
    sections,
    status: statusParts.join(" | "),
  };

  process.stdout.write(JSON.stringify(output) + "\n");
}

main().catch((err) => {
  const output = {
    sections: [],
    status: `Error: ${err.message}`,
  };
  process.stdout.write(JSON.stringify(output) + "\n");
});
