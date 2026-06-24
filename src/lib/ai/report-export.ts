import type { SurveyReportType } from "../survey/types";

export function exportReportDocx({ content, periodMonth, reportType, title }: { content: unknown; periodMonth: string; reportType: SurveyReportType; title: string }) {
  const official = getOfficialReportMeta(periodMonth, reportType, title);
  const fileName = `${official.fileBaseName}.docx`;
  const documentXml = buildDocumentXml(official, renderReportBlocks(content, reportType));
  return {
    body: createZip([
      { name: "[Content_Types].xml", content: contentTypesXml },
      { name: "_rels/.rels", content: relsXml },
      { name: "word/_rels/document.xml.rels", content: documentRelsXml },
      { name: "word/document.xml", content: documentXml },
      { name: "word/footer1.xml", content: footerXml },
      { name: "word/numbering.xml", content: numberingXml },
      { name: "word/styles.xml", content: stylesXml },
    ]),
    fileName,
    headers: {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  };
}

export function createPrintableReportHtml({ content, periodMonth, reportType, title }: { content: unknown; periodMonth: string; reportType: SurveyReportType; title: string }) {
  const official = getOfficialReportMeta(periodMonth, reportType, title);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(official.title)}</title>
  <style>
    @page { size: A4; margin: 18mm 17mm 20mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; color: #1f1f1f; font-size: 14px; line-height: 1.55; margin: 0; }
    h1 { font-size: 24px; line-height: 1.25; margin: 0 0 6px; }
    .subtitle { color: #44546a; font-size: 14px; font-weight: 600; margin: 0 0 8px; }
    .meta { border-bottom: 1px solid #d9e2f3; color: #666; font-size: 12px; margin-bottom: 14px; padding-bottom: 8px; }
    h2 { break-after: avoid; color: #1f4e79; font-size: 17px; margin: 16px 0 8px; padding-bottom: 3px; border-bottom: 1px solid #d9e2f3; }
    p { margin: 5px 0 7px; }
    ul { margin: 5px 0 10px; padding-left: 20px; }
    li { margin: 2px 0; }
    table { border-collapse: collapse; break-inside: auto; margin: 7px 0 12px; table-layout: fixed; width: 100%; font-size: 12px; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    th, td { border: 1px solid #c9d2df; padding: 6px 7px; vertical-align: top; word-break: break-word; }
    th { background: #eef3f8; color: #1f4e79; font-weight: 700; text-align: left; }
    .empty { color: #777; }
    .report-footer { bottom: 8mm; color: #777; font-size: 11px; position: fixed; right: 17mm; }
    @media screen { body { margin: 28px auto; max-width: 860px; } .report-footer { display: none; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(official.title)}</h1>
  <p class="subtitle">${escapeHtml(official.subtitle)}</p>
  <div class="meta">${escapeHtml(official.metaLine)}</div>
  ${renderReportHtml(content, reportType)}
  <div class="report-footer">营运内部资料</div>
</body>
</html>`;
}

export function renderPlainText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return String(content ?? "");
  const lines: string[] = [];
  flatten(content, lines, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function flatten(value: unknown, lines: string[], label: string) {
  if (typeof value === "string" || typeof value === "number" || value === null) {
    lines.push(label ? `${label}：${value ?? "暂无数据"}` : String(value ?? "暂无数据"));
    return;
  }
  if (Array.isArray(value)) {
    if (label) lines.push(label);
    if (!value.length) lines.push("暂无数据");
    value.forEach((item, index) => flatten(item, lines, `${index + 1}`));
    return;
  }
  if (typeof value === "object" && value) {
    if (label && !/^\d+$/.test(label)) lines.push(label);
    for (const [key, item] of Object.entries(value)) {
      flatten(item, lines, key);
    }
  }
}

type ReportBlock =
  | { level?: 1 | 2; text: string; type: "heading" }
  | { text: string; type: "paragraph" }
  | { items: string[]; type: "list" }
  | { headers: string[]; rows: string[][]; type: "table"; widths?: number[] };

function renderReportBlocks(content: unknown, reportType: SurveyReportType): ReportBlock[] {
  const data = toRecord(content);
  if (reportType === "leadership_brief") {
    return [
      heading("一、经营结论"),
      paragraph(data.one_sentence_conclusion),
      paragraph(data.overall_performance_summary),
      heading("二、主要亮点"),
      tableBlock(["亮点", "数据依据", "解释"], toArray(data.highlights).map((item) => {
        const row = toRecord(item);
        return [text(row.title), text(row.evidence), text(row.interpretation)];
      }), [1900, 3650, 3810]),
      heading("三、主要风险"),
      tableBlock(["风险", "范围", "数据表现", "建议动作"], toArray(data.risks).map((item) => {
        const row = toRecord(item);
        return [text(row.type), text(row.scope), text(row.evidence), text(row.action)];
      }), [1500, 1400, 3450, 3010]),
      heading("四、重点门店"),
      tableBlock(["门店", "问题", "数据依据", "跟进重点"], toArray(data.focus_stores).map((item) => {
        const row = toRecord(item);
        return [text(row.store_id), text(row.issue), text(row.evidence), text(row.follow_up_focus)];
      }), [1400, 1900, 3350, 2710]),
      heading("五、下月重点"),
      list(toStringArray(data.next_month_priorities)),
      heading("六、数据说明"),
      list(toStringArray(data.data_limitations)),
    ];
  }
  if (reportType === "full_analysis") {
    return [
      heading("一、执行摘要"),
      paragraph(data.executive_summary),
      heading("二、整体经营表现"),
      tableBlock(["趋势", "目标", "数据来源"], [[text(toRecord(data.overall_analysis).trend), text(toRecord(data.overall_analysis).target), text(toRecord(data.overall_analysis).data_source_note)]], [2600, 2600, 4160]),
      heading("三、业态表现"),
      tableBlock(["业态", "评价", "依据", "风险", "动作"], toArray(data.category_analysis).map((item) => {
        const row = toRecord(item);
        return [text(row.category), text(row.assessment), text(row.evidence), text(row.risk), text(row.action)];
      }), [1100, 2450, 1800, 1900, 2110]),
      heading("四、效率、原因与对标"),
      paragraph(data.efficiency_analysis),
      paragraph(data.growth_reason_summary),
      paragraph(data.decline_reason_summary),
      paragraph(data.peer_benchmark_summary),
      heading("五、重点预警门店"),
      tableBlock(["门店", "预警", "问题", "依据", "优先动作"], toArray(data.warning_store_analysis).map((item) => {
        const row = toRecord(item);
        return [text(row.store_id), toStringArray(row.warnings).join("、") || "暂无数据", text(row.issue), text(row.evidence), text(row.priority_action)];
      }), [1200, 1650, 2100, 2650, 1760]),
      heading("六、专项与跟进"),
      paragraph(data.kids_entertainment_analysis),
      paragraph(data.education_analysis),
      paragraph(data.follow_up_analysis),
      heading("七、下月计划"),
      tableBlock(["优先级", "方向", "范围", "动作", "检查点"], toArray(data.next_month_plan).map((item) => {
        const row = toRecord(item);
        return [text(row.priority), text(row.direction), text(row.scope), text(row.action), text(row.check_point)];
      }), [900, 1500, 1600, 3600, 1760]),
      heading("八、数据说明"),
      list(toStringArray(data.data_limitations)),
    ];
  }
  if (reportType === "oral_briefing") {
    return [
      heading("一、汇报稿"),
      paragraph(data.script),
      heading("二、核心数字"),
      list(toStringArray(data.key_numbers)),
      heading("三、提示备注"),
      list(toStringArray(data.speaker_notes)),
    ];
  }
  return [
    heading("一、门店状态"),
    tableBlock(["门店", "状态", "预警"], [[text(data.store_id), text(data.status), toStringArray(data.warning_flags).join("、") || "暂无数据"]], [2100, 2100, 5160]),
    heading("二、关键依据"),
    list(toStringArray(data.key_evidence)),
    heading("三、商户反馈与营运判断"),
    paragraph(data.merchant_reason_summary),
    paragraph(data.operator_issue_judgement),
    heading("四、优先动作"),
    list(toStringArray(data.priority_actions)),
    heading("五、下次复查重点"),
    list(toStringArray(data.next_review_focus)),
  ];
}

function renderReportHtml(content: unknown, reportType: SurveyReportType) {
  return renderReportBlocks(content, reportType).map((block) => {
    if (block.type === "heading") return `<h2>${escapeHtml(block.text)}</h2>`;
    if (block.type === "paragraph") return `<p>${escapeHtml(polishOfficialText(block.text || "暂无数据"))}</p>`;
    if (block.type === "list") return block.items.length ? `<ul>${block.items.map((item) => `<li>${escapeHtml(polishOfficialText(item))}</li>`).join("")}</ul>` : `<p class="empty">暂无数据</p>`;
    if (!block.rows.length) return `<p class="empty">暂无数据</p>`;
    return `<table><thead><tr>${block.headers.map((item) => `<th>${escapeHtml(item)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(polishOfficialText(cell || "暂无数据"))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }).join("\n");
}

function buildDocumentXml(official: OfficialReportMeta, blocks: ReportBlock[]) {
  const body = [
    docParagraph(official.title, "Title"),
    docParagraph(official.subtitle, "Subtitle"),
    docParagraph(official.metaLine, "Meta"),
    ...blocks.flatMap(docBlock),
  ].join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:footerReference w:type="default" w:id="rIdFooter1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708"/><w:cols w:space="708"/><w:docGrid w:linePitch="312"/></w:sectPr></w:body></w:document>`;
}

function docBlock(block: ReportBlock): string[] {
  if (block.type === "heading") return [docParagraph(block.text, "Heading1")];
  if (block.type === "paragraph") return [docParagraph(polishOfficialText(block.text || "暂无数据"))];
  if (block.type === "list") return block.items.length ? block.items.map((item) => docParagraph(polishOfficialText(item), "List")) : [docParagraph("暂无数据")];
  return [docTable(block)];
}

function docParagraph(textValue: string, style?: "Title" | "Subtitle" | "Meta" | "Heading1" | "List" | "TableText" | "TableHeader") {
  const styleXml = style ? `<w:pStyle w:val="${style}"/>` : "";
  const listXml = style === "List" ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>` : "";
  const pPr = styleXml || listXml ? `<w:pPr>${styleXml}${listXml}</w:pPr>` : "";
  return `<w:p>${pPr}<w:r><w:t xml:space="preserve">${escapeXml(textValue)}</w:t></w:r></w:p>`;
}

function docTable(block: Extract<ReportBlock, { type: "table" }>) {
  const widths = normalizeWidths(block.widths, block.headers.length);
  const rows = [block.headers, ...(block.rows.length ? block.rows : [block.headers.map(() => "暂无数据")])];
  return `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="c9d2df"/><w:left w:val="single" w:sz="4" w:space="0" w:color="c9d2df"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="c9d2df"/><w:right w:val="single" w:sz="4" w:space="0" w:color="c9d2df"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="c9d2df"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="c9d2df"/></w:tblBorders><w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid>${rows.map((row, rowIndex) => docTableRow(row, widths, rowIndex === 0)).join("")}</w:tbl>`;
}

function heading(textValue: string): ReportBlock {
  return { text: textValue, type: "heading" };
}

function paragraph(value: unknown): ReportBlock {
  return { text: text(value), type: "paragraph" };
}

function list(items: string[]): ReportBlock {
  return { items, type: "list" };
}

function tableBlock(headers: string[], rows: string[][], widths?: number[]): ReportBlock {
  return { headers, rows, type: "table", widths };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

function text(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

type OfficialReportMeta = {
  fileBaseName: string;
  metaLine: string;
  subtitle: string;
  title: string;
};

function getOfficialReportMeta(periodMonth: string, reportType: SurveyReportType, fallbackTitle: string): OfficialReportMeta {
  const month = formatReportMonth(periodMonth);
  const baseTitle: Record<SurveyReportType, string> = {
    full_analysis: `${month}商场经营分析报告`,
    leadership_brief: `${month}商场经营简报`,
    oral_briefing: `${month}营运口头汇报稿`,
    store_analysis: `${month}单店重点问题分析卡`,
  };
  const title = baseTitle[reportType] || polishOfficialText(fallbackTitle);
  return {
    fileBaseName: title,
    metaLine: `报告月份：${month}｜确认时间：${getShanghaiDate()}｜数据口径：以商场POS录入和月度经营填报为准，缺失数据不按0处理`,
    subtitle: "营运内部汇报｜人工确认版",
    title,
  };
}

function formatReportMonth(periodMonth: string) {
  const [year, month] = periodMonth.split("-");
  return `${year}年${Number(month)}月`;
}

function docTableRow(row: string[], widths: number[], isHeader: boolean) {
  const trPr = `<w:trPr>${isHeader ? "<w:tblHeader/>" : ""}<w:cantSplit/></w:trPr>`;
  return `<w:tr>${trPr}${row.map((cell, index) => {
    const shading = isHeader ? `<w:shd w:val="clear" w:color="auto" w:fill="EEF3F8"/>` : "";
    const tcPr = `<w:tcPr><w:tcW w:w="${widths[index] ?? widths[0]}" w:type="dxa"/>${shading}<w:vAlign w:val="center"/></w:tcPr>`;
    return `<w:tc>${tcPr}${docParagraph(polishOfficialText(cell || "暂无数据"), isHeader ? "TableHeader" : "TableText")}</w:tc>`;
  }).join("")}</w:tr>`;
}

function normalizeWidths(widths: number[] | undefined, columns: number) {
  if (widths?.length === columns) return widths;
  const width = Math.floor(9360 / columns);
  return Array.from({ length: columns }, (_, index) => index === columns - 1 ? 9360 - width * (columns - 1) : width);
}

function polishOfficialText(value: string) {
  let result = value;
  result = result
    .replace(/推动Codex\s*D1验收验证按期完成/g, "跟进营运整改事项")
    .replace(/跟进Codex本地D1验收验证项目进度/g, "跟进营运整改事项")
    .replace(/Codex本地D1验收验证状态/g, "营运跟进状态")
    .replace(/真实DeepSeek|DeepSeek|Mock|mock|Codex|D1|数字口径清理版|数字文案清理版/g, "")
    .replace(/人工复核[:：]?[^。；;]*[。；;]?/g, "")
    .replace(/人工补充[:：]?/g, "")
    .replace(/本地验收验证项目进度/g, "营运跟进事项")
    .replace(/本地验收验证状态/g, "营运跟进状态")
    .replace(/系统确定性指标口径/g, "既定数据口径")
    .replace(/critical_store_count\s*=\s*(\d+)/g, "$1家重点关注门店")
    .replace(/warning_count\s*=\s*(\d+)/g, "$1项预警")
    .replace(/self_pos_diff_rate\s*=\s*(-?\d+(?:\.\d+)?)/g, (_match, raw) => `自报POS差异${formatPercent(Math.abs(Number(raw)))}`)
    .replace(/self_pos_diff_rate/g, "自报POS差异率")
    .replace(/peer_reference/g, "同城对标")
    .replace(/来源为missing/g, "暂无有效来源")
    .replace(/关键门店/g, "重点关注门店")
    .replace(/提升POS数据覆盖率，推动更多门店安装或接入POS系统/g, "提高商场POS数据录入或接入覆盖率")
    .replace(/提升POS数据覆盖率，提高商场POS数据录入或接入覆盖率/g, "提高商场POS数据录入或接入覆盖率")
    .replace(/推动更多门店安装或接入POS系统/g, "提高商场POS数据录入或接入覆盖率")
    .replace(/推动商户安装POS系统/g, "提高商场POS数据录入或接入覆盖率")
    .replace(/接入POS系统或手工填报/g, "补充POS数据录入或经营填报")
    .replace(/接入POS或手工填报/g, "补充POS数据录入或经营填报")
    .replace(/无POS门店/g, "未纳入POS数据的门店")
    .replace(/警告代码/g, "预警")
    .replace(/警告/g, "预警");

  result = result.replace(/目标完成率\s*([-+]?\d+(?:\.\d+)?)（[-+]?\d+(?:\.\d+)?%）/g, (_match, raw) => `目标完成率${formatPercent(Number(raw))}`);
  result = result.replace(/(目标完成率|完成率|POS覆盖率|提交率|填报完成率|上报率|环比增长率|同比增长率|差异率|自报POS差异率)(?:为|仅)?\s*(-?\d+(?:\.\d+)?)(?![\d.]|\s*%)/g, (match, label, raw) => {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return match;
    if (Math.abs(numeric) <= 1.5) return `${label}${formatPercent(numeric)}`;
    return `${label}${formatPercent(numeric / 100)}`;
  });
  result = result.replace(/(POS覆盖率|提交率)为\s*(-?\d+(?:\.\d+)?)/g, (_match, label, raw) => `${label}${formatPercent(Number(raw))}`);
  result = result.replace(/(3C数码|儿童鞋服|美妆护肤|儿童用品)(\d\.\d{1,4})(?![\d.]|\s*%)/g, (_match, label, raw) => `${label}${formatPercent(Number(raw))}`);
  result = result.replace(/(\d+(?:\.\d+)?)%/g, (_match, raw) => `${formatOneDecimal(Number(raw))}%`);
  result = result.replace(/(总销售额|整体销售额|本月整体销售额|POS销售额|销售额)(\d+(?:\.\d+)?)万(?!元)/g, (_match, label, raw) => `${label}${formatWan(Number(raw))}`);
  result = result.replace(/(总销售额|整体销售额|本月整体销售额|POS销售额|销售额)(\d+(?:\.\d+)?)万元/g, (_match, label, raw) => `${label}${formatWan(Number(raw))}`);
  result = result.replace(/销售额0(?:\.0)?万元，目标完成率暂无数据/g, "暂无有效销售数据，目标完成率暂无数据");
  result = result.replace(/销售额0(?:\.0)?万元/g, "暂无有效销售数据");
  result = result.replace(/销售额0，目标完成率暂无数据/g, "暂无有效销售数据，目标完成率暂无数据");
  result = result.replace(/销售额0(?![\d.])/g, "暂无有效销售数据");
  result = result.replace(/销售额为零或数据缺失/g, "暂无有效数据的品类需单独核实，缺失数据不按零销售处理");
  result = result.replace(/等品类暂无有效数据的品类需单独核实/g, "等品类暂无有效数据，需单独核实");
  result = result.replace(/均缺失或为0/g, "均缺失或暂无有效参考");
  result = result.replace(/0万，且无具体门店数据可分析/g, "暂无有效销售数据，且无具体门店数据可分析");
  result = result.replace(/暂无销售额数据（0万）/g, "暂无有效销售数据");
  result = result.replace(/销售额为0，且无任何明细数据/g, "暂无有效销售数据，且无任何明细数据");
  result = result.replace(/低于1/g, "未达目标").replace(/高于1/g, "达成目标");
  result = result.replace(/目标完成率(\d+\.\d+)，目标完成率\1/g, "目标完成率$1");
  result = result.replace(/整体目标完成率([^，。；;]+)，目标完成率\1/g, "整体目标完成率$1");
  result = result.replace(/自报POS差异率为-1/g, "自报与POS差异较大");
  result = result.replace(/自报POS差异率-100\.0%/g, "自报与POS差异较大");
  result = result.replace(/自报POS差异率-31\.7%/g, "自报POS差异31.7%");
  result = result.replace(/预警([W]\d{2}(?:、[W]\d{2})*)/g, (_match, codes) => `预警：${translateWarningCodes(codes.split("、"))}`);
  result = result.replace(/W\d{2}(?:、W\d{2})*/g, (codes) => translateWarningCodes(codes.split("、")));
  result = result.replace(/（\s*）/g, "").replace(/（\s*$/g, "").replace(/\s{2,}/g, " ").replace(/，\s*，/g, "，").trim();
  return result || "暂无数据";
}

function translateWarningCodes(codes: string[]) {
  const names: Record<string, string> = {
    W01: "环比下降超过10%",
    W02: "目标完成率低于80%",
    W03: "连续两个月销售下降",
    W04: "连续两个月未完成目标",
    W05: "商户自报与POS差异较大",
    W06: "连续两个月逾期提交",
    W07: "主推品库存不足",
    W08: "滞销库存偏多",
    W10: "人效连续下降",
    W11: "连续两个月没有新品或主推活动",
    W12: "同城对标信息长期缺失",
  };
  return codes.map((code) => names[code] ?? code).join("、");
}

function formatWan(value: number) {
  return `${formatOneDecimal(value)}万元`;
}

function formatPercent(value: number) {
  return `${formatOneDecimal(value * 100)}%`;
}

function formatOneDecimal(value: number) {
  if (!Number.isFinite(value)) return "暂无数据";
  return (Math.round(value * 10) / 10).toFixed(1);
}

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="90" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F1F1F"/><w:sz w:val="34"/><w:szCs w:val="34"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="60"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:b/><w:color w:val="44546A"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="160"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="6" w:color="D9E2F3"/></w:pBdr></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:color w:val="666666"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="D9E2F3"/></w:pBdr></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F4E79"/><w:sz w:val="27"/><w:szCs w:val="27"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="List"><w:name w:val="List"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="60" w:line="280" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="270" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="TableHeader"><w:name w:val="Table Header"/><w:basedOn w:val="TableText"/><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:b/><w:color w:val="1F4E79"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="Footer"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="right"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei" w:hAnsi="Calibri"/><w:color w:val="777777"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
</w:styles>`;

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="260"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;

const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pStyle w:val="Footer"/><w:jc w:val="right"/></w:pPr><w:r><w:t>营运内部资料｜第 </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple><w:r><w:t> 页</w:t></w:r></w:p></w:ftr>`;

type ZipEntry = { content: string; name: string };

function createZip(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = Buffer.from(entry.content, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, item) => sum + item.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(buffer: Buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeHtml(value: string) {
  return escapeXml(value);
}

function getShanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "Asia/Shanghai", year: "numeric" }).formatToParts(new Date());
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}
