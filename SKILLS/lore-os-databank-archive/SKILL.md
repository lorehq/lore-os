---
name: lore-os-databank-archive
description: Archive project session notes from hot Redis memory to the DATABANK as a session log
user-invocable: false
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
---
# Archive Session Notes

Archive project-scoped session notes from Redis hot memory into a persistent session log in the DATABANK.

## Process

**1. Identify Project**

Derive the project name (Claude-style dashed path):
```bash
# e.g. /home/andrew/Github/lore-engineering → home-andrew-Github-lore-engineering
PROJECT=$(pwd | sed 's|^/||; s|/|-|g')
```

**2. Fetch Session Notes**

Pull all session notes for this project from Redis:
```bash
docker exec lore-memory-1 redis-cli SMEMBERS "lore:hot:idx:project:${PROJECT}"
```

For each key, fetch the hash:
```bash
docker exec lore-memory-1 redis-cli HGETALL "${KEY}"
```

Filter to `type=session-note` entries only. Skip fieldnotes (those graduate separately via burn).

**3. Build Session Log**

Write to: `~/LORE-OS/DATABANK/workspace/projects/${PROJECT}/session-log-$(date +%Y-%m-%d).md`

Format:
```markdown
---
name: session-log-YYYY-MM-DD
description: Session notes archived from hot memory
project: {PROJECT}
archived_at: {ISO-8601}
---
# Session Log — YYYY-MM-DD

## Notes

### {note-key}
{content}

### {note-key-2}
{content}
```

If a session log already exists for today, **append** new notes — do not overwrite.

**4. Cleanup**

After successful write, remove archived session notes from Redis:
```bash
docker exec lore-memory-1 redis-cli DEL "${KEY}"
docker exec lore-memory-1 redis-cli SREM "lore:hot:idx:project:${PROJECT}" "${KEY}"
docker exec lore-memory-1 redis-cli SREM "lore:hot:idx:all" "${KEY}"
```

Do NOT remove global-scoped entries — those persist across projects.

**5. Verify**

Confirm the session log file exists and contains the archived notes.
