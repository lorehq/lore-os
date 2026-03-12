#!/usr/bin/env node
// Lore OS — Prompt-Submit Hook
// Injects a standing reminder for the LLM to surface ambiguity.
// Reads JSON event from stdin, writes JSON response to stdout.

import { readStdin, resolveProfile, loadPrompt, emit } from "./lib.mjs";

readStdin();
const profile = resolveProfile();

if (!profile.ambiguityNudge) process.exit(0);

const msg = loadPrompt("prompt-submit/ambiguityNudge.md");
emit({ additionalContext: msg });
