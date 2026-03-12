---
name: lore-os
description: "Lore OS services — start, stop, or check status (Docker)"
type: command
user-invocable: true
allowed-tools:
  - Bash
---
# Lore OS Services

The Lore OS services run as Docker containers from `~/.lore-os/docker-compose.yml`. The agent manages them via `docker compose` — the harness binary has no involvement.

## Routing

| Input | Action |
|-------|--------|
| `/lore-os` (no args) | Start services |
| `/lore-os stop` | Stop services |
| `/lore-os status` | Health check |

## Start

```bash
cd ~/.lore-os && docker compose up -d
```

After starting, verify health:
```bash
curl -sf http://localhost:9184/health && echo "Memory engine is running" || echo "Memory engine failed to start"
```

## Stop

```bash
cd ~/.lore-os && docker compose down
```

## Status

```bash
curl -sf http://localhost:9184/health && echo "Memory engine is running" || echo "Memory engine is offline"
```

If offline, offer to start it. If the container exists but is stopped, `docker compose up -d` restarts it.
