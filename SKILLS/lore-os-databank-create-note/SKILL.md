---
name: lore-os-databank-create-note
description: Create a note — a quick scratch capture or reminder
user-invocable: false
agent: lore-os-databank-agent
---
# Create Note

Notes are quick captures — scratch thoughts, reminders, decisions to revisit. Single files, minimal overhead.

## Process

1. Write to `~/LORE-OS/DATABANK/workspace/drafts/notes/{slug}.md`.
2. That's it. No folder, no supporting docs.

## Schema

See `assets/note-template.md` for the file schema.

## Rules

- **Single file only** — no folders in `notes/`.
- **Minimal frontmatter**: `title`, `status` (`open` or `resolved`), `created`.
- **Kebab-case** for the filename.
- When resolved, change status to `resolved` — don't delete.
- Don't over-polish — preserve the operator's words and intent.
