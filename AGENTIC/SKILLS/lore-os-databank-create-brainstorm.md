---
name: lore-os-databank-create-brainstorm
description: Create a brainstorm — a design exploration or idea sketch with supporting material
user-invocable: false
agent: lore-os-databank-agent
---
# Create Brainstorm

Brainstorms are design explorations, idea sketches, or architectural proposals. Each brainstorm is a **folder** with an `index.md` and optional supporting documents.

## Process

1. **Search first** — check existing brainstorms to avoid duplicates.
2. Create the directory: `~/LORE-OS/DATABANK/workspace/drafts/brainstorms/{slug}/`
3. Write `index.md` inside it.
4. Add supporting docs, sketches, or diagrams as needed.

## Schema

```markdown
---
title: {Title}
created: {YYYY-MM-DD}
---
# {Title}

## Problem

[What problem or opportunity is being explored]

## Proposal

[The idea, approach, or design being brainstormed]

## Open Questions

[Unresolved decisions, tradeoffs, unknowns]
```

## Rules

- **Always a folder** — never a loose file in `brainstorms/`.
- **No status field** — brainstorms are reference material, not tracked work.
- **Kebab-case** for the directory name.
- **To promote**: archive the brainstorm, create a fresh initiative or work item.
- Supporting docs (diagrams, sketches, data) go alongside `index.md` in the same folder.
