#!/usr/bin/env node
// Lore OS — Search Nudge
// Suggests semantic search when agent accesses databank-indexed paths.

import { readStdin, resolveProfile, extractFilePath, isIndexedPath, isReadTool, loadPrompt, preToolUseOutput, emit } from "./lib.mjs";

const input = readStdin();
const tool = input.tool_name || "";
const toolInput = input.tool_input || {};
const filePath = extractFilePath(tool, toolInput);
const profile = resolveProfile();

if (!profile.searchNudge) process.exit(0);
if (!isReadTool(tool)) process.exit(0);
if (!isIndexedPath(filePath)) process.exit(0);

emit(preToolUseOutput("", loadPrompt("pre-tool-use/searchNudge.md")));
