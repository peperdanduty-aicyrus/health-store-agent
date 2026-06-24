# 第五阶段报告导出版式与口径修订验收说明

验收日期：2026-06-24
项目路径：`/Users/lvminglei/Desktop/codexuse/health-store-agent`
输出目录：`/Users/lvminglei/Desktop/11/stage5-report-export-polish`
结论：通过。本次只修订第五阶段报告导出版式、数字展示口径和正式输出文案；未进入第六阶段，未部署生产环境，未重新调用 DeepSeek。

## 1. 修订前问题

- 领导简报标题仍包含 `真实DeepSeek`、`数字口径清理版` 等开发/技术标记。
- 正文直接展示 `1.0761`、`0.1111`、`0.0222` 等数据库小数。
- 缺失数据和零销售混写，例如“销售额为零或数据缺失”。
- 存在 `critical_store_count`、`warning_count`、`self_pos_diff_rate`、W04/W05/W12 直接堆叠等技术字段感表达。
- DOCX 缺少正式标题层级、页脚页码、固定表格宽度、重复表头和禁止跨页拆行设置。
- 可打印 HTML/PDF 版式偏网页化，表格分页控制不足。

## 2. 修订内容

- 报告正式标题改为：
  - `2026年5月商场经营简报`
  - `2026年5月商场经营分析报告`
  - `2026年5月单店重点问题分析卡`
- 增加副标题：`营运内部汇报｜人工确认版`。
- 增加报告月份、确认时间和数据口径说明。
- DOCX 增加 Word 样式、页脚、页码、编号定义、固定表格布局。
- 表格表头设置跨页重复，数据行设置禁止拆分。
- DOCX 下载响应头改为 `filename*=` UTF-8 编码，支持中文文件名。
- HTML/PDF 同步改为 A4 页面、正式标题层级、浅色表头、打印分页控制。
- 生产正式导出文案清除 Mock、DeepSeek、Codex、D1、数据库字段名等技术表达。

## 3. 数字显示规则

| 类型 | 修订前 | 修订后 |
|---|---|---|
| 目标完成率 | `1.0761（107.61%）` | `107.6%` |
| POS覆盖率 | `0.1111` / `11.11%` | `11.1%` |
| 提交率/上报率 | `0.0222` / `2.22%` | `2.2%` |
| 销售额 | `82万元`、`19.9万` 混用 | `82.0万元`、`19.9万元` |
| 差异率 | `self_pos_diff_rate=-0.3166` | `自报POS差异31.7%` |
| 业态完成率 | `3C数码1.096` | `3C数码109.6%` |

## 4. 缺失值规则

- `销售额0` 且上下文为无数据、无目标、无法评估时，统一展示为 `暂无有效销售数据`。
- 缺失数据不按零销售处理。
- 未填报、未纳入 POS 数据、暂无同城对标均使用业务口径说明，不显示 `missing`、`null` 或字段名。
- 保留真实零值的表达空间，但当前样例中相关业态属于缺失/未收集数据，不作为真实零销售展示。

## 5. DOCX 版式修订结果

| 文件 | 结果 |
|---|---|
| `/Users/lvminglei/Desktop/11/stage5-report-export-polish/docx/2026年5月商场经营简报.docx` | 有效 Word 文件，正式标题、副标题、页脚、表格样式、重复表头和禁止拆行标记已写入 |
| `/Users/lvminglei/Desktop/11/stage5-report-export-polish/docx/2026年5月商场经营分析报告.docx` | 有效 Word 文件，章节层级、固定表格宽度、重复表头和禁止拆行标记已写入 |
| `/Users/lvminglei/Desktop/11/stage5-report-export-polish/docx/2026年5月单店重点问题分析卡.docx` | 有效 Word 文件，控制在单店卡片结构，先数据结论，再问题依据和行动建议 |

DOCX 结构检查：

| 文件 | styles | numbering | footer | 重复表头 | 禁止拆行 |
|---|---|---|---|---:|---:|
| 经营简报 | 通过 | 通过 | 通过 | 3 | 14 |
| 经营分析报告 | 通过 | 通过 | 通过 | 4 | 23 |
| 单店分析卡 | 通过 | 通过 | 通过 | 1 | 2 |

说明：内置 LibreOffice 渲染器因本机缺少 `/opt/homebrew/opt/little-cms2/lib/liblcms2.2.dylib` 无法完成 DOCX 全页 PNG 渲染；已用 `python-docx` 和 OOXML 结构检查确认文件可读、样式和表格控制存在。建议最终仍用 WPS/Word 打开 DOCX 做人工目检。

## 6. PDF 与打印 HTML 修订结果

| 文件 | 页数 | 检查结果 |
|---|---:|---|
| `/Users/lvminglei/Desktop/11/stage5-report-export-polish/pdf/2026年5月商场经营简报.pdf` | 2 | A4、中文正常、表格未截断、重点门店未从半行开始、无技术词 |
| `/Users/lvminglei/Desktop/11/stage5-report-export-polish/pdf/2026年5月商场经营分析报告.pdf` | 4 | A4、中文正常、表头可读、分页稳定、无技术词 |

打印 HTML：

- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/html/2026年5月商场经营简报.html`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/html/2026年5月商场经营分析报告.html`

## 7. 新样例文件路径

DOCX：

- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/docx/2026年5月商场经营简报.docx`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/docx/2026年5月商场经营分析报告.docx`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/docx/2026年5月单店重点问题分析卡.docx`

PDF：

- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/pdf/2026年5月商场经营简报.pdf`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/pdf/2026年5月商场经营分析报告.pdf`

页面预览图：

- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/previews/pdf-contact-sheet.png`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/previews/pdf/2026年5月商场经营简报/page-1.png`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/previews/pdf/2026年5月商场经营简报/page-2.png`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/previews/pdf/2026年5月商场经营分析报告/page-1.png`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/previews/pdf/2026年5月商场经营分析报告/page-2.png`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/previews/pdf/2026年5月商场经营分析报告/page-3.png`
- `/Users/lvminglei/Desktop/11/stage5-report-export-polish/previews/pdf/2026年5月商场经营分析报告/page-4.png`

## 8. 视觉检查结果

- 领导简报控制在 2 页。
- 领导简报第 2 页承接重点门店表，不再从半条记录中间开始。
- PDF 表格浅色表头、边框、列宽和换行正常。
- 完整经营分析报告 4 页，章节可读，无空白文档或异常符号。
- 扫描 DOCX/PDF/HTML 内容，未发现 `DeepSeek`、`Mock`、`Codex`、`D1`、`critical_store_count`、`warning_count`、`self_pos_diff_rate`、`1.0761`、`0.1111`、`0.0222`、`0.9333`、`销售额0`。

## 9. 测试和构建结果

- 全量 Vitest：16 个测试文件通过，100 项测试通过。
- Next 生产构建：通过。
- 构建阶段包含类型检查、页面数据收集和 36 个静态页面生成。

## 10. 是否可以进入第六阶段

可以在用户用 WPS/Word 确认新的 DOCX 样例版式无问题后进入第六阶段。

本次任务按要求停止：不进入第六阶段，不部署生产环境。
