---
name: lore-os-defrag
description: Restructure the DATABANK — deduplicate, reroute, and consolidate
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
# Defrag — DATABANK Restructure

Restructure the DATABANK by content rather than creation order.

Run after the environment is substantially documented — not before.

## Process

1. Check memory engine is running.
2. Scan `~/LORE-OS/DATABANK/` for structural issues (duplicates, misrouted content, oversized files).
3. Present proposed changes to operator for approval.
4. Execute on a branch:
   ```bash
   cd ~/.lore-os && git checkout -b databank-defrag-$(date +%Y%m%d)
   ```
5. After operator review, merge.
