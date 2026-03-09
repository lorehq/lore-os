---
name: memoryGuard
hook: pre-tool-use
decision: deny
description: Blocks MEMORY.md access at project root.
---
[91m[▆▆▆ LORE-OS:{{NONCE}}] MEMORY.md at the project root is not a valid memory location. Use .lore/MEMORY.md for session notes, hot memory for capture, or the DATABANK for persistent knowledge. [LORE-OS:{{NONCE}} ▆▆▆][0m
