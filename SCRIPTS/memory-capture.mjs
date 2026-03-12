#!/usr/bin/env node
// Lore OS — Memory Capture
// Adaptive memory capture nudges with counter-based severity escalation.

import { readStdin, resolveProfile, isReadOnlyTool, isKnowledgeTool, isBashTool, incrementBashCounter, loadPrompt, emit } from "./lib.mjs";

const input = readStdin();
const tool = input.tool_name || "";
const profile = resolveProfile();

if (!profile.memoryNudge) process.exit(0);
if (isReadOnlyTool(tool) || isKnowledgeTool(tool)) process.exit(0);

if (isBashTool(tool)) {
  const count = incrementBashCounter();
  const nudgeEvery = profile.nudgeEvery || 15;
  const warnAt = profile.warnAt || 30;

  if (count === 1) {
    emit({ additionalContext: loadPrompt("post-tool-use/memoryNudge.first.md") });
    process.exit(0);
  }

  if (count % nudgeEvery === 0) {
    if (count >= warnAt) {
      emit({ additionalContext: loadPrompt("post-tool-use/memoryNudge.warn.md") });
    } else {
      emit({ additionalContext: loadPrompt("post-tool-use/memoryNudge.nudge.md") });
    }
    process.exit(0);
  }
}
