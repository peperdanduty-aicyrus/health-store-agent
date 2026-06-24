# 第五阶段真实 DeepSeek 修复与导出视觉最终验收

验收日期：2026-06-24
项目：`/Users/lvminglei/Desktop/codexuse/health-store-agent`
结论：通过，当前停止在第五阶段，不进入第六阶段，不部署生产环境。

## 1. 本次执行边界

- 已读取并执行《2026-06-24-stage-5-business-smoke-test.md》和《CODEX第五阶段真实DeepSeek修复与导出视觉验收.md》。
- 本次只修复第五阶段真实 DeepSeek、导出和生产 Mock 隐藏问题。
- 未进入第六阶段，未执行部署。

## 2. 原始 schema_invalid 具体原因

原失败任务：

| 项 | 值 |
|---|---|
| 任务ID | `survey_ai_job_e7e2cab6-5ca1-436f-885f-b37cb2e09deb` |
| 报告类型 | `leadership_brief` |
| provider/model | `deepseek / deepseek-v4-flash` |
| 耗时 | 12032ms |
| Token | prompt 10437，completion 1369，total 11806 |
| 错误 | `schema_invalid` |

真实 DeepSeek 返回没有通过 Schema 的具体字段：

| 问题字段 | DeepSeek 返回 | 系统要求 | 处理 |
|---|---|---|---|
| 顶层汇总 | `core_metrics` | `overall_performance_summary` | 增加兼容归一化 |
| 重点门店 | `key_stores` | `focus_stores` | 增加别名映射 |
| 下月事项 | `next_month_actions` | `next_month_priorities` | 增加别名映射 |
| 亮点数组 | `{ category, detail }` | `{ title, evidence, interpretation }` | 结构修复 |
| 风险数组 | `{ category, detail }` | `{ type, scope, evidence, action }` | 结构修复 |
| STORE编号 | 数组字符串内残留 `STORE_039` | 必须还原真实门店名 | 修复数组字符串脱敏还原 |

## 3. 修复内容

- 提示词增加严格 JSON 结构样例，禁止 DeepSeek 自创字段。
- AI 输入统一改为 snake_case，降低模型输出字段漂移。
- JSON 解析支持代码块、前后解释文字和首个 JSON 对象提取。
- 增加报告类型级结构归一化，兼容真实 DeepSeek 常见字段别名。
- Schema 修复重试中带入错误路径、目标结构和原始输出。
- 修复数组内 `STORE_###` 不能还原真实门店名的问题。
- DeepSeek 默认超时时间调到 90 秒，避免完整报告生成超时。
- 生产模式隐藏 Mock 生成、模拟失败入口，并隐藏 Mock 任务记录展示；D1 审计记录仍保留。
- DOCX/PDF 导出从 JSON 平铺改为中文章节、表格和列表渲染。

## 4. 真实 DeepSeek 四类报告生成结果

| 报告类型 | 结果 | provider | model | 耗时 | Token |
|---|---|---|---|---:|---:|
| 领导简报 | 成功 | deepseek | deepseek-v4-flash | 15142ms | 12765 |
| 完整经营分析报告 | 成功 | deepseek | deepseek-v4-flash | 21519ms | 13807 |
| 3-5分钟口头汇报稿 | 成功 | deepseek | deepseek-v4-flash | 13521ms | 12349 |
| 单店重点问题分析卡 | 成功 | deepseek | deepseek-v4-flash | 13341ms | 12296 |

四类成功任务均为真实 DeepSeek，不是 Mock。四类任务本次均未触发结构修复重试，`repair_attempted=false`。历史保留 1 条真实 DeepSeek schema 失败记录和 1 条 Mock 失败记录用于审计追溯。

## 5. 版本与人工确认流程

当前确认版本：

| 报告类型 | 当前确认版本 | 来源 | 说明 |
|---|---:|---|---|
| 领导简报 | V4 | manual_edit | 真实 DeepSeek 生成后人工确认并清理数字口径 |
| 完整经营分析报告 | V3 | manual_edit | 真实 DeepSeek 生成后人工确认，并清理“目标目标完成率”和 `null` 展示 |
| 口头汇报稿 | V2 | manual_edit | 真实 DeepSeek 生成后人工确认并清理数字口径 |
| 单店重点问题分析卡 | V1 | ai_original | 真实 DeepSeek 原始版本确认 |

已验证：

- AI 原始版本存在。
- 人工编辑会新增版本，不覆盖已确认版本。
- 可标记当前版本。
- 可确认当前版本。
- 确认、切换当前版本、新增人工版本均写入审计日志。

## 6. D1 清理与当前记录

当前本地 D1 记录数量：

| 表 | 数量 |
|---|---:|
| `survey_reports` | 4 |
| `survey_report_versions` | 10 |
| `survey_ai_report_jobs` | 6 |
| `survey_report_snapshots` | 4 |
| `survey_audit_logs` | 217 |

Mock 清理结果：

- 已删除 4 份 Mock 成功正式样例。
- 已删除 Mock 成功任务。
- 只保留 4 份真实 DeepSeek 成功报告。
- 保留 1 条原始真实 DeepSeek `schema_invalid` 失败任务。
- 保留 1 条 Mock 失败任务用于失败流程审计；生产页面不展示 Mock 入口和 Mock 任务。

## 7. 数字一致性抽查

抽查基准：第四阶段 D1 确定性结果和报告当前确认版文本。DeepSeek 只解释语言，不重新计算。

| 抽查项 | D1值 | 报告值 | 结果 |
|---|---:|---:|---|
| 总销售额 | 82万元 | 82万元 | 一致 |
| 总目标完成率 | 1.0761 | 1.0761 / 107.61% | 一致 |
| 预警项数 | 11 | 11 | 一致 |
| 临界/严重门店数 | 5 | 5 | 一致 |
| 活跃门店数 | 45 | 45 | 一致 |
| POS覆盖门店数 | 5 | 5 | 一致 |
| 商户提交数 | 1 | 1 | 一致 |
| POS覆盖率 | 0.1111 | 11.11% | 一致 |
| 提交率 | 0.0222 | 2.22% | 一致 |
| 3C数码销售额 | 41.1万元 | 41.1万元 | 一致 |
| 3C数码目标完成率 | 1.096 | 1.096 | 一致 |
| 儿童鞋服销售额 | 16.5万元 | 16.5万元 | 一致 |
| 美妆护肤销售额 | 14.6万元 | 14.6万元 | 一致 |
| 儿童用品销售额 | 9.8万元 | 9.8万元 | 一致 |
| 儿童用品目标完成率 | 0.9333 | 0.9333 | 一致 |
| 华为有效销售额 | 21.2万元 | 21.2万元 | 一致 |
| 荣耀honor有效销售额 | 19.9万元 | 19.9万元 | 一致 |
| 荣耀honor目标完成率 | 1.1371 | 1.1371 | 一致 |
| 荣耀honor自报POS差异率 | -0.3166 | 31.66%差异 | 一致 |
| 荣耀honor同城对标均值 | 9.95万元 | 9.95万元 | 一致 |

另外发现 D1 中存在但报告未引用的个别自报 POS 差异率，不计为不一致。

## 8. 导出文件与视觉验收

证据目录：

`/Users/lvminglei/Downloads/CODEX第四阶段开工资料包_45店精简版/stage5-real-deepseek-evidence`

DOCX：

| 文件 | 结果 |
|---|---|
| `2026-05-leadership_brief-real-deepseek.docx` | 已从受保护导出路由下载，Word zip 结构有效 |
| `2026-05-full_analysis-real-deepseek.docx` | 已从受保护导出路由下载，Word zip 结构有效 |
| `2026-05-store_analysis-real-deepseek.docx` | 已从受保护导出路由下载，Word zip 结构有效 |

PDF：

| 文件 | 页数 | 结果 |
|---|---:|---|
| `2026-05-leadership_brief-real-deepseek.pdf` | 3 | 中文正常，表格有边框，分页正常 |
| `2026-05-full_analysis-real-deepseek.pdf` | 4 | 中文正常，表格有边框，分页正常 |

视觉问题与修复：

- 首轮发现完整报告 PDF 是 `Internal Server Error` 错误页，原因是开发服务器热更新后 `.next` 编译产物不一致；重启服务并重新导出后恢复正常。
- 首轮导出曾出现 JSON 字段平铺，已改为中文章节、表格和列表渲染。
- 完整报告中发现“目标目标完成率”和 `目标完成率null`，已新增 V3 人工修订确认版并重新导出。

WPS/Word 检查备注：

- 已调用本机 WPS 打开 DOCX，WPS 进程启动成功，但自动截图未稳定捕获文档正文。
- 已使用 macOS 文档预览生成 DOCX 页面图，中文和表格可解析。
- 建议用户用 WPS 或 Word 对上述 DOCX 路径做最终人工目检。

## 9. 权限验证

导出权限抽查结果：

| 身份 | DOCX导出结果 |
|---|---|
| 未登录 | 401 |
| 总管理员账号 | 401 |
| 过期营运账号 | 401 |
| 有效营运账号 `precheck_ops` | 200 |

生产模式 Mock 隐藏：

| 检查项 | 结果 |
|---|---|
| `Mock生成` | 不存在 |
| `模拟失败` | 不存在 |
| `mock` | 不存在 |
| `mock_failure` | 不存在 |
| `Mock DeepSeek` | 不存在 |
| DeepSeek真实生成选项 | 存在 |

## 10. 操作日志

D1 审计日志中已记录：

| action | 数量 |
|---|---:|
| `ai_report.failed` | 10 |
| `ai_report.succeeded` | 25 |
| `report.create` | 25 |
| `report.version.create` | 46 |
| `report.current.set` | 4 |
| `report.confirm` | 27 |
| `report.export.docx` | 25 |
| `report.export.print_html` | 9 |
| `report.export.data_csv` | 8 |
| `report.export.txt` | 8 |

## 11. 旧系统回归

生产模式本地服务检查结果：

| 路径 | 状态 |
|---|---:|
| `/` | 200 |
| `/login` | 200 |
| `/app` | 307 |
| `/survey` | 200 |
| `/yingyun` | 200 |
| `/yingyun/reports` | 200 |
| `/cyrus` | 200 |

旧健康门店系统入口未被破坏。

## 12. 自动化验证

测试：

- `vitest run`
- 结果：16 个测试文件通过，100 项测试通过。

构建：

- `next build`
- 结果：生产构建通过，36 个静态页生成完成。

## 13. 已发现问题和修复结果

| 问题 | 状态 |
|---|---|
| 真实 DeepSeek 输出字段漂移导致 `schema_invalid` | 已修复 |
| JSON 前后带解释文字时解析不稳 | 已修复 |
| 数组内 `STORE_###` 未还原 | 已修复 |
| 完整报告生成超时 | 已修复 |
| DOCX/PDF 输出 JSON 字段平铺 | 已修复 |
| 完整报告 PDF 曾生成错误页 | 已通过重启和重新导出修复 |
| 完整报告文案出现“目标目标完成率”和 `null` | 已新增 V3 修订确认版 |
| 生产页面可见 Mock 历史任务字样 | 已隐藏 |
| WPS 自动截图未捕获 DOCX 正文 | 已记录为人工目检备注，已用系统预览补充验证 |

## 14. 最终结论

第五阶段真实 DeepSeek 修复、四类真实 AI 报告生成、版本管理、权限控制、D1 持久化、导出和旧系统回归验收通过。

是否可以进入第六阶段：可以在用户确认 DOCX 用 WPS/Word 打开无版式问题后进入第六阶段。本次任务按要求停止，不自动进入第六阶段，不部署生产环境。
