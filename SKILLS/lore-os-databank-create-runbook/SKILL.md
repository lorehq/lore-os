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

See `assets/runbook-template.md` for the file schema.

## Rules

- **Kebab-case** for the filename.
- Keep sections focused — split oversized runbooks into separate procedures.
- Include a **Snags** section even if empty — it signals awareness.
- Categories: `system/` (harness/infra), `first-session/` (onboarding), or create a new category dir.
