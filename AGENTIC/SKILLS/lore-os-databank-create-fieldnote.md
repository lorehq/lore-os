---
name: lore-os-databank-create-fieldnote
description: Create a fieldnote — captures a non-obvious environmental snag (gotcha, quirk, surprise)
user-invocable: false
agent: lore-os-databank-agent
---
# Create Fieldnote

**Every snag (gotcha, quirk) becomes a fieldnote. No exceptions.**

Fieldnotes capture environmental knowledge from failures — auth quirks, encoding issues, parameter tricks, platform incompatibilities.

## When to Create

**Mandatory**: Auth quirks, encoding issues, parameter tricks, platform incompatibilities, anything that surprised you during execution.

**Not fieldnotes**: Procedural commands, multi-step workflows — those are runbooks.

## Process

1. **Search first** — check existing fieldnotes to avoid duplicates.
2. Create the directory: `~/LORE-OS/DATABANK/KNOWLEDGE_BASE/fieldnotes/{name}/`
3. Write `FIELDNOTE.md` inside it.
4. Verify the file exists and is valid markdown.

## Schema

```markdown
---
name: {slug}
description: One-line description of the snag
captured: {YYYY-MM-DD}
tags: [{comma, separated, tags}]
---
# {Title}

[Context — 2-3 lines on when this applies]

## Snags
[The actual value — what surprised you]

## Workaround
[How to fix or avoid the issue]
```

## Rules

- **30-80 lines** — under 30 lacks context, over 80 floods context window.
- **Naming**: `<service>-<action>-<object>` (e.g., `eslint-10-node-18-crash`).
- **Do not use the `lore-` prefix** — reserved for harness system items.
- **One fieldnote per interaction method** (API, CLI, MCP, SDK, UI).
- **Kebab-case** for the directory name.
