---
name: lore-os-databank-create-epic
description: Create an epic — a tactical, weeks-long body of work nested under an initiative
user-invocable: false
agent: lore-os-databank-agent
---
# Create Epic

Epics are the middle work-item tier. Tactical, weeks-long scope. Always nested under an initiative.

## Process

1. **Identify the parent initiative** — epics cannot exist standalone.
2. Create the directory: `{initiative}/epics/{slug}/`
3. Write `index.md` — the epic description.
4. Write `tasks.md` — agent-managed task checklist.
5. Create `items/` directory.

## Schema

See `assets/epic-template.md` for the `index.md` and `tasks.md` schemas.

## Rules

- **Always nested** under `initiatives/{slug}/epics/` — no standalone epics.
- **Kebab-case** for the directory name.
- `status` values: `active`, `paused`, `completed`, `cancelled`.
- Items nest inside: `{epic}/items/{item-slug}/`.
