#!/usr/bin/env node
// Lore OS — Memory Guard
// Blocks access to MEMORY.md at project root. Redirects to hot memory / databank.

import { readStdin, resolveProfile, extractFilePath, isMemoryAccess, loadPrompt, preToolUseOutput, emit } from "./lib.mjs";

const input = readStdin();
const tool = input.tool_name || "";
const toolInput = input.tool_input || {};
const filePath = extractFilePath(tool, toolInput);
const profile = resolveProfile();

if (!profile.memoryGuard) process.exit(0);
if (!isMemoryAccess(tool, filePath)) process.exit(0);

emit(preToolUseOutput("deny", loadPrompt("pre-tool-use/memoryGuard.md")));
