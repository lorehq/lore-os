---
name: lore-os-databank-create-runbook
description: Create a runbook — captures a multi-step operational procedure
user-invocable: false
agent: lore-os-databank-agent
---
# Create Runbook

Runbooks are step-by-step operational procedures. They live in `~/LORE-OS/DATABANK/KNOWLEDGE_BASE/runbooks/`, organized by category.

## When to Create

Multi-step procedures that are likely to be repeated: deployments, migrations, setup flows, maintenance tasks, troubleshooting sequences.

**Not runbooks**: Single-fact discoveries — those are fieldnotes.

## Process

1. **Search first** — check existing runbooks to avoid duplicates.
2. Determine the category (`system/`, `first-session/`, or a topic-based category).
3. Write to `~/LORE-OS/DATABANK/KNOWLEDGE_BASE/runbooks/{category}/{slug}.md`.
4. Verify the file exists.

## Schema

```markdown
---
name: {slug}
description: One-line description of the procedure
captured: {YYYY-MM-DD}
---
# {Title}

[Context — when and why to run this]

## Prerequisites

[What must be true before starting]

## Steps

1. [Step one]
2. [Step two]
3. [Step three]

## Snags

[Known gotchas encountered during this procedure — link to fieldnotes if they exist]

## Verification

[How to confirm the procedure succeeded]
```

## Rules

- **Kebab-case** for the filename.
- Keep sections focused — split oversized runbooks into separate procedures.
- Include a **Snags** section even if empty — it signals awareness.
- Categories: `system/` (harness/infra), `first-session/` (onboarding), or create a new category dir.
