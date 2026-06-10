# Health Store Agent MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent Next.js MVP for the local health-store acquisition assistant, with mock AI generation first and Qwen integration reserved for later.

**Architecture:** Use a Next.js App Router project with small domain modules for plans, auth, generation scenes, sensitive-word scanning, and AI providers. The first implementation keeps data in local seed-backed stores so the UI and permission flows can be verified before connecting Supabase and Qwen.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, local mock data, future Supabase and OpenAI-compatible model providers.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `src/app`: public, customer, admin, and API routes.
- `src/components`: shared UI blocks such as buttons, cards, QR panels, shell layouts, and forms.
- `src/lib/domain`: membership plans, permissions, scene metadata, validation, and date/count rules.
- `src/lib/ai`: provider selection and mock/OpenAI-compatible provider implementations.
- `src/lib/safety`: sensitive-word dictionary and scanner.
- `src/lib/data`: temporary mock store and seed records.
- `public/images/wechat-qr.png`: copied from the existing personal website.

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Copy: `public/images/wechat-qr.png`

- [ ] Create the Next.js project files inside `/Users/lvminglei/Desktop/codexuse/health-store-agent`.
- [ ] Install dependencies: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `eslint-config-next`, `lucide-react`, `vitest`.
- [ ] Copy `/Users/lvminglei/Desktop/codexuse/cyrus-store-growth/public/images/wechat-qr.png` to `public/images/wechat-qr.png`.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Start local dev server and verify the root page loads.

## Task 2: Add Domain Rules With Tests

**Files:**
- Create: `src/lib/domain/plans.ts`
- Create: `src/lib/domain/scenes.ts`
- Create: `src/lib/domain/permissions.ts`
- Create: `src/lib/domain/permissions.test.ts`

- [ ] Add tests for plan access:
  - free trial can use all six scenes with daily limit 5.
  - basic monthly can use only xiaohongshu, moments, and official account with daily limit 30.
  - standard monthly and internal yearly can use all six scenes with daily limit 30.
  - expired users can view history but cannot generate.
  - disabled users cannot generate.
- [ ] Implement the minimal plan and permission functions to pass tests.
- [ ] Run the permission tests.

## Task 3: Add Sensitive-Word Scanner With Tests

**Files:**
- Create: `src/lib/safety/sensitive-words.ts`
- Create: `src/lib/safety/sensitive-words.test.ts`

- [ ] Add tests for detecting words such as `根治`, `治愈`, `立竿见影`, `无副作用`, and `全城最低价`.
- [ ] Add tests for the no-risk message.
- [ ] Implement scanner output with detected words and replacement suggestions.
- [ ] Run the scanner tests.

## Task 4: Add Mock Data Store

**Files:**
- Create: `src/lib/data/types.ts`
- Create: `src/lib/data/seed.ts`
- Create: `src/lib/data/store.ts`

- [ ] Define profile, trial application, generation, and generation input types.
- [ ] Add one admin seed user and several customer seed users covering free trial, basic, standard, yearly, expired, and disabled states.
- [ ] Add in-memory functions for login, user listing, user creation, application creation, generation creation, generation listing, copy flag update, and note update.
- [ ] Keep all functions behind a narrow data API so Supabase can replace it later.

## Task 5: Add AI Provider Layer

**Files:**
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/providers/mock.ts`
- Create: `src/lib/ai/providers/openai-compatible.ts`
- Create: `src/lib/ai/providers/qwen.ts`
- Create: `src/lib/ai/providers/deepseek.ts`
- Create: `src/lib/prompts/scenes.ts`

- [ ] Implement `generateContent({ userId, scene, storeProfile, input })`.
- [ ] Make `AI_PROVIDER=mock` return structured sample outputs for all six scenes.
- [ ] Add OpenAI-compatible provider shell that reads `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`.
- [ ] Do not require Qwen API for local build.

## Task 6: Build Public Pages

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/tutorial/page.tsx`
- Create: `src/components/public/HomePage.tsx`
- Create: `src/components/public/TrialForm.tsx`
- Create: `src/components/WechatQrPanel.tsx`

- [ ] Build mobile-first homepage with title, subtitle, two primary buttons, suitable store types, six core functions, package cards, compliance note, trial form, and QR code.
- [ ] Build `/tutorial` with the 10 simple steps from the requirements.
- [ ] Submit trial application into the mock store and show the success message with QR code.

## Task 7: Build Auth and Customer Workspace

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/app/page.tsx`
- Create: `src/app/app/generate/[scene]/page.tsx`
- Create: `src/app/app/history/page.tsx`
- Create: `src/app/app/account/page.tsx`
- Create: `src/components/customer/CustomerShell.tsx`
- Create: `src/components/customer/SceneCardGrid.tsx`
- Create: `src/components/customer/GenerationForm.tsx`
- Create: `src/components/customer/GenerationResult.tsx`
- Create: `src/components/customer/HistoryList.tsx`
- Create: `src/components/customer/AccountSummary.tsx`

- [ ] Add phone/password login UI.
- [ ] Use a simple local cookie/session helper for MVP navigation.
- [ ] Show six scene cards with locked state according to plan.
- [ ] Add generation form fields: project name, target customer, purpose, extra info.
- [ ] Check permission before generation.
- [ ] Show generated result, sensitive check, remaining daily count, copy button, note field, and return button.
- [ ] Show user history and account status.

## Task 8: Build Admin `/cyrus`

**Files:**
- Create: `src/app/cyrus/page.tsx`
- Create: `src/app/cyrus/users/page.tsx`
- Create: `src/app/cyrus/applications/page.tsx`
- Create: `src/app/cyrus/generations/page.tsx`
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/components/admin/AdminDashboard.tsx`
- Create: `src/components/admin/UserManagement.tsx`
- Create: `src/components/admin/ApplicationManagement.tsx`
- Create: `src/components/admin/GenerationManagement.tsx`

- [ ] Add admin login guard.
- [ ] Show dashboard metrics: today generations, active users, trial users, paid users, expired users.
- [ ] Add user management list and create/edit forms.
- [ ] Add trial application list with status changes.
- [ ] Add generation list with filters for user, store type, plan, generation type, copied status, model, and created time.

## Task 9: Verify MVP

**Files:**
- Modify as needed based on verification.

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the dev server.
- [ ] Open the local site in browser and verify:
  - homepage and QR render.
  - trial application success message renders.
  - customer login works with seed users.
  - basic plan locks advanced scenes.
  - expired user can view history but cannot generate.
  - mock generation creates a record and sensitive-word check renders.
  - admin can access `/cyrus`, users, applications, and generations.

## Later Integration Tasks

These are intentionally deferred until credentials are available:

- Connect Supabase tables and auth/session persistence.
- Replace mock store with Supabase repository implementation.
- Configure Qwen API key and verify real model generation.
- Add deployment configuration for `agent.81366776.xyz`.
