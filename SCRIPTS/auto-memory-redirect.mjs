#!/usr/bin/env node
// Lore OS — Auto-Memory Redirect
// Blocks writes to Claude auto-memory, redirects reads.

import { readStdin, resolveProfile, extractFilePath, isClaudeAutoMemory, isWriteTool, isReadTool, loadPrompt, preToolUseOutput, emit } from "./lib.mjs";

const input = readStdin();
const tool = input.tool_name || "";
const toolInput = input.tool_input || {};
const filePath = extractFilePath(tool, toolInput);
const profile = resolveProfile();

if (!profile.autoMemoryRedirect) process.exit(0);
if (!isClaudeAutoMemory(filePath)) process.exit(0);

if (isWriteTool(tool)) {
  emit(preToolUseOutput("deny", loadPrompt("pre-tool-use/autoMemoryRedirect.write.md")));
  process.exit(0);
}

if (isReadTool(tool)) {
  emit(preToolUseOutput("", loadPrompt("pre-tool-use/autoMemoryRedirect.read.md")));
  process.exit(0);
}
