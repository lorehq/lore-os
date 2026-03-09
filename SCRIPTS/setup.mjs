#!/usr/bin/env node

// Lore OS setup — run by the harness after install.
// Creates ~/LORE-OS/ directory tree and sticky profile templates.
// Data lives outside the bundle so it survives updates and reinstalls.

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const dataDir = join(homedir(), "LORE-OS");

// Data directory tree
const dirs = [
  "DATABANK/KNOWLEDGE_BASE/operator",
  "DATABANK/KNOWLEDGE_BASE/machine",
  "DATABANK/KNOWLEDGE_BASE/environment",
  "DATABANK/KNOWLEDGE_BASE/fieldnotes",
  "DATABANK/KNOWLEDGE_BASE/runbooks",
  "DATABANK/imports",
  "DATABANK/workspace/drafts/brainstorms",
  "DATABANK/workspace/drafts/notes",
  "DATABANK/workspace/projects",
  "DATABANK/workspace/work-items/initiatives",
  "HOT",
];

// Create directories
for (const dir of dirs) {
  mkdirSync(join(dataDir, dir), { recursive: true });
}

// Sticky files — only written if they don't already exist
const stickyFiles = [
  {
    path: "DATABANK/KNOWLEDGE_BASE/operator/operator-profile.md",
    content: `---
name: operator-profile
description: Operator identity, preferences, and working style.
---
# Operator Profile

## Identity

- **Name:**
- **Role:**
- **Organization:**

## Accounts

<!-- VCS logins, cloud accounts, Docker Hub, etc. -->

## Preferences

<!-- Working style, communication tone, tool preferences. -->
`,
  },
  {
    path: "DATABANK/KNOWLEDGE_BASE/machine/machine-profile.md",
    content: `---
name: machine-profile
description: This machine's identity — hardware, OS, runtimes, and local configuration.
---
# Machine Profile

## Hardware

- **Hostname:**
- **CPU:**
- **RAM:**
- **Storage:**

## Operating System

- **OS:**
- **Kernel:**
- **Shell:**

## Runtimes

<!-- Installed runtimes: Node, Python, Go, .NET, Java, etc. -->

## CLI Tools

<!-- Key CLI tools: docker, git, gh, kubectl, terraform, ansible, etc. -->
`,
  },
];

for (const sf of stickyFiles) {
  const fullPath = join(dataDir, sf.path);
  if (!existsSync(fullPath)) {
    writeFileSync(fullPath, sf.content, { mode: 0o644 });
  }
}
