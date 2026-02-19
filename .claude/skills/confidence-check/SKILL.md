---
name: confidence-check
description: Structured reasoning with fprompt — decompose, verify, iterate until 90%+ confidence.
disable-model-invocation: true
argument-hint: [problem or plan to evaluate]
context: fork
agent: fprompt
---

Evaluate the following with structured reasoning: $ARGUMENTS

Iterate until confidence is above 90%:
1. Decompose into sub-problems with confidence scores
2. Verify from multiple perspectives (logical, factual, completeness)
3. Identify hidden assumptions and biases
4. If confidence < 90%, identify weak points and retry
5. Only finalize when overall confidence exceeds 0.90
