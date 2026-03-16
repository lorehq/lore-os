# Lore OS

Opinionated behavioral layer for the [Lore](https://github.com/lorehq/lore) harness.

## What It Does

AI agents forget everything between sessions, write to files they should not touch, and lose hard-won context when you compact or restart. Lore OS is a behavioral layer that runs as hook scripts during your agentic workflow, adding memory, guardrails, and knowledge accumulation that persist across sessions and projects.

When an agent tries to write directly to managed memory paths (the DATABANK, hot memory), the Memory Guard intercepts the tool call and blocks it -- memory writes must flow through the proper MCP tools so structure is enforced and nothing gets corrupted. When an agent tries to modify your harness configuration at `~/.config/lore/`, the Harness Guard gates the write behind operator approval so your global setup does not get silently changed mid-session.

During long sessions, agents accumulate findings -- snags, gotchas, environment quirks -- but rarely write them down. The Search Nudge reminds the agent to check existing knowledge before rediscovering things from scratch. The Memory Capture hook watches for high-signal discoveries in tool output and prompts the agent to persist them. These nudges are adaptive: the standard profile fires every 15 tool uses, the discovery profile fires every 5, and the minimal profile disables them entirely.

Before your prompt reaches the agent, the Ambiguity Scanner checks for vague terms ("fix it," "make it better," "handle the edge cases") and flags them so you can clarify intent before the agent wastes context on the wrong interpretation.

Lore OS also provides a structured knowledge system called the DATABANK (`~/LORE-OS/DATABANK/`). A dedicated DATABANK agent acts as gatekeeper, routing content into the correct area: fieldnotes for snags and gotchas, runbooks for procedures, environment docs for platform facts, and a three-tier work-item hierarchy (initiatives, epics, items) for tracking work. Skills for creating each content type enforce schemas and structural rules. The `/lore-os-defrag` skill restructures the DATABANK when it grows disorganized, and `/lore-os-delegate` enforces an envelope contract for subagent delegation so worker agents report environmental intelligence back to the caller.

Four profiles let you dial the behavioral intensity: `off` (no hooks), `minimal` (structural guards only), `standard` (all behaviors at default thresholds), and `discovery` (aggressive thresholds for exploration sessions). All scripts are vanilla Node.js with no dependencies.

## Installation

Installed via `lore init` during first-run setup. Or manually:

```sh
lore bundle install lore-os
```

This clones the repo to `~/.lore-os/` and validates the manifest.

## Profiles

| Profile | Behavior |
|---------|----------|
| `off` | No hooks |
| `minimal` | Structural guards only |
| `standard` | All behaviors at default thresholds |
| `discovery` | Aggressive thresholds for exploration |

Set in `.lore/config.json`: `{ "profile": "standard" }`

## Customization

Fork this repo, install under a different slug (`lore bundle install <your-slug> --url <your-fork>`), and point your hook config at it. Scripts are vanilla Node.js — no build step, no dependencies.

## License

Apache 2.0
