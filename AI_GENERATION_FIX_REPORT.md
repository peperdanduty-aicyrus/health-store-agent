# AI 生成问题第一阶段安全修复报告

## 1. 本次修复时间

- 2026-06-30 00:21 CST（Asia/Shanghai）
- 本次按“安全自动修复模式”执行，仅完成本地代码、测试、构建和报告。

## 2. 当前分支和 commit

- 修复前分支：`feature/agent-survey-isolation`
- 修复分支：`fix/agent-ai-output-safety`
- 当前 HEAD：`bc64336521eeac73a2d9ba7dc3e5f955fc9183ce`
- 当前工作区原本存在大量未提交的 survey/yingyun/运营系统改动，本次没有 stash、reset、checkout 或回退这些改动，也没有创建提交。

## 3. 本次修复范围

仅修复 `agent.81366776.xyz` 对外售卖 AI 文案工具的第一阶段输出安全：

- 七个付费生成场景的运行时结构校验。
- 代码、HTML、Markdown 代码块、错误对象、错误堆栈、接口错误、系统提示词泄露检测。
- provider 超时、空白响应、截断响应和错误分类。
- 统一 generation service，隔离 raw response 与前台结果。
- Server Action 安全失败处理和失败记录。
- 客户即时结果、复制、历史记录的 cleaned content 展示。
- `/agent-admin` 生成记录的 success / failed / legacy 分层。
- generations 新诊断字段的 additive migration 文件和旧数据兼容读取。

## 4. 修改了哪些文件

- `src/app/actions.ts`：生成主流程改用安全 generation service；失败返回安全中文提示；失败记录不计入当日次数。
- `src/app/app/page.tsx`：当日次数排除 failed 记录。
- `src/app/agent-admin/generations/[id]/page.tsx`：cleaned、raw、error、prompt 分区展示。
- `src/components/customer/GenerationForm.tsx`：把当前 scene 传给结构化结果组件。
- `src/components/customer/StructuredGenerationResult.tsx`：取消 raw fallback；只展示和复制校验后的内容。
- `src/components/customer/HistoryList.tsx`：不再直接展示 `record.result`；优先 cleaned content。
- `src/components/admin/GenerationManagement.tsx`：列表显示成功、失败、旧记录状态。
- `src/components/admin/AdminDashboard.tsx`：统计次数排除 failed 记录。
- `src/lib/ai/provider.ts`：provider 结果增加 finish reason、usage、耗时元数据。
- `src/lib/ai/providers/openai-compatible.ts`：增加超时、错误分类、空白和截断检查。
- `src/lib/ai/providers/mock.ts`：移除不属于场景 Schema 的额外字段。
- `src/lib/data/types.ts`、`store.ts`、`store-d1.ts`：支持新诊断字段和 legacy 默认值。
- `src/lib/prompts/scenes.ts`：明确禁止代码、HTML、代码块、错误内容和提示词泄露。
- 相关测试文件：更新 provider/prompt 断言并增加异常输出覆盖。

## 5. 新增了哪些文件

- `src/lib/ai/scene-schemas.ts`
- `src/lib/ai/output-safety.ts`
- `src/lib/ai/generation-service.ts`
- `src/lib/ai/generation-presentation.ts`
- `src/lib/ai/generation-record.ts`
- `src/lib/data/generation-diagnostics.ts`
- `src/lib/ai/output-safety.test.ts`
- `src/lib/ai/generation-service.test.ts`
- `src/lib/ai/generation-presentation.test.ts`
- `src/lib/ai/generation-record.test.ts`
- `src/lib/ai/providers/openai-compatible.test.ts`
- `src/lib/data/generation-safety.test.ts`
- `src/lib/data/generation-migration.test.ts`

## 6. 新增了哪些 migration 文件

- `migrations-agent/0002_agent_generation_safety.sql`

该文件只对 `generations` 执行 `ADD COLUMN`，新增：

- `status`
- `raw_response`
- `cleaned_content`
- `error_code`
- `error_message`
- `request_id`
- `finish_reason`
- `token_usage`
- `elapsed_ms`
- `prompt_version`

没有删除、更新、覆盖或重命名旧字段。本次没有执行该 migration。

## 7. 修复前的问题

- provider 原样返回模型 content，不检查空白、截断、finish reason 或异常对象。
- Server Action 只做敏感词替换，HTTP 200 中的代码或错误内容仍会当 success 保存。
- 即时结果 JSON 解析失败时直接显示并复制 raw content。
- 客户历史和后台详情直接展示 `record.result`。
- generations 无状态、错误、raw 和 cleaned 分层。
- provider 异常缺少受控中文提示。

## 8. 修复后的效果

- 每个付费 scene 只接受明确允许的字段和嵌套结构；未知字段或缺字段直接失败。
- Markdown 代码块、HTML、程序代码、错误堆栈、API 错误、系统提示词泄露和错误对象不能进入 success。
- 空白输出和 finish reason 为 length/max_tokens 的输出不能进入 success。
- 新成功记录同时保留 raw response 和 cleaned content，但客户侧只接收 cleaned content。
- 新失败记录保存 failed 状态和安全错误摘要，`result` 与 `cleaned_content` 为空。
- failed 记录不计入客户当日生成次数和后台今日生成总次数。

## 9. 前台现在如何处理异常 AI 输出

- Server Action 只返回 cleaned content 或安全中文失败提示。
- `StructuredGenerationResult` 会按 scene 再校验一次；校验失败只显示“生成内容格式异常，请重新生成”。
- 已取消 raw fallback，不再把解析失败内容放入 `<pre>`。
- 复制全文、复制分组和复制单条均来自校验后的结构化内容。
- 客户历史不会直接读取 raw response，也不会直接展示异常 `result`。

## 10. 后台现在如何区分 success / failed / legacy / raw / cleaned

- 列表显示状态：成功、失败、旧记录。
- 详情页普通区域只显示最终安全内容。
- `raw_response` 只放在管理员详情的默认折叠区。
- `error_message` 和 `error_code` 只在失败记录的错误区显示。
- prompt 放在管理员详情的默认折叠区。
- 请求 ID、finish reason、耗时和 prompt version 单独显示。

## 11. 旧数据如何兼容

- 数据库旧行没有 `status` 时，在读取层规范为 `legacy`。
- legacy 记录优先读取 `cleaned_content`；没有时才读取旧 `result`，并重新执行当前 scene 安全校验。
- 旧 `result` 合法时继续展示；包含代码、错误对象、HTML 或格式异常时隐藏原文并显示旧记录异常提示。
- 不修改、不覆盖、不回填现有旧记录。

## 12. 本次没有修什么

- 没有修密码哈希。
- 没有修 session 签名。
- 没有修 HTTPS 强制跳转。
- 没有修默认管理员账号。
- 没有修 D1 fail-open。
- 没有修 survey/yingyun。
- 没有修商场运营系统。
- 没有修 `/lvminglei` 私用工作台页面或业务逻辑。
- 没有修改旧 `/cyrus` 页面；当前分支的 agent 后台目标入口是 `/agent-admin`。
- 没有执行远程数据库 migration。
- 没有执行本地或远程 D1 migration。
- 没有写入生产数据库。
- 没有部署上线。
- 没有修改 Cloudflare Secret。
- 没有做复杂并发扣次、dailyLimit 统一或北京时间规则重构。

临时 Cloudflare Token 仅在受控进程中完成无输出身份验证，未保存并已随进程退出清除。原计划的只读 D1 SQL 导出在执行前取消，因为当前 D1 同时包含密码字段，原样导出会违反“密码不得进入备份”的要求；因此本次没有创建数据库备份文件，也没有执行 D1 命令。

## 13. 测试和构建结果

- `pnpm test`：通过。31 个测试文件、169 个测试全部通过。
- `pnpm lint`：通过，0 个 lint 错误。
- `pnpm build`：通过，Next.js 生产构建和类型检查成功。
- `pnpm exec opennextjs-cloudflare build`：通过，已生成本地 `.open-next/worker.js`。
- 附加检查：`tsc --noEmit --incremental false` 通过。

运行环境说明：pnpm 的供应链保护默认会因依赖构建脚本未获批准而中止自动依赖检查。本次没有执行 `pnpm approve-builds`，而是使用 `PNPM_CONFIG_IGNORE_SCRIPTS=true` 运行四条命令。OpenNext 内部固定调用 `npm run build`，本机没有 npm；成功复测时使用了一次性临时 npm shim，仅转发到项目本地 `next build`，完成后已删除。

专项测试覆盖：Markdown 代码块、HTML、JSON 错误对象、错误堆栈、未知字段、空内容、截断内容、系统提示词泄露、程序代码、前台禁止 raw fallback、复制仅 cleaned、历史 cleaned 优先、success/failed/legacy、provider 空白/截断/限流/超时、迁移只含 ADD COLUMN，以及全部七个付费 scene 的 mock 输出。

## 14. 是否可以进入预览环境测试

可以进入“独立预览环境准备”，但当前不能直接把本地代码部署到仍是旧 generations schema 的环境。

进入预览前必须：

1. 确认 agent 独立预览 Worker 和预览 D1，不指向生产 D1。
2. 对预览 D1 执行 `0002_agent_generation_safety.sql`。
3. 部署到预览 Worker，验证登录、套餐、到期、次数、七个生成场景、客户历史和 `/agent-admin`。
4. 生产发布前设计不含明文密码的安全备份方案，或使用受控加密备份。

本次没有执行上述预览 migration 或部署。

## 15. 下一步建议

建议下一步继续使用：**超高**。

原因：下一步会涉及独立预览 D1 migration、真实 provider 异常测试、预览账号回归、生产数据保护和发布基线确认。应继续分阶段处理，先预览验收，再单独确认生产 migration 和部署；不要把密码/session/HTTPS/D1 fail-open 安全改造混入本次发布。
