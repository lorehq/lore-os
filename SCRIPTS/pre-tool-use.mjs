#!/usr/bin/env node
// Lore OS — Pre-Tool-Use Hook
// Guards: memory protection, auto-memory redirect, harness guard, search nudge.
// Reads JSON event from stdin, writes JSON response to stdout.
// Prompt content loaded from PROMPTS/pre-tool-use/*.md

import {
  readStdin,
  resolveProfile,
  extractFilePath,
  isMemoryAccess,
  isClaudeAutoMemory,
  isGlobalPath,
  isIndexedPath,
  isWriteTool,
  isReadTool,
  loadPrompt,
  preToolUseOutput,
  emit,
} from "./lib.mjs";

const input = readStdin();
const tool = input.tool_name || "";
const toolInput = input.tool_input || {};
const filePath = extractFilePath(tool, toolInput);
const profile = resolveProfile();

const prompt = (name) => loadPrompt(`pre-tool-use/${name}`);

// 1. Memory guard: block MEMORY.md access at project root
if (profile.memoryGuard && isMemoryAccess(tool, filePath)) {
  emit(preToolUseOutput("deny", prompt("memoryGuard.md")));
  process.exit(0);
}

// 2. Auto-memory redirect: block writes to Claude auto-memory, redirect reads
if (profile.autoMemoryRedirect && isClaudeAutoMemory(filePath)) {
  if (isWriteTool(tool)) {
    emit(preToolUseOutput("deny", prompt("autoMemoryRedirect.write.md")));
    process.exit(0);
  }
  if (isReadTool(tool)) {
    emit(preToolUseOutput("", prompt("autoMemoryRedirect.read.md")));
    process.exit(0);
  }
}

// 3. Harness guard: operator-gate writes to ~/.lore/
if (profile.harnessGuard && isWriteTool(tool) && isGlobalPath(filePath)) {
  emit(preToolUseOutput("ask", prompt("harnessGuard.md")));
  process.exit(0);
}

// 4. Search nudge: suggest semantic search for indexed paths
if (profile.searchNudge && isReadTool(tool) && isIndexedPath(filePath)) {
  emit(preToolUseOutput("", prompt("searchNudge.md")));
  process.exit(0);
}

// No guard triggered — silent pass
