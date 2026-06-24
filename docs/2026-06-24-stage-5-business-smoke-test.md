# 第五阶段最终人工业务流程验收

验收日期：2026-06-24
本地环境：`http://127.0.0.1:3000`
本地D1：`.wrangler/state/v3/d1/survey-dev.sqlite`
备份文件：`/Users/lvminglei/Desktop/codexuse/backups/stage5-final-smoke-20260624-153201/survey-dev-before-stage5-final-clean.sqlite`

## 1. AI Provider 与模型

本次真实DeepSeek调用已通过页面触发，实际记录如下：

- Provider：`deepseek`
- Model：`deepseek-v4-flash`
- 任务：`leadership_brief`
- 状态：`failed`
- 结果：DeepSeek返回内容未通过本系统JSON Schema校验，D1记录错误码 `schema_invalid`
- 耗时：`12032ms`
- Token：`prompt_tokens=10437`，`completion_tokens=1369`，`total_tokens=11806`

最终保留的四类验收样例使用页面上的Mock Provider生成：

- Provider：`mock`
- Model：`mock-survey-report`
- 用途：在真实DeepSeek结构不合格时，验证页面、版本、导出、权限、持久化和降级闭环

结论：真实DeepSeek已实际调用并落库，但本次最终可验收样例使用Mock Provider。

## 2. 四类报告页面生成结果

通过 `/yingyun/reports` 页面实际生成并确认四类报告：

| 报告类型 | report_id | 状态 | provider/model |
| --- | --- | --- | --- |
| 领导简报 | `survey_report_3e27ef3d-daa7-4ea9-a1fb-fd9fe3b87767` | `confirmed` | `mock/mock-survey-report` |
| 完整经营分析 | `survey_report_0217cf43-fdb6-4f1f-8c40-f410331ec3ee` | `confirmed` | `mock/mock-survey-report` |
| 口头汇报稿 | `survey_report_7c281fc7-aff2-4936-8321-b8574e76417f` | `confirmed` | `mock/mock-survey-report` |
| 单店重点问题卡 | `survey_report_102eb163-dab7-4c01-b713-902a9e8d635c` | `confirmed` | `mock/mock-survey-report` |

页面刷新后，报告列表、报告详情、版本历史和确认状态仍存在，数据来自D1。

## 3. 人工编辑与版本管理

验证对象：领导简报。

- V1：AI原始版本，`ai_original`
- V2：人工编辑版本，`manual_edit`
- 人工修改内容：标题改为 `2026-05 领导简报-人工审核版`，一句话结论追加“已人工复核”，下月重点追加一条人工复盘事项
- 已通过页面执行：保存人工版本、查看版本历史、将V1标记为当前、再将V2标记为当前、将V2标记为确认版本
- 最终状态：V2显示 `当前 · 已确认`

## 4. DOCX、CSV、TXT 与打印版样例

页面实际下载后集中复制到：

`/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-final-evidence`

DOCX文件：

- `/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-final-evidence/2026-05-leadership_brief-2026-06-24 (1).docx`
- `/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-final-evidence/2026-05-full_analysis-2026-06-24.docx`
- `/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-final-evidence/2026-05-oral_briefing-2026-06-24.docx`
- `/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-final-evidence/2026-05-store_analysis-2026-06-24.docx`

打印版HTML样例：

- `/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-final-evidence/2026-05-leadership_brief-print-2026-06-24.html`
- `/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-final-evidence/2026-05-full_analysis-print-2026-06-24.html`

检查结果：

- 4个DOCX均可正常解包
- 4个CSV均带UTF-8 BOM：`efbbbf`
- 文件名均包含月份和日期
- TXT导出可下载
- 导出动作有D1审计日志

## 5. 清理与最终D1数量

验收前已清理重复脚本样例，只保留一套最终样例。最终D1数量：

| 表 | 数量 |
| --- | ---: |
| `survey_reports` | 4 |
| `survey_report_versions` | 5 |
| `survey_ai_report_jobs` | 6 |
| `survey_report_snapshots` | 4 |

AI任务保留情况：

- 4条Mock成功任务，对应四类确认报告
- 1条真实DeepSeek失败任务，用于记录实际provider/model和失败原因
- 1条Mock失败任务，用于验证页面失败与重试闭环

## 6. 数字一致性抽查

抽查领导简报确认版本与第四阶段D1确定性数据：

| 指标 | D1值 | 报告值 | 结果 |
| --- | ---: | --- | --- |
| 整体销售 | `82.0万` | `82万元` | 一致 |
| 目标完成率 | `1.0761` | `107.6%` | 一致 |
| 预警数量 | `11` | `当前预警11项` | 一致 |
| 重点门店数量 | `5` | `需关注5家重点门店` | 一致 |
| NIKE KIDS有效销售 | `16.5万` | `16.5万元` | 一致 |
| NIKE KIDS目标完成率 | `1.1` | `110%` | 一致 |

DeepSeek或Mock均未重新计算业务指标，报告内容引用第四阶段快照。

## 7. 权限验证

| 场景 | 结果 |
| --- | --- |
| 未登录访问 `/yingyun/reports` | 返回登录页，HTTP 200 |
| 未登录访问DOCX导出 | HTTP 401 |
| 过期营运账号访问历史页面 | 页面可访问 |
| 过期营运账号访问DOCX导出 | HTTP 401 |
| 非营运角色访问 `/yingyun/reports` | 返回营运登录页 |
| 非营运角色访问DOCX导出 | HTTP 401 |

本地验收账号 `precheck_ops` 已恢复为有效营运账号：`operator / enabled=1 / expires_at=2027-05-31`。

## 8. AI失败与重试

已通过页面验证两类失败：

- 真实DeepSeek失败：`leadership_brief`，返回JSON不符合Schema，任务落库为 `failed / deepseek:deepseek-v4-flash / schema_invalid`
- Mock失败模拟：`store_analysis`，页面选择“模拟AI失败”，任务落库为 `failed / mock:mock-survey-report / mock_failure`

已通过页面点击“用Mock重试”，成功生成单店重点问题卡，最终报告状态为 `confirmed`。

## 9. 发现的问题与修复结果

问题1：失败任务的“用Mock重试”会回到默认真实AI路径。
修复：`retrySurveyAiReport` 改为强制使用 `createMockReportProvider("success")`，避免误触真实AI。

问题2：Mock生成器读取内部字段时只按下划线字段名读取，导致报告数字显示“暂无数据”。
修复：增加驼峰/下划线兼容读取，Mock内容现在直接引用快照中的 `salesWan`、`targetCompletionRate`、`effectiveSalesWan` 等确定性结果。

问题3：单店卡默认取首店，首店可能没有有效指标。
修复：Mock单店卡优先选择有预警且有有效销售额的门店，本次样例选择 `NIKE KIDS`。

问题4：未确认报告导出返回404。
处理：这是权限与流程规则，导出只允许确认版本；已通过页面将四类报告确认后重新下载成功。

## 10. 操作日志

报告相关审计日志已写入D1，主要动作包括：

- `report.create`
- `report.version.create`
- `report.current.set`
- `report.confirm`
- `report.export.docx`
- `report.export.data_csv`
- `report.export.txt`
- `report.export.print_html`
- `report.cleanup.final_smoke`

另有本地验收账号密码重置日志：`staff.password.reset.local_smoke`。

## 11. 旧系统回归

本地路由回归结果：

| 路由 | HTTP结果 |
| --- | --- |
| `/` | 200 |
| `/login` | 200 |
| `/app` | 307，未登录跳转，符合预期 |
| `/survey` | 200 |
| `/yingyun` | 200 |
| `/yingyun/reports` | 200 |
| `/cyrus` | 200 |

旧健康门店系统未被破坏。

## 12. 测试与构建

- `vitest run`：16个测试文件通过，98项测试通过
- `next build`：通过，36个页面生成完成

## 13. 最终结论

第五阶段最终人工业务流程验收：通过。

是否可以进入第六阶段：技术上可以进入，但本次按命令停止，不进入第六阶段，不部署生产环境。
