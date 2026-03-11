---
name: lore-os-burn
description: Promote hot session facts from Redis into the persistent DATABANK
type: command
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
# Burn — Hot Memory → DATABANK

Promote hot session facts from Redis into the persistent DATABANK.

## Process

**1. Scan Hot Memory**

Use the `lore_recall` MCP tool:
```
lore_recall(limit: 20)
```

Fallback via redis-cli (keys are scoped per project):
```bash
docker exec lore-memory-1 redis-cli SMEMBERS "lore:hot:idx:all"
docker exec lore-memory-1 redis-cli HGETALL "lore:hot:<key>"
```

**2. Heat Filter**

Present only facts above the heat threshold (score > 1.0). Show key, content, hit count, and score.

**3. Present for Approval**

Show a numbered list. For each:
- **Key**: hot memory identifier
- **Score**: current heat score
- **Content**: fact or draft fieldnote body
- **Proposed location**: where it would land in the DATABANK

Operator selects which facts to promote, skip, or discard.

**4. Commit**

Delegate all DATABANK writes to the `lore-os-databank-agent` (it enforces structure and routing rules). For each approved fact, the agent routes to:

| Hot memory type | DATABANK destination |
|---|---|
| `fieldnote:*` | `fieldnotes/{name}/FIELDNOTE.md` |
| Environment facts | `environment/{topic}.md` |
| Operator preferences | `operator/operator-profile.md` (append only) |
| Procedural knowledge | `runbooks/{category}/{name}.md` |

Hot cache entries remain after promotion (they decay naturally). Do not delete them.

**5. Archive Session Notes**

After burn, archive project-scoped session notes using the `lore-os-databank-archive` skill. This copies `note:*` entries to `~/LORE-OS/DATABANK/workspace/projects/{project-name}/session-log-{date}.md` and removes them from Redis.
