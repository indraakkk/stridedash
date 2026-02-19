---
name: audit-plan
description: Audit code or plan using karpathy-agent — checks simplicity, correctness-first, no over-engineering.
disable-model-invocation: true
argument-hint: [what to audit]
context: fork
agent: karpathy-agent
---

Audit the following: $ARGUMENTS

Focus on:
- Detecting over-engineering and code bloat
- Identifying unnecessary abstractions
- Ensuring correctness-first development
- Validating assumptions before implementation
- Presenting tradeoffs and pushing back on complexity
- Running the self-review checklist
