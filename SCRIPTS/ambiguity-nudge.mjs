#!/usr/bin/env node
// Lore OS — Ambiguity Nudge
// Standing reminder for the LLM to surface ambiguity in the user's prompt.

import { readStdin, resolveProfile, loadPrompt, emit } from "./lib.mjs";

readStdin();
const profile = resolveProfile();

if (!profile.ambiguityNudge) process.exit(0);

emit({ additionalContext: loadPrompt("prompt-submit/ambiguityNudge.md") });
