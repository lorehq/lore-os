---
name: lore-os-databank-create-item
description: Create an item — a deliverable, days-long unit of work nested under an epic
user-invocable: false
agent: lore-os-databank-agent
---
# Create Item

Items are the leaf work-item tier. Deliverables, days-long scope. Always nested under an epic.

## Process

1. **Identify the parent epic** — items cannot exist standalone.
2. Create the directory: `{epic}/items/{slug}/`
3. Write `index.md` — the item description.
4. Write `tasks.md` — agent-managed task checklist.

## Schema — index.md

```markdown
---
title: {Title}
status: active
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
summary: One-line summary of the item
---
# {Title}

## Deliverable

[What this item produces]

## Acceptance Criteria

[How we know it's done]
```

## Schema — tasks.md

```markdown
# Tasks

## Active

- [ ] {task description}

## Done

- [x] {completed task}
```

## Rules

- **Always nested** under `epics/{slug}/items/` — no standalone items.
- **Kebab-case** for the directory name.
- `status` values: `active`, `paused`, `completed`, `cancelled`.
- Items are leaf nodes — no further nesting.
