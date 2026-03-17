#!/usr/bin/env node
// Lore MCP Server — Knowledge Base, Scoped Memory, and Fieldnotes
// JSON-RPC 2.0 over stdio (newline-delimited JSON). Zero dependencies.
//
// Tools:
//   lore_search           — semantic search across the knowledge base
//   lore_read             — read a knowledge base file by path
//   lore_health           — memory engine health and index status
//   lore_recall           — recall hot memory entries sorted by heat
//   lore_session_memory   — write session-scoped memory (this conversation)
//   lore_project_memory   — write project-scoped memory (cross-session)
//   lore_fieldnote        — draft a global fieldnote for later graduation
//
// Self-contained — zero external imports beyond Node.js stdlib.
// Lives at ~/.lore-os/MCP/lore-server.js. Bundle root is __dirname/..

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const readline = require('readline');

// ── Bundle directory and config resolution ──────────────────────────────────

const BUNDLE_DIR = path.join(__dirname, '..');

function getBundleConfig() {
  try {
    const data = fs.readFileSync(path.join(BUNDLE_DIR, 'config.json'), 'utf8');
    return JSON.parse(data);
  } catch { return {}; }
}

function getMemoryServiceUrl() {
  const cfg = getBundleConfig();
  if (cfg.memoryServiceUrl) return cfg.memoryServiceUrl;
  const port = cfg.sidecarPort || 9184;
  return `http://localhost:${port}`;
}

function getToken() {
  try {
    const envPath = path.join(BUNDLE_DIR, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^LORE_TOKEN=(.*)$/m);
    return match ? match[1].trim() : null;
  } catch { return null; }
}

// ── Constants ───────────────────────────────────────────────────────────────

const MAX_LINES_PER_FILE = 500;
const HTTP_TIMEOUT_MS = 10000;

// ── HTTP helpers ────────────────────────────────────────────────────────────

function sidecarUrl(pathname) {
  return `${getMemoryServiceUrl()}${pathname}`;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers: authHeaders() }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(HTTP_TIMEOUT_MS, () => { req.destroy(new Error('Request timed out')); });
  });
}

function httpPost(url, body) {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...authHeaders(),
      },
    }, (res) => {
      let respData = '';
      res.on('data', (chunk) => { respData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(respData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${respData.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(HTTP_TIMEOUT_MS, () => { req.destroy(new Error('Request timed out')); });
    req.write(data);
    req.end();
  });
}

// ── Path resolution ─────────────────────────────────────────────────────────
// Search results return paths relative to the mounted DATABANK volume.
// Resolve them to absolute paths on the host filesystem.

const DATA_DIR = path.join(os.homedir(), 'LORE-OS');

function resolveSearchPath(resultPath) {
  return path.join(DATA_DIR, 'DATABANK', resultPath);
}

function readFileContent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    if (lines.length > MAX_LINES_PER_FILE) {
      return (
        lines.slice(0, MAX_LINES_PER_FILE).join('\n') +
        `\n[...truncated at ${MAX_LINES_PER_FILE} lines, full file at ${filePath}]`
      );
    }
    return content;
  } catch {
    return `[Could not read file: ${filePath}]`;
  }
}

// ── Project identity ─────────────────────────────────────────────────────────

// Derive project name from cwd: /home/andrew/Github/foo -> home-andrew-Github-foo
const PROJECT_NAME = path.resolve(process.cwd()).replace(/^\//, '').replace(/\//g, '-');

// ── Session state ────────────────────────────────────────────────────────────
// Read the most recent session state file written by the Lore binary.
// Returns { id, platform, project } or null if no session file exists.

function readCurrentSession() {
  const sessDir = path.join(process.cwd(), '.lore', '.sessions');
  let entries;
  try {
    entries = fs.readdirSync(sessDir);
  } catch {
    return null;
  }

  // Find newest file by mtime
  let newest = null;
  let newestMtime = 0;
  for (const name of entries) {
    if (!name.endsWith('.json')) continue;
    try {
      const stat = fs.statSync(path.join(sessDir, name));
      if (stat.mtimeMs > newestMtime) {
        newestMtime = stat.mtimeMs;
        newest = name;
      }
    } catch { /* skip */ }
  }

  if (!newest) return null;

  try {
    return JSON.parse(fs.readFileSync(path.join(sessDir, newest), 'utf8'));
  } catch {
    return null;
  }
}

// ── Tool implementations ────────────────────────────────────────────────────

async function loreSearch(query, k) {
  if (!query || !query.trim()) {
    return 'Error: query parameter is required.';
  }

  const searchK = Math.max(1, Math.min(k || 5, 20));
  const url = sidecarUrl(`/search?q=${encodeURIComponent(query)}&k=${searchK}&mode=full`);

  let raw;
  try {
    raw = await httpGet(url);
  } catch (err) {
    return `Memory engine unavailable: ${err.message}\nFall back to Glob/Grep for knowledge base searches.`;
  }

  let results;
  try {
    const parsed = JSON.parse(raw);
    results = Array.isArray(parsed) ? parsed : parsed.results || [];
  } catch {
    return `Unexpected response from memory engine:\n${raw.slice(0, 500)}`;
  }

  if (results.length === 0) {
    return `No results found for: "${query}"`;
  }

  const parts = [];
  for (const result of results) {
    const resultPath = result.path || result.file || '';
    const score = result.score != null ? result.score.toFixed(3) : '?';
    const snippet = result.snippet || '';
    const fsPath = resolveSearchPath(resultPath);
    parts.push(`--- ${resultPath} (score: ${score}) ---\n${snippet}\n-> ${fsPath}`);
  }
  return parts.join('\n\n');
}

function loreRead(filePath) {
  if (!filePath || !filePath.trim()) {
    return 'Error: file_path parameter is required.';
  }
  return readFileContent(path.resolve(filePath));
}

async function loreHealth() {
  try {
    const raw = await httpGet(sidecarUrl('/health'));
    const health = JSON.parse(raw);
    const parts = [`Status: ${health.ok ? 'healthy' : 'unhealthy'}`];
    if (health.file_count != null) parts.push(`Files indexed: ${health.file_count}`);
    if (health.chunk_count != null) parts.push(`Chunks: ${health.chunk_count}`);
    if (health.last_indexed_at) parts.push(`Last indexed: ${health.last_indexed_at}`);
    return parts.join('\n');
  } catch (err) {
    return `Memory engine unavailable: ${err.message}\nStart with: docker compose -f ~/.lore-os/docker-compose.yml up -d`;
  }
}

async function loreRecall(limit, scope) {
  const n = Math.max(1, Math.min(limit || 10, 50));
  const validScopes = ['session', 'project', 'global', 'all'];
  const s = validScopes.includes(scope) ? scope : 'project';
  const session = readCurrentSession();
  const sessionId = session ? session.id : '';
  try {
    const params = new URLSearchParams({
      limit: String(n),
      scope: s,
      project: PROJECT_NAME,
      session_id: sessionId,
    });
    const url = sidecarUrl(`/memory/hot/recall?${params}`);
    const raw = await httpGet(url);
    const parsed = JSON.parse(raw);
    const facts = parsed.facts || [];

    if (facts.length === 0) return `No memories (scope: ${s}).`;

    const parts = facts.map((f) => {
      const display = f.type === 'fieldnote'
        ? `${f.description || ''}\n${f.body || ''}`
        : f.content || '';
      return `[${f.score.toFixed(2)}] ${f.topic} (${f.type}, ${f.scope})${display ? '\n' + display : ''}`;
    });
    return `${facts.length} memories (scope: ${s}):\n\n${parts.join('\n\n')}`;
  } catch (err) {
    return `Memory engine unavailable: ${err.message}`;
  }
}

async function loreSessionMemory(topic, content) {
  if (!topic || !topic.trim()) return 'Error: topic parameter is required.';
  if (!content || !content.trim()) return 'Error: content parameter is required.';
  const session = readCurrentSession();
  const sessionRef = session ? session.id : '';
  try {
    await httpPost(sidecarUrl('/memory/hot/write'), {
      topic: topic.trim(), content: content.trim(),
      scope: 'session', project: PROJECT_NAME,
      type: 'session-memory', session_ref: sessionRef,
    });
    return `Session memory recorded: ${topic.trim()}`;
  } catch (err) {
    return `Memory engine unavailable: ${err.message}`;
  }
}

async function loreProjectMemory(topic, content) {
  if (!topic || !topic.trim()) return 'Error: topic parameter is required.';
  if (!content || !content.trim()) return 'Error: content parameter is required.';
  const session = readCurrentSession();
  const sessionRef = session ? session.id : '';
  try {
    await httpPost(sidecarUrl('/memory/hot/write'), {
      topic: topic.trim(), content: content.trim(),
      scope: 'project', project: PROJECT_NAME,
      type: 'project-memory', session_ref: sessionRef,
    });
    return `Project memory recorded: ${topic.trim()}`;
  } catch (err) {
    return `Memory engine unavailable: ${err.message}`;
  }
}

async function loreFieldnote(name, description, body) {
  if (!name || !name.trim()) return 'Error: name parameter is required.';
  if (!body || !body.trim()) return 'Error: body parameter is required.';
  const n = name.trim();
  const session = readCurrentSession();
  const sessionRef = session ? session.id : '';
  try {
    await httpPost(sidecarUrl('/memory/hot/write'), {
      topic: `fieldnote:${n}`, scope: 'global', project: PROJECT_NAME,
      type: 'fieldnote', session_ref: sessionRef,
      name: n,
      content: (description || '').trim(),
      description: (description || '').trim(),
      body: body.trim(),
    });
    return `Fieldnote drafted (global): ${n}\nUse /lore-os-burn to review and graduate to the knowledge base.`;
  } catch (err) {
    return `Memory engine unavailable: ${err.message}`;
  }
}

async function loreForget(topic, scope) {
  if (!topic || !topic.trim()) return 'Error: topic parameter is required.';
  const validScopes = ['session', 'project', 'global'];
  const s = validScopes.includes(scope) ? scope : 'project';
  const session = readCurrentSession();
  const sessionRef = session ? session.id : '';
  try {
    const raw = await httpPost(sidecarUrl('/memory/hot/delete'), {
      topic: topic.trim(), scope: s, project: PROJECT_NAME,
      session_ref: sessionRef,
    });
    const parsed = JSON.parse(raw);
    if (parsed.deleted) {
      return `Deleted ${s} memory: ${topic.trim()}`;
    }
    return `No ${s} memory found with topic: ${topic.trim()}`;
  } catch (err) {
    return `Memory engine unavailable: ${err.message}`;
  }
}

// ── MCP protocol ────────────────────────────────────────────────────────────

const SERVER_INFO = {
  name: 'lore',
  version: '0.1.0',
};

const TOOLS = [
  {
    name: 'lore_search',
    description:
      'Semantic search across the Lore knowledge base (fieldnotes, runbooks, environment docs, work items). ' +
      'Returns snippets and file paths. Use lore_read to get complete file contents.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query.' },
        k: { type: 'number', description: 'Number of results to return (1-20, default 5).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'lore_read',
    description: 'Read a knowledge base file by path. Use after lore_search to get the full contents of a matched file.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file (from lore_search results).' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'lore_health',
    description: 'Check if the Lore memory engine is running and how many files are indexed.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'lore_recall',
    description:
      'Recall memories sorted by heat score. Returns session, project, and global memories by default. ' +
      'Higher scores = more recently or frequently accessed. Memories decay over time.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum entries to return (1-50, default 10).' },
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global', 'all'],
          description: 'Scope filter. Default = session + project + global. "session" = this conversation only. "project" = project-wide only. "global" = global only. "all" = everything across all projects.',
        },
      },
      required: [],
    },
  },
  {
    name: 'lore_session_memory',
    description:
      'Write a memory scoped to this conversation session. Use for decisions, scope boundaries, ' +
      'rejected approaches, clarifications, or anything relevant to the current session. ' +
      'Session memories are automatically tied to this conversation and decay over time.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Short identifier (e.g. "auth-approach-decision", "scope-excludes-mobile").' },
        content: { type: 'string', description: 'The decision, observation, or context to record.' },
      },
      required: ['topic', 'content'],
    },
  },
  {
    name: 'lore_project_memory',
    description:
      'Write a memory scoped to this project, visible across all sessions. Use for project-level facts, ' +
      'gotchas, API quirks, environment details, or anything worth remembering across conversations. ' +
      'No operator approval needed. Memories decay over time.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Short identifier (e.g. "proxmox-api-token-format", "redis-port-override").' },
        content: { type: 'string', description: 'The fact or observation to record.' },
      },
      required: ['topic', 'content'],
    },
  },
  {
    name: 'lore_fieldnote',
    description:
      'Draft a fieldnote — a non-obvious environmental snag (auth quirk, encoding issue, platform incompatibility). ' +
      'Fieldnotes are global (shared across all projects) and graduate to the persistent knowledge base ' +
      'via /lore-os-burn.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Fieldnote name in kebab-case (e.g. "eslint-10-node-18-crash").' },
        description: { type: 'string', description: 'One-line description of the snag.' },
        body: { type: 'string', description: 'Full fieldnote content (context, snags, workaround). Markdown.' },
      },
      required: ['name', 'body'],
    },
  },
  {
    name: 'lore_forget',
    description:
      'Delete a hot memory entry by topic and scope. Use when a memory is outdated, wrong, or no longer relevant. ' +
      'Use lore_recall first to find the exact topic name.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'The topic key of the memory to delete (exact match from lore_recall).' },
        scope: {
          type: 'string',
          enum: ['session', 'project', 'global'],
          description: 'Scope of the memory to delete. Default: project.',
        },
      },
      required: ['topic'],
    },
  },
];

// Route JSON-RPC requests to the appropriate handler.
async function handleRequest(req) {
  const { id, method } = req;

  if (method === 'initialize') {
    const clientVersion = req.params?.protocolVersion || '2024-11-05';
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: clientVersion,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      },
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  }

  if (method === 'tools/call') {
    const toolName = req.params?.name;
    const args = req.params?.arguments || {};
    let text;
    try {
      switch (toolName) {
        case 'lore_search':
          text = await loreSearch(args.query, args.k);
          break;
        case 'lore_read':
          text = loreRead(args.file_path);
          break;
        case 'lore_health':
          text = await loreHealth();
          break;
        case 'lore_recall':
          text = await loreRecall(args.limit, args.scope);
          break;
        case 'lore_session_memory':
          text = await loreSessionMemory(args.topic, args.content);
          break;
        case 'lore_project_memory':
          text = await loreProjectMemory(args.topic, args.content);
          break;
        case 'lore_fieldnote':
          text = await loreFieldnote(args.name, args.description, args.body);
          break;
        case 'lore_forget':
          text = await loreForget(args.topic, args.scope);
          break;
        default:
          return {
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true },
          };
      }
    } catch (err) {
      text = `Error: ${err.message}`;
    }
    return {
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text }] },
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

// ── Transport: newline-delimited JSON-RPC over stdio ────────────────────────

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const pending = new Set();

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const p = Promise.resolve(handleRequest(req))
      .then((res) => {
        if (res) process.stdout.write(JSON.stringify(res) + '\n');
      })
      .catch((err) => {
        console.error('[lore-mcp] handler error:', err.message);
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            id: req.id || null,
            error: { code: -32603, message: 'Internal error' },
          }) + '\n',
        );
      })
      .finally(() => pending.delete(p));
    pending.add(p);
  } catch (err) {
    console.error('[lore-mcp] parse error:', err.message);
    process.stdout.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      }) + '\n',
    );
  }
});

rl.on('close', () => {
  Promise.all(pending).then(() => process.exit(0));
});
