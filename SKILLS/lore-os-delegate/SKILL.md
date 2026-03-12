---
name: lore-os-delegate
description: Delegation Protocol — enforcing the Subagent Envelope Contract and upward intelligence flow.
user-invocable: false
---
# Delegation Protocol

Delegation is the primary method of context-efficient execution. Enforce the Envelope Contract to ensure the harness grows smarter with every subagent return.

## The Subagent Envelope Contract

In every worker prompt, include a constraint for environmental intelligence reporting.

**The Prompt Directive**:
> "Return your execution results alongside a separate [ENVELOPE-REPORT] section documenting any gotchas, pitfalls, newly encountered endpoints, or file topology found during the task."

## Worker Prompt Template

```text
Objective: [Concrete, resolved task.]
Success Criteria: [Pass/fail conditions.]
Scope/Boundaries: [Allowed paths, services, and repo boundaries.]
[ENVELOPE-CONTRACT]: Required gotchas/topology report in response.
```

## Post-Return Intelligence Extraction

When a worker returns:
1. **Extract**: Pull the [ENVELOPE-REPORT] data.
2. **Commit**: Write snags/topology to Hot Memory (Redis).
3. **Propose**: Flag high-signal items for graduation to the DATABANK.
