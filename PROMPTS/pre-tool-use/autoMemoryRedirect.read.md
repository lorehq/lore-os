---
name: autoMemoryRedirect
hook: pre-tool-use
variant: read
decision: context
description: Redirects away from Claude auto-memory reads toward shared Lore memory.
---
[91m[▆▆▆ LORE-OS:{{NONCE}}] Skip auto-memory reads. Use Lore's shared memory instead:
  - lore_hot_recall: recall recent facts and session context from Redis
  - lore_search: semantic search across the DATABANK
  - Grep/Glob on ~/LORE-OS/DATABANK/ for direct file access

These are shared across all platforms — not just Claude. [LORE-OS:{{NONCE}} ▆▆▆][0m
