# Custom Skills (Slash Commands)

Reusable workflows that compose the project's custom agents into single commands.

## Available Skills

### `/full-build [description]`

Full implementation pipeline — audit, validate, then build.

```
/full-build redesign the upload page with drag-and-drop
```

Runs 3 steps in order:
1. **karpathy-agent** audits the plan (simplicity, correctness-first, no over-engineering)
2. **fprompt** iterates with structured reasoning until confidence > 90%
3. **frontend-design** implements the UI (anti-slop, intentional aesthetics)

### `/audit-plan [what to audit]`

Code quality review using karpathy-agent.

```
/audit-plan the sync engine refactor
/audit-plan current gauge-canvas implementation
```

### `/confidence-check [problem or plan]`

Structured reasoning with fprompt — decompose, verify, iterate.

```
/confidence-check timeline snapping approach
/confidence-check state management migration to zustand slices
```

### `/aesthetic-ui [component or page]`

UI implementation using frontend-design agent.

```
/aesthetic-ui gauge settings panel
/aesthetic-ui export progress modal
```

## How Skills Wire to Agents

Each skill uses `context: fork` + `agent:` frontmatter to spawn the actual agent as an isolated subagent.
The `/full-build` skill orchestrates all 3 sequentially via Task tool dispatch.

| Skill | Agent | Wiring |
|---|---|---|
| `/audit-plan` | `karpathy-agent` | `context: fork`, `agent: karpathy-agent` |
| `/confidence-check` | `fprompt` | `context: fork`, `agent: fprompt` |
| `/aesthetic-ui` | `frontend-design` | `context: fork`, `agent: frontend-design` |
| `/full-build` | all 3 | sequential Task tool dispatch (karpathy-agent → fprompt → frontend-design) |

## Agents

| Agent | File | Role |
|---|---|---|
| karpathy-agent | `.claude/agents/karpathy-agent.md` | Code quality guardian, anti-over-engineering |
| fprompt | `.claude/agents/fprompt.md` | Meta-cognitive reasoning, confidence scoring |
| frontend-design | `.claude/agents/frontend-design.md` | Distinctive, production-grade UI |

All agents require frontmatter with `name`, `description`, `tools`, and `model` fields.

## File Structure

```
.claude/
├── agents/
│   ├── karpathy-agent.md
│   ├── fprompt.md
│   └── frontend-design.md
└── skills/
    ├── full-build/SKILL.md
    ├── audit-plan/SKILL.md
    ├── confidence-check/SKILL.md
    └── aesthetic-ui/SKILL.md
```

## Adding New Skills

Create a directory under `.claude/skills/` with a `SKILL.md` file:

```
mkdir -p .claude/skills/my-skill
```

```markdown
---
name: my-skill
description: What this skill does and when to use it
disable-model-invocation: true
argument-hint: [expected arguments]
---

Instructions here. Use $ARGUMENTS for user input.
```

Key frontmatter options:
- `disable-model-invocation: true` — only fires when you type `/my-skill`
- `argument-hint` — shows hint text during autocomplete
- `context: fork` — runs in isolated subagent context
- `allowed-tools` — restrict which tools the skill can use
