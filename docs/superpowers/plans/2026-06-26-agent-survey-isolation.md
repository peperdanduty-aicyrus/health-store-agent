# Agent Survey Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create reversible multi-site isolation for Agent and Survey with separate route protection, Wrangler configs, D1 databases, workers.dev deployments, verification, and morning handoff docs.

**Architecture:** Keep one repository and one Next.js app for this stage, but introduce `APP_MODE=agent|survey` and `APP_ENV=production|preview`. Use middleware plus server-side assertions to prevent cross-system access, migrate Agent admin to `/agent-admin`, keep Survey admin at `/cyrus`, and deploy four independent Cloudflare Workers backed by four independent D1 databases.

**Tech Stack:** Next.js App Router, OpenNext Cloudflare, Wrangler, Cloudflare D1, TypeScript, Vitest.

---

### Task 1: Branch, Baseline, and Stage 2 Docs

**Files:**
- Create: `docs/superpowers/plans/2026-06-26-agent-survey-isolation.md`
- Commit: second-stage docs already generated under `docs/2026-06-26-*.md`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch -c feature/agent-survey-isolation db350e6a981e6c129b0878322b1136e356081ca1
```

Expected: branch exists at stage 6 freeze commit.

- [ ] **Step 2: Commit plan and second-stage documents**

Run:

```bash
git add docs/2026-06-26-agent-target-version-analysis.md \
  docs/2026-06-26-survey-smoke-data-treatment-plan.md \
  docs/2026-06-26-agent-survey-route-isolation-design.md \
  docs/2026-06-26-stage-2-agent-version-d1-ownership-acceptance.md \
  docs/2026-06-26-d1-table-ownership-map.md \
  docs/superpowers/plans/2026-06-26-agent-survey-isolation.md
git commit -m "docs: add stage 2 isolation findings"
```

Expected: docs-only commit.

### Task 2: Application Mode and Route Guards

**Files:**
- Create: `src/lib/app-mode.ts`
- Create: `middleware.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `next.config.ts`
- Modify: Agent and Survey server action/route entrypoints
- Test: `src/lib/app-mode.test.ts`

- [ ] **Step 1: Add `getAppMode`, `assertAgentMode`, and `assertSurveyMode`**
- [ ] **Step 2: Add middleware route allow/deny lists**
- [ ] **Step 3: Add server-side assertions to Agent and Survey entrypoints before repository access**
- [ ] **Step 4: Make root route mode-aware**
- [ ] **Step 5: Make metadata mode-aware**
- [ ] **Step 6: Add unit tests for mode parsing, route decisions, and metadata**
- [ ] **Step 7: Commit**

### Task 3: Agent Admin Migration

**Files:**
- Create/restore: `src/app/agent-admin/**`
- Modify: `src/app/cyrus/page.tsx`
- Modify: `src/app/actions.ts`
- Modify: `src/lib/auth/session.ts`
- Modify: `components/admin/AdminShell.tsx`

- [ ] **Step 1: Copy Agent admin routes from `src/app/cyrus/**` into `src/app/agent-admin/**`**
- [ ] **Step 2: Restore `src/app/agent-admin/page.tsx` from `15357dd:src/app/cyrus/page.tsx`**
- [ ] **Step 3: Update Agent redirects and `revalidatePath` calls from `/cyrus` to `/agent-admin`**
- [ ] **Step 4: Keep Survey `/cyrus` intact in Survey mode**
- [ ] **Step 5: Make Agent mode `/cyrus` redirect to `/agent-admin`**
- [ ] **Step 6: Commit**

### Task 4: D1 Migrations and Data Scripts

**Files:**
- Create: `migrations-agent/0001_agent_core.sql`
- Create: `scripts/stage3/export-agent-data-sql.ts`
- Create: `scripts/stage3/export-survey-foundation-sql.ts`
- Create: `scripts/stage3/verify-d1-counts.ts`

- [ ] **Step 1: Convert Agent runtime schema into `migrations-agent/0001_agent_core.sql`**
- [ ] **Step 2: Generate Agent copy SQL for 6 Agent tables from old backup or remote export**
- [ ] **Step 3: Generate Survey foundation SQL that excludes smoke business data**
- [ ] **Step 4: Add count verification script**
- [ ] **Step 5: Commit**

### Task 5: Wrangler Configs

**Files:**
- Create: `wrangler.agent.prod.jsonc`
- Create: `wrangler.agent.preview.jsonc`
- Create: `wrangler.survey.prod.jsonc`
- Create: `wrangler.survey.preview.jsonc`

- [ ] **Step 1: Add four config files with separate Worker names, D1 database names, `APP_MODE`, and `APP_ENV`**
- [ ] **Step 2: Keep production configs without custom domain binding**
- [ ] **Step 3: Commit**

### Task 6: Cloudflare D1 and Worker Deployment

**Resources:**
- D1: `health-agent-db`, `health-agent-preview-db`, `mall-survey-db`, `mall-survey-preview-db`
- Workers: `health-agent-prod`, `health-agent-preview`, `mall-survey-prod`, `mall-survey-preview`

- [ ] **Step 1: Create missing D1 databases**
- [ ] **Step 2: Update Wrangler D1 IDs**
- [ ] **Step 3: Apply Agent and Survey migrations**
- [ ] **Step 4: Import Agent production data and Survey foundation data**
- [ ] **Step 5: Deploy four workers.dev Workers**
- [ ] **Step 6: Record Worker version IDs and URLs**
- [ ] **Step 7: Commit config ID updates if changed**

### Task 7: Verification and Reports

**Files:**
- Create: `docs/2026-06-26-stage-3-overnight-isolation-acceptance.md`
- Create: `docs/2026-06-26-morning-summary.md`

- [ ] **Step 1: Run unit tests, production build, and OpenNext build**
- [ ] **Step 2: Verify D1 counts and smoke-data exclusion**
- [ ] **Step 3: Verify workers.dev Agent routes and Survey route denial**
- [ ] **Step 4: Verify workers.dev Survey routes and Agent route denial**
- [ ] **Step 5: Verify old public domains read-only**
- [ ] **Step 6: Write acceptance report and morning summary**
- [ ] **Step 7: Stop before formal domain switch**

