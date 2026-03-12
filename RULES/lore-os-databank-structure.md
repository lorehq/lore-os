---
name: lore-os-databank-structure
description: DATABANK directory structure, enforcement rules, routing table, and writing conventions.
---
# DATABANK Structure

The DATABANK lives at `~/LORE-OS/DATABANK/`.

## Directory Tree

```
~/LORE-OS/DATABANK/
│
├── KNOWLEDGE_BASE/                      # All persistent knowledge — agent-curated
│   ├── operator/                        #   Operator identity & preferences
│   │   ├── operator-profile.md          #     STICKY — auto-created from stub if missing
│   │   └── {supporting-docs}.md
│   ├── machine/                         #   This machine's identity & infrastructure
│   │   ├── machine-profile.md           #     STICKY — auto-created from stub if missing
│   │   └── {supporting-docs}.md
│   ├── environment/                     #   External world — services, platforms, tooling
│   │   └── {topic}.md                   #     Agent-organized, free structure
│   ├── fieldnotes/                      #   Environmental snags & gotchas
│   │   └── {name}/                      #     One dir per fieldnote
│   │       └── FIELDNOTE.md
│   └── runbooks/                        #   Operational procedures
│       ├── system/                      #     Harness/infra runbooks
│       ├── first-session/               #     Onboarding runbooks
│       └── {category}/{name}.md
│
├── workspace/                           # Operator/agent collaboration
│   ├── drafts/                          #   WIP content (ONLY 2 children)
│   │   ├── brainstorms/                 #     Folder-per-brainstorm, NO loose files
│   │   │   └── {slug}/
│   │   │       ├── index.md
│   │   │       └── (supporting docs, sketches, diagrams)
│   │   └── notes/                       #     Single files ONLY, NO folders
│   │       └── {slug}.md
│   ├── projects/                        #   Per-project session logs
│   │   └── {project-name}/
│   │       └── session-log-{DATE}.md
│   └── work-items/                      #   Jira-like 3-tier, nested only
│       └── initiatives/
│           └── {slug}/
│               ├── index.md
│               ├── tasks.md
│               └── epics/
│                   └── {slug}/
│                       ├── index.md
│                       ├── tasks.md
│                       └── items/
│                           └── {slug}/
│                               ├── index.md
│                               └── tasks.md
│
└── imports/                             # Staging area — unsorted incoming docs
    └── {anything}                       #   Temporary holding, sort into proper areas
```

## Root Enforcement

**3 items at DATABANK root. Nothing else. No loose files.**

| Folder | Purpose |
|--------|---------|
| `KNOWLEDGE_BASE/` | All persistent knowledge — agent-curated (operator, machine, environment, fieldnotes, runbooks) |
| `workspace/` | Active collaboration: drafts, projects, tracked work |
| `imports/` | Staging inbox — unsorted incoming docs, sort into KNOWLEDGE_BASE/ promptly |

## Strict Children Rules

These paths have fixed children. **Creating anything else at these levels is forbidden.**

| Path | Allowed children | Rule |
|------|-----------------|------|
| `workspace/` | `drafts/`, `projects/`, `work-items/` | 3 dirs only, nothing else |
| `workspace/drafts/` | `brainstorms/`, `notes/` | 2 dirs only, nothing else |
| `workspace/drafts/brainstorms/` | `{slug}/` dirs only | NO loose files — every brainstorm is a folder |
| `workspace/drafts/notes/` | `{slug}.md` files only | NO folders — flat file list |
| `workspace/work-items/` | `initiatives/` | 1 dir only — entry point is always an initiative |

## Sticky Profiles

Two files are auto-created from stubs if missing. **Append only, never overwrite:**

- `KNOWLEDGE_BASE/operator/operator-profile.md` — operator identity, preferences, accounts
- `KNOWLEDGE_BASE/machine/machine-profile.md` — this host's hardware, OS, runtimes, tools

## Routing Rules

| Content Type | Destination | Format |
|---|---|---|
| Snag / gotcha / quirk | `KNOWLEDGE_BASE/fieldnotes/{name}/FIELDNOTE.md` | Frontmatter + Snags + Workaround |
| Procedure / how-to | `KNOWLEDGE_BASE/runbooks/{category}/{name}.md` | Step-by-step with snags section |
| Platform / service / tool fact | `KNOWLEDGE_BASE/environment/{topic}.md` | Factual reference (agent-organized) |
| Machine specs / local config | `KNOWLEDGE_BASE/machine/machine-profile.md` or supporting doc | Append to profile or create doc |
| Operator preferences / identity | `KNOWLEDGE_BASE/operator/operator-profile.md` or supporting doc | Append to profile or create doc |
| Session log archive | `workspace/projects/{project-name}/session-log-{DATE}.md` | Timestamped session notes |
| Brainstorm / design exploration | `workspace/drafts/brainstorms/{slug}/index.md` | Folder with supporting material |
| Quick note / scratch | `workspace/drafts/notes/{slug}.md` | Single file, minimal frontmatter |
| Strategic initiative (months) | `workspace/work-items/initiatives/{slug}/` | index.md + tasks.md + epics/ |
| Tactical epic (weeks) | nested under initiative `epics/{slug}/` | index.md + tasks.md + items/ |
| Deliverable item (days) | nested under epic `items/{slug}/` | index.md + tasks.md |
| Unsorted / incoming | `imports/{anything}` | Temporary — sort into proper area |

## Work-Item Hierarchy

Three-tier, Jira-compatible, **nested only** (no standalone epics or items):

| Tier | Scope | Contains |
|------|-------|----------|
| **Initiative** | Strategic, months | index.md, tasks.md, epics/ |
| **Epic** | Tactical, weeks | index.md, tasks.md, items/ |
| **Item** | Deliverable, days | index.md, tasks.md |

Hierarchy is expressed by nesting: `initiatives/auth-system/epics/token-rotation/items/rotate-api-keys/`. Path encodes lineage.

## Project Name Convention

Project names use the dashed path: `/home/user/projects/foo` → `home-user-projects-foo`.

## Writing Rules

1. **Frontmatter required** on all new files: `name` and `description` at minimum.
2. **No duplicates** — search before creating. Update existing files when possible.
3. **30-80 lines** for fieldnotes. Runbooks can be longer but keep sections focused.
4. **Kebab-case** for all filenames and directory names.
5. **Create parent dirs** — always `mkdir -p` before writing.
6. **Verify after write** — confirm the file exists and is valid markdown.
7. **Never create files/dirs that violate the strict children rules above.**

## Session Log Format

```markdown
---
name: session-log-YYYY-MM-DD
description: Session notes archived from hot memory
project: {project-name}
archived_at: {ISO-8601}
---
# Session Log — YYYY-MM-DD

## Notes

### {note-key}
{content}
```
