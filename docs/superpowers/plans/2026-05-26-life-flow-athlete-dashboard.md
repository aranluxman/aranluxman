# Life Flow Athlete Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Life Flow into Aran's athlete, school, volunteer, and builder dashboard with shared progress tracking and playable rewards.

**Architecture:** Extend the current vanilla JavaScript state model and rendering functions rather than replacing the app shell. Put deterministic calculations in `src/planner-utils.mjs`, retain UI/state orchestration in `src/app.mjs`, and store schema-compatible new synchronized fields using a Supabase migration.

**Tech Stack:** HTML, CSS, ES modules, Node test runner, localStorage, Supabase REST/RLS, Cloudflare Pages.

---

### Task 1: Shared Planner Calculations

**Files:**
- Modify: `src/planner-utils.mjs`
- Modify: `test/planner.test.mjs`

- [ ] Add failing tests for category filters, recurring occurrence matching, sleep score grades, weekly fitness totals, and coin breakdown rules.
- [ ] Run `node --test test/planner.test.mjs` and verify those new expectations fail because the exports do not exist or old behavior differs.
- [ ] Implement pure helper functions and update `filterItems`/`calculateStats` to use the requested categories and reward values.
- [ ] Re-run the test suite and verify it passes.

### Task 2: App State And Settings

**Files:**
- Modify: `index.html`
- Modify: `src/app.mjs`
- Modify: `styles.css`

- [ ] Add settings controls for display name and tracking goals, plus local reset confirmation.
- [ ] Add shared state for progress bars, fitness logs, photo notes, boosts, and game records with safe defaults for existing saved state.
- [ ] Wire settings and progress edits through `persist()` so Home and Tasks update from the same values.

### Task 3: Planning, Recovery, And Focus Views

**Files:**
- Modify: `index.html`
- Modify: `src/app.mjs`
- Modify: `styles.css`

- [ ] Build Home widgets for stats, today events, coach tips, Duke bars, and expandable reminder notes.
- [ ] Build Tasks quick-add/details, category filters, subtasks, overdue badges, and fitness/Duke controls.
- [ ] Build Calendar dots, seeded recurring events, repeat inputs, day actions, and month/week displays.
- [ ] Build Sleep summary/score/mood/impact UI and Focus label/goal/history/completion UI.

### Task 4: Arcade Rewards

**Files:**
- Modify: `index.html`
- Modify: `src/app.mjs`
- Modify: `styles.css`

- [ ] Implement coin summary and rules, rotating boost completion reward, and editable goal.
- [ ] Implement Reaction Tap with last-five history and best time.
- [ ] Implement Memory Match with coin entry cost, win reward, timer, and moves.

### Task 5: Persistence And Proof

**Files:**
- Create: `supabase/migrations/20260526000000_extend_life_flow_tracking.sql`
- Modify: `src/app.mjs`

- [ ] Add Supabase-compatible columns for new task, sleep, and focus session fields and preserve RLS.
- [ ] Apply and query the migration through the connected project tools.
- [ ] Run syntax/tests, inspect the UI in the browser at desktop and mobile sizes, remove temporary artifacts, stage only intended files, commit, and push to the same GitHub repository.
