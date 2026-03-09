#!/usr/bin/env node
// Lore OS — Prompt-Submit Hook
// Scans user input for ambiguous language patterns before the message reaches the agent.
// Reads JSON event from stdin, writes JSON response to stdout.
// Prompt content loaded from PROMPTS/prompt-submit/*.md

import { readStdin, resolveProfile, loadPrompt, emit } from "./lib.mjs";

const input = readStdin();
const profile = resolveProfile();

// Ambiguity nudge disabled — exit silently
if (!profile.ambiguityNudge) process.exit(0);

const userInput = input.user_input || "";
if (!userInput) process.exit(0);

// Ambiguity patterns — detect vague terms that lead to misinterpretation
const patterns = [
  { pattern: "recently", label: "relative time" },
  { pattern: "a few", label: "vague quantity" },
  { pattern: "some of", label: "vague scope" },
  { pattern: "the usual", label: "assumed knowledge" },
  { pattern: "etc", label: "open scope" },
  { pattern: "and so on", label: "open scope" },
  { pattern: "as needed", label: "vague criteria" },
  { pattern: "appropriate", label: "vague criteria" },
  { pattern: "similar", label: "vague criteria" },
];

const lower = userInput.toLowerCase();
const seen = new Set();
const found = [];

for (const { pattern, label } of patterns) {
  if (lower.includes(pattern) && !seen.has(label)) {
    found.push(label);
    seen.add(label);
  }
}

if (found.length > 0) {
  const msg = loadPrompt("prompt-submit/ambiguityNudge.md");
  emit({ additionalContext: msg + "\nDetected: " + found.join(", ") });
}
