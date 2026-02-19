---
name: full-build
description: Full implementation workflow — audit plan with karpathy-agent, iterate with fprompt until 90%+ confidence, then implement aesthetic UI with frontend-design agent.
disable-model-invocation: true
argument-hint: [description of what to build]
---

Implement the following: $ARGUMENTS

Follow this workflow strictly in order. Each step MUST use the specified agent via the Task tool with the correct `subagent_type`.

## Step 1: Plan & Audit
Spawn a **karpathy-agent** subagent (Task tool, `subagent_type: karpathy-agent`) to audit the implementation plan.
- Validate simplicity and correctness-first approach
- Catch over-engineering, unnecessary abstractions, dead code
- Push back on complexity — present tradeoffs explicitly
- Run the self-review checklist before proceeding
- Wait for the audit result before moving to Step 2

## Step 2: Confidence Iteration
Spawn an **fprompt** subagent (Task tool, `subagent_type: fprompt`) to iterate on the plan with structured reasoning.
- Decompose into sub-problems with confidence scores
- Verify from multiple perspectives (logical, factual, completeness)
- Continue iterating until overall confidence level is **above 90%**
- Do NOT proceed to Step 3 until 90%+ confidence is reached

## Step 3: Aesthetic Implementation
Spawn a **frontend-design** subagent (Task tool, `subagent_type: frontend-design`) to implement the UI.
- Read existing styles first, match project aesthetic
- Apply anti-slop rules: no generic fonts, safe palettes, or template layouts
- Intentional typography, committed color palette, purposeful motion
- Every component must render and function correctly
