## Agent skills

### Issue tracker

GitHub Issues (`atl3tico/k1k-config`). Uses `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.

## Rules

### Chrome verification — MANDATORY
All features and bug fixes MUST be verified in Chrome using the `chrome-devtools` MCP tools. Never assume something works based on code changes alone. Always:
1. Navigate to the relevant page
2. Take a snapshot or screenshot
3. Confirm the fix/feature is visually correct
