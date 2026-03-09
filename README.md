# Lore OS

Opinionated behavioral layer for the [Lore](https://github.com/lorehq/lore) harness.

## What It Does

Lore OS adds guards, nudges, and knowledge capture behaviors to your agentic workflow:

- **Memory Guard** — Protects managed memory paths from direct agent access
- **Harness Guard** — Gates writes to `~/.lore/` behind operator approval
- **Capture Nudges** — Adaptive reminders to record findings during long sessions
- **Ambiguity Scanner** — Flags vague terms in prompts before they reach the agent
- **Signal System** — Nonce-stamped prompt directives with graduated color salience

## Installation

Installed via `lore init` during first-run setup. Or manually:

```sh
lore os install lore-os
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

Fork this repo, install under a different slug (`lore os install --url <your-fork>`), and point your hook config at it. Scripts are vanilla Node.js — no build step, no dependencies.

## License

Apache 2.0
