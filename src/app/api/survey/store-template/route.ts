import { buildStoreImportTemplateCsv } from "@/lib/survey/store-import";

export function GET() {
  return new Response(`\uFEFF${buildStoreImportTemplateCsv()}`, {
    headers: {
      "Content-Disposition": 'attachment; filename="survey-store-import-template.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
