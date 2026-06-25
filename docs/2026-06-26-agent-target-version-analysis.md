# Agent 最终版本确认报告

生成时间：2026-06-26  
执行阶段：第二阶段，只读确认与归属复核  
项目路径：`/Users/lvminglei/Desktop/codexuse/health-store-agent`

## 1. 结论

Agent 最终目标版本建议以以下 Git commit 为恢复基线：

```text
15357dd Switch store profiles to text input
```

该 commit 当前位于：

```text
origin/main
```

原因：

- 它是商场 Survey 阶段大规模接入前的 Agent 业务最终状态。
- 它包含 7 个内容生成入口、短视频文案、免费试用、登录、每日次数限制、生成记录、生成记录删除、一键删除、用户后台、Agent 管理后台、客户资料文本录入和 AI 摘要整理。
- 它已经完成客户资料流程从 PDF 上传向文本录入的简化，符合后续记忆中“不要再走 PDF”的稳定产品决策。
- 它没有把 `/cyrus` 覆盖成 Survey 总后台。

当前线上 `agent.81366776.xyz` 不是完整丢失 Agent，而是被第六阶段商场系统部署产物混合覆盖：

- `/`、`/login`、`/app` 仍表现为 Agent。
- `/demo` 返回 404。
- `/cyrus` 被 Survey 总后台占用。
- `agent.81366776.xyz` 和 `survey.81366776.xyz` 共享同一个 Worker：`health-store-agent`。
- Agent 和 Survey 共享同一个正式 D1：`health-store-agent-db`。

## 2. 对比来源

| 来源 | 结论 |
| --- | --- |
| 当前线上 `https://agent.81366776.xyz` | 首页和登录页为 Agent，`/app` 未登录跳转登录页，`/demo` 404，`/cyrus` 错误显示 Survey 总后台 |
| 当前工作区代码 | HEAD 为 `db350e6`，已冻结第六阶段生产试运行代码；同一套 Next.js 混合承载 Agent 与 Survey |
| 当前 Git HEAD | `db350e6 chore: freeze stage 6 production pilot` |
| `origin/main` | `15357dd Switch store profiles to text input`，建议作为 Agent 目标恢复基线 |
| 第五阶段冻结 | `4d437dc chore: freeze stage 5 final before stage 6`，包含 Survey 第五阶段功能，不适合作为 Agent 恢复基线 |
| 第六阶段部署前版本 | Cloudflare 上一版本 ID 为 `7217e511-6046-4aa8-a13b-3566c6eb5c83`，仍属于混合 Worker 历史版本，不等同于纯 Agent 目标版本 |
| Git 历史功能提交 | Agent 关键功能已在 `15357dd` 前合并，`/demo` 曾新增后又被移除 |

## 3. 功能矩阵

| 功能 | 当前线上 | 当前代码 `db350e6` | `origin/main` `15357dd` | stage5 冻结 `4d437dc` | 目标状态 |
| --- | --- | --- | --- | --- | --- |
| 小红书文案 | 存在 | 存在 | 存在 | 存在 | 保留 |
| 朋友圈文案 | 存在 | 存在 | 存在 | 存在 | 保留 |
| 公众号文案 | 存在 | 存在 | 存在 | 存在 | 保留 |
| 美团/点评团单文案 | 存在 | 存在 | 存在 | 存在 | 保留 |
| 点评好评话术 | 存在 | 存在 | 存在 | 存在 | 保留 |
| 私域成交话术 | 存在 | 存在 | 存在 | 存在 | 保留 |
| 抖音/快手短视频文案 | 首页可见，生成入口需登录 | `src/lib/domain/scenes.ts` 存在 `douyin_kuaishou` | 存在 | 存在 | 保留 |
| 免费试用入口 | 首页可见 | 存在 | 存在 | 存在 | 保留 |
| 登录入口 | 可访问 `/login` | 存在 | 存在 | 存在 | 保留 |
| 每日次数限制 | 线上需登录后验证；代码存在 | `src/lib/domain/permissions.ts` 存在 dailyLimit 逻辑 | 存在 | 存在 | 保留 |
| 套餐和到期逻辑 | 线上需登录后验证；代码存在 | `profiles` 表和权限逻辑存在 | 存在 | 存在 | 保留 |
| 生成记录 | 线上需登录后验证；代码存在 | `/app/history` 和 `generations` 表存在 | 存在 | 存在 | 保留 |
| 生成记录删除 | 线上需登录后验证；代码存在 | `deleteGeneration` 存在 | 存在 | 存在 | 保留 |
| 生成记录一键删除 | 线上需登录后验证；代码存在 | `deleteAllGenerations` 存在 | 存在 | 存在 | 保留 |
| 复制按钮 | 线上需登录后验证；代码存在 | 生成记录复制状态和 UI 存在 | 存在 | 存在 | 保留 |
| 用户后台 `/app` | 未登录跳 `/login` | 存在 | 存在 | 存在 | 保留 |
| Agent 管理后台 `/cyrus` | 错误显示 Survey 总后台 | 当前 `src/app/cyrus/page.tsx` 是 Survey 总后台 | `src/app/cyrus/page.tsx` 是 Agent 管理后台 | 被 Survey 覆盖 | 必须恢复或改路径 |
| 管理后台账号管理 | 被 `/cyrus` 占用影响 | Agent 子路由组件仍存在，但入口冲突 | 存在 | 子路由存在，入口冲突 | 保留并隔离 |
| 管理后台线索管理 | 被 `/cyrus` 占用影响 | `/cyrus/applications` 组件仍存在 | 存在 | 存在 | 保留并隔离 |
| 管理后台生成记录 | 被 `/cyrus` 占用影响 | `/cyrus/generations` 组件仍存在 | 存在 | 存在 | 保留并隔离 |
| 客户资料录入 | 线上需登录后验证；代码存在 | `/app/store-profile` 和 `/cyrus/store-profiles` 存在 | 存在 | 存在 | 保留 |
| PDF 资料上传 | 不应作为目标流程 | 旧字段仍保留兼容，目标流程为文本 | `15357dd` 已改为文本录入 | 存在文本流程 | 不恢复 PDF 主流程 |
| 敏感词自动替换 | 代码存在 | `src/lib/safety/sensitive-words.ts` 存在 | 存在 | 存在 | 保留 |
| 私有工作台 `/lvminglei` | 当前 Worker 中存在 | 存在 | 存在于后续历史 | 存在 | 按 Agent 侧保留并加域名隔离 |
| 公开测试页 `/lvminglei-test` | 默认隐藏 | `WORKBENCH_PUBLIC_TEST_ENABLED=false` | 历史中已做可逆隐藏 | 存在 | 保持隐藏 |
| `/demo` 公开 Demo | 线上 404 | 当前代码不存在 | `origin/main` 不存在 | 不存在 | 默认不恢复 |

## 4. `/demo` 结论

`/demo` 不应作为本次 Agent 恢复的默认目标。

依据：

- Git 历史显示 `99672be feat: add public demo entry` 曾新增 `/demo`。
- 随后 `521db98 chore: remove public demo entry` 删除 `/demo`。
- 目标基线 `15357dd` 不含 `/demo`。
- 当前线上 `/demo` 404 与 `origin/main` 最终状态一致。

如后续业务上需要重新开放 Demo，应作为单独需求评估，建议用可逆开关控制，而不是在本阶段恢复。

## 5. `/cyrus` 结论

在 Agent 的目标版本中，`/cyrus` 原本应是 Agent 管理后台：

- `origin/main:src/app/cyrus/page.tsx` 引用 `AdminDashboard`、`AdminShell`、`LoginForm`、`getCurrentProfile`、`getDataStore`。
- 登录提示为“管理员后台”。
- 管理功能包括账号、线索、生成记录、客户资料、设置。

当前 HEAD 中，`src/app/cyrus/page.tsx` 已经被 Survey 总后台替换：

- 引用 `SurveyLoginForm`、`SurveyShell`、`SurveyStoreImportForm`。
- 登录提示为“商场店铺调研系统总后台”。
- 管理功能包括营运账号、业态、门店、导入、审计日志。

建议后续隔离时采用以下策略：

1. Agent 独立 Worker 恢复 Agent 后台能力。
2. Survey 独立 Worker 保留 Survey 总后台能力。
3. 若继续同仓库同 app 目录，不能让两个系统同时争用 `src/app/cyrus/page.tsx`。
4. 最小风险路径：为 Agent 后台迁移到 `/agent-admin`，并将 Agent 旧链接统一更新；Survey 可继续使用 `/cyrus` 或后续迁到 `/survey-admin`。
5. 若选择双 app 或独立构建，则两个 Worker 可各自拥有自己的 `/cyrus`，但构建产物必须分离。

## 6. 丢失与占用判断

真正缺失：

- `/demo`：但它不是 `15357dd` 目标版本的一部分，属于已被历史提交移除的入口。

路由被 Survey 占用：

- `/cyrus`：Agent 管理后台入口被 Survey 总后台覆盖。

仍存在但需要登录后验证：

- `/app` 用户后台
- `/app/history` 生成记录
- `/app/generate/[scene]` 七类生成入口
- `/app/store-profile` 客户资料文本录入

代码仍存在但受入口冲突影响：

- `/cyrus/users`
- `/cyrus/applications`
- `/cyrus/generations`
- `/cyrus/store-profiles`
- `/cyrus/settings`

这些子路由代码文件仍在当前工作区中，但 `/cyrus` 根入口和域名隔离不正确，不能视为线上 Agent 后台完整可用。

