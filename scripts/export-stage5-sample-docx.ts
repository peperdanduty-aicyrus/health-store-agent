import { writeFileSync } from "node:fs";
import { exportReportDocx } from "../src/lib/ai/report-export";

const out = exportReportDocx({
  content: {
    data_limitations: ["同比暂无数据"],
    one_sentence_conclusion: "本月销售19.9万元，数字来自系统确定性计算。",
  },
  periodMonth: "2026-05",
  reportType: "leadership_brief",
  title: "第五阶段DOCX验收样例",
});

writeFileSync("/tmp/stage5-report-sample.docx", out.body);
console.log(JSON.stringify({ bytes: out.body.length, file: "/tmp/stage5-report-sample.docx" }));
