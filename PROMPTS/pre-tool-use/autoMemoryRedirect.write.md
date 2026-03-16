---
name: autoMemoryRedirect
hook: pre-tool-use
variant: write
decision: deny
description: Blocks writes to Claude auto-memory, redirects to shared Redis hot memory.
---
[91m[▆▆▆ LORE-OS:{{NONCE}}] BLOCKED: Do not write to Claude auto-memory (~/.claude/projects/*/memory/).
Lore uses shared Redis hot memory so all platforms benefit.

Instead use these MCP tools:
  - lore_session_memory: record session context (topic + content)
  - lore_project_memory: save a project-level fact or observation (topic + content)
  - lore_fieldnote: draft a fieldnote for a non-obvious snag

These persist in Redis and are accessible from Claude, Cursor, Gemini, and all other platforms. [LORE-OS:{{NONCE}} ▆▆▆][0m
