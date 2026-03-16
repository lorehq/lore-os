---
name: lore-os-databank-create-initiative
description: Create an initiative — a strategic, months-long body of work (Jira initiative equivalent)
user-invocable: false
agent: lore-os-databank-agent
---
# Create Initiative

Initiatives are the top-level work-item tier. Strategic, months-long scope. Contains epics.

## Process

1. **Search first** — check existing initiatives to avoid duplicates.
2. Create the directory: `~/LORE-OS/DATABANK/workspace/work-items/initiatives/{slug}/`
3. Write `index.md` — the initiative description and goals.
4. Write `tasks.md` — agent-managed task checklist.
5. Create `epics/` directory.

## Schema

See `assets/initiative-template.md` for the `index.md` and `tasks.md` schemas.

## Rules

- **Kebab-case** for the directory name.
- `status` values: `active`, `paused`, `completed`, `cancelled`.
- `tasks.md` is agent-managed — agents update it freely. `index.md` is operator-approved.
- Epics nest inside: `{initiative}/epics/{epic-slug}/`.
