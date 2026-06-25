# 第二阶段验收说明：Agent 版本确认、路由冲突与 D1 归属复核

生成时间：2026-06-26  
项目路径：`/Users/lvminglei/Desktop/codexuse/health-store-agent`  
执行范围：只读复核、Git 冻结、文档输出  
未执行：未创建 Worker、未创建 D1、未迁移数据、未切换域名、未覆盖线上版本、未删除烟测数据、未开放 45 家门店、未安排 8 家真实填报、未修改 `81366776.xyz`

## 1. 第六阶段代码冻结

已完成第六阶段代码冻结：

```text
commit: db350e6a981e6c129b0878322b1136e356081ca1
tag: stage6-production-pilot-freeze-20260626
message: chore: freeze stage 6 production pilot
branch: stage5-deepseek-reports
```

冻结前确认：

- 未提交 `.env.local`
- 未提交 Cloudflare Token
- 未提交 DeepSeek API Key
- 未提交明文密码
- 未提交本地缓存、备份、构建目录、临时导出文件
- 未推送远程仓库

当前线上生产 Worker 仍是第一阶段盘点确认的混合状态，本阶段未覆盖部署。

## 2. Agent 最终目标版本 commit

Agent 最终目标版本建议恢复到：

```text
15357dd Switch store profiles to text input
```

对应远程分支：

```text
origin/main
```

理由：

- 它是 Survey 阶段接入前的 Agent 最终业务状态。
- 包含 7 个生成入口、抖音/快手短视频文案、免费试用、登录、每日次数限制、生成记录、删除/一键删除、用户后台、Agent 管理后台、客户资料文本录入和 AI 摘要。
- `/cyrus` 在该版本中是 Agent 管理后台，不是 Survey 总后台。
- `/demo` 在该版本中不存在，说明 Demo 已经被历史提交移除，不应默认恢复。

详细报告：

```text
docs/2026-06-26-agent-target-version-analysis.md
```

## 3. Agent 功能矩阵摘要

| 功能 | 当前线上 | 当前代码 | `origin/main` | 目标状态 |
| --- | --- | --- | --- | --- |
| 小红书 | 存在 | 存在 | 存在 | 保留 |
| 朋友圈 | 存在 | 存在 | 存在 | 保留 |
| 公众号 | 存在 | 存在 | 存在 | 保留 |
| 美团/点评 | 存在 | 存在 | 存在 | 保留 |
| 好评回复 | 存在 | 存在 | 存在 | 保留 |
| 私域成交 | 存在 | 存在 | 存在 | 保留 |
| 抖音/快手短视频 | 首页可见 | 存在 | 存在 | 保留 |
| 免费试用 | 首页可见 | 存在 | 存在 | 保留 |
| 登录入口 | 可访问 | 存在 | 存在 | 保留 |
| 每日次数限制 | 需登录验证 | 存在 | 存在 | 保留 |
| 生成记录 | 需登录验证 | 存在 | 存在 | 保留 |
| 生成记录删除/一键删除 | 需登录验证 | 存在 | 存在 | 保留 |
| 客户资料文本录入 | 需登录验证 | 存在 | 存在 | 保留 |
| Agent 管理后台 | `/cyrus` 被 Survey 占用 | 子路由残留，根入口冲突 | 存在 | 必须隔离恢复 |
| `/demo` | 404 | 不存在 | 不存在 | 默认不恢复 |

## 4. `/demo` 结论

`/demo` 不建议恢复。

依据：

- Git 历史中 `99672be` 曾新增 Demo。
- 后续 `521db98` 已删除 Demo。
- 目标基线 `15357dd` 不包含 Demo。
- 当前线上 404 与目标基线一致。

如业务需要重新开放 Demo，应后续单独立项，并建议使用可逆开关。

## 5. Agent 后台路径结论

Agent 原后台在目标版本中是 `/cyrus`。

当前问题：

- `agent.81366776.xyz/cyrus` 显示 Survey 总后台。
- `survey.81366776.xyz/cyrus` 也显示 Survey 总后台。
- 同一仓库同一个 `src/app/cyrus/page.tsx` 不能同时承载两个系统的后台首页。

推荐后续路径策略：

- 如果继续同仓库同 app 目录：Agent 后台迁至 `/agent-admin`，Survey 总后台暂保留 `/cyrus`。
- 如果拆成双 app 或独立构建产物：两个 Worker 可各自拥有自己的 `/cyrus`，但构建产物必须彻底分离。

本阶段只输出结论，未改路由。

## 6. Agent 与 Survey 路由冲突

严重冲突：

- `/cyrus`：Agent 管理后台与 Survey 总后台直接争用。

跨域暴露：

- Agent 域名可访问 Survey 路由：`/survey`、`/yingyun`、`/yingyun/*`、Survey API、Survey 导出。
- Survey 域名可访问 Agent 路由：`/login`、`/app`、`/lvminglei`、`/tutorial`。

共享问题：

- 全站 `src/app/layout.tsx` metadata 仍为 Agent 标题。
- Survey 后台页面标题仍显示“本地健康门店 AI 获客文案助手”。
- Agent 和 Survey 都使用同一个 D1 binding 名：`DB`。
- 当前没有 `APP_MODE=agent` 或 `APP_MODE=survey`。

详细报告：

```text
docs/2026-06-26-agent-survey-route-isolation-design.md
```

## 7. 推荐隔离架构

建议保留同一仓库，但分成四套部署配置：

```text
agent-prod        -> agent.81366776.xyz        -> Agent 独立正式 D1
agent-preview     -> Agent 预览 Worker          -> Agent 独立预览 D1
survey-prod       -> survey.81366776.xyz       -> Survey 独立正式 D1
survey-preview    -> Survey 预览 Worker         -> Survey 独立预览 D1
```

新增应用模式：

```text
APP_MODE=agent
APP_MODE=survey
```

最低要求：

- Agent Worker 拒绝 Survey 路由。
- Survey Worker 拒绝 Agent 路由。
- Agent 和 Survey 分别拥有独立 metadata。
- Agent 和 Survey 分别绑定独立 D1。
- `/cyrus` 冲突必须通过路径调整或独立构建解决。

如果环境变量无法让 Next.js 静态路由真正隔离，应升级为独立 route group、独立入口、双 app 目录或 monorepo 子应用。

## 8. D1 逐表归属

当前正式库：

```text
health-store-agent-db
```

当前状态：

- Agent 和 Survey 共享正式 D1。
- Agent 业务表 6 张。
- Survey 业务表 31 张。
- 系统表包括 `d1_migrations`、`sqlite_sequence`、`_cf_KV`。

关键结论：

- Agent 表：`applications`、`generations`、`profiles`、`store_profiles`、`workbench_accounts`、`workbench_generations`。
- Survey 表：全部 `survey_*`。
- 未发现两个系统共享账号、会话或日志表。
- 未发现跨系统外键。
- 未发现触发器。
- 显式业务索引均在 Survey 自己的表内。
- `d1_migrations` 只适合作为 Survey 迁移历史参考，拆库后 Agent 与 Survey 应各自维护迁移历史。

详细报告：

```text
docs/2026-06-26-d1-table-ownership-map.md
```

## 9. 烟测数据处理建议

当前正式 Survey 数据中存在上线烟测数据：

- 商户提交 1 条
- 同城参考 2 条
- POS 5 条
- POS 明细 5 条
- 指标 5 条
- 指标快照 5 条
- 预警 12 条
- 跟进 1 条
- 跟进明细 1 条
- 报告 1 条
- 报告版本 1 条
- 报告快照 1 条
- AI 任务 1 条
- 审计日志 14 条

推荐方案：迁移时排除烟测业务数据。

理由：

- 数据中存在明确“上线烟测”备注、主题和对标商场名称。
- 创建时间集中在第六阶段正式域名验证窗口。
- 数据由验证流程产生，不应污染 8 店试运行正式统计。

本阶段未删除、未修改任何烟测数据。

详细报告：

```text
docs/2026-06-26-survey-smoke-data-treatment-plan.md
```

## 10. 后续需要创建的 Worker 和 D1

后续第三阶段建议创建或确认：

Worker：

```text
health-agent-prod
health-agent-preview
mall-survey-prod
mall-survey-preview
```

D1：

```text
health-agent-db
health-agent-preview-db
mall-survey-db
mall-survey-preview-db
```

最终命名可在第三阶段开工前由用户确认。

## 11. 下一阶段具体动作建议

第三阶段建议顺序：

1. 补齐 Cloudflare 最小只读权限，确认 DNS、Worker Route 和 Custom Domain 真实映射。
2. 创建 Agent 预览 Worker 和 Agent 预览 D1。
3. 从 `15357dd` 恢复 Agent 目标功能到隔离分支或隔离构建配置。
4. 创建 Survey 预览 Worker 和 Survey 预览 D1。
5. 将 Survey 基础资料导入独立预览 D1，不导入烟测业务数据。
6. 实施 `APP_MODE` 或独立构建路由隔离。
7. 预览环境分别验证 Agent 和 Survey。
8. 准备正式切换备份和回滚方案。
9. 用户确认后再切换 `agent.81366776.xyz` 和 `survey.81366776.xyz`。

## 12. Cloudflare 权限准备

本阶段没有修改 Token，也没有输出 Token。

后续只读复核建议补充最小权限：

```text
Zone -> DNS -> Read
Zone -> Workers Routes -> Read
Account -> Workers Scripts -> Read
Account -> D1 -> Read
```

正式切换前如需写权限，再单独申请：

```text
Zone -> DNS -> Edit
Zone -> Workers Routes -> Edit
Account -> Workers Scripts -> Edit
Account -> D1 -> Edit
```

不建议使用 Global API Key。

## 13. 回滚与风险说明

当前没有执行线上变更，因此无需回滚。

后续风险：

- 直接部署 Agent 会覆盖 Survey，因为当前仍共用 `health-store-agent` Worker。
- 直接部署 Survey 会继续覆盖 Agent。
- 直接迁移混合 D1 会把烟测数据和两套系统账号一起带入新库。
- 不处理 `/cyrus` 会继续出现后台串站。
- 不处理 metadata 会继续出现 Survey 后台标题为 Agent 的问题。

后续正式切换前必须具备：

- 旧 Worker 版本 ID
- 旧 D1 完整导出
- 新 Worker 预览验收结果
- 新 D1 表数和记录数核对
- 回滚命令和 DNS/域名恢复方案

## 14. 验收结论

第二阶段通过。

已完成：

- 第六阶段代码冻结与标签创建。
- Agent 目标版本确认。
- Agent 功能矩阵输出。
- `/demo` 和 `/cyrus` 结论输出。
- Agent 与 Survey 路由冲突梳理。
- 推荐隔离架构输出。
- D1 逐表归属复核。
- 上线烟测数据识别和处理建议。
- 后续 Worker、D1 和权限准备建议。

可以进入第三阶段，但必须在用户确认后再执行。

