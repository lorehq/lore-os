#!/usr/bin/env node
// Lore OS — Post-Tool-Use Hook
// Adaptive memory capture nudges with counter-based severity escalation.
// Reads JSON event from stdin, writes JSON response to stdout.
// Prompt content loaded from PROMPTS/post-tool-use/*.md

import {
  readStdin,
  resolveProfile,
  isReadOnlyTool,
  isKnowledgeTool,
  isBashTool,
  incrementBashCounter,
  loadPrompt,
  emit,
} from "./lib.mjs";

const input = readStdin();
const tool = input.tool_name || "";
const profile = resolveProfile();

// Memory nudge disabled — exit silently
if (!profile.memoryNudge) process.exit(0);

// Skip silent tools: reads and knowledge-path writes
if (isReadOnlyTool(tool) || isKnowledgeTool(tool)) process.exit(0);

// Track bash command count for adaptive nudging
if (isBashTool(tool)) {
  const count = incrementBashCounter();
  const nudgeEvery = profile.nudgeEvery || 15;
  const warnAt = profile.warnAt || 30;

  if (count === 1) {
    // First bash in sequence — gentle nudge
    emit({ additionalContext: loadPrompt("post-tool-use/memoryNudge.first.md") });
    process.exit(0);
  }

  if (count % nudgeEvery === 0) {
    if (count >= warnAt) {
      // Warn threshold — stronger nudge
      emit({ additionalContext: loadPrompt("post-tool-use/memoryNudge.warn.md") });
    } else {
      // Nudge threshold — periodic reminder
      emit({ additionalContext: loadPrompt("post-tool-use/memoryNudge.nudge.md") });
    }
    process.exit(0);
  }
}

// No nudge triggered — silent pass
