# Documentation Standards

> **Rule**: This project documents the current state only. Every sentence in every document must describe what the system does right now.

---

## What to Document

- How the application currently works
- Current implementation details and design decisions
- Business rationale for current design choices
- File paths and component references with line numbers

## What Not to Document

- Previous versions or past implementations
- Bugs that have been fixed
- Abandoned approaches or discarded ideas
- How a problem was discovered
- Why an old system was broken
- Migration steps or upgrade paths

## Writing Style

Documents answer two questions only:

**"How does this work?"** — The technical mechanism, data flow, or algorithm currently in use.

**"How do I use it?"** — What inputs, controls, or code patterns produce the desired result.

Documents never answer:
- "How did we discover the problem?"
- "Why was the old system broken?"
- "What changed from the previous version?"

## Comparative Language

Avoid all comparative language that implies a previous state existed:

| Avoid | Use instead |
|-------|-------------|
| "rather than", "instead of" | Just describe the current approach |
| "unlike the old", "improved from" | Just describe what it is |
| "we fixed", "we now handle" | Just describe the current behavior |
| "previously", "used to" | Omit entirely |

**Bad**: "The screening now uses constant-maturity IV rather than the old single-strike approach."
**Good**: "Each day's IV is a constant-maturity 30-day implied volatility computed via variance interpolation."

## Audience

All documentation is for senior professional investors who have deep knowledge of financial markets and options trading. Do not explain basic financial concepts. Do not add educational disclaimers. Present facts and methodology; let investors draw their own conclusions.
