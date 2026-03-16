#!/usr/bin/env node
// Lore OS — Harness Guard
// Operator-gates writes to ~/.config/lore/ (global directory).

import { readStdin, resolveProfile, extractFilePath, isGlobalPath, isWriteTool, loadPrompt, preToolUseOutput, emit } from "./lib.mjs";

const input = readStdin();
const tool = input.tool_name || "";
const toolInput = input.tool_input || {};
const filePath = extractFilePath(tool, toolInput);
const profile = resolveProfile();

if (!profile.harnessGuard) process.exit(0);
if (!isWriteTool(tool)) process.exit(0);
if (!isGlobalPath(filePath)) process.exit(0);

emit(preToolUseOutput("ask", loadPrompt("pre-tool-use/harnessGuard.md")));
