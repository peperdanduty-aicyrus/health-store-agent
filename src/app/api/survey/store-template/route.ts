import { assertSurveyMode } from "@/lib/app-mode";
import { buildStoreImportTemplateCsv } from "@/lib/survey/store-import";

export function GET() {
  assertSurveyMode();
  return new Response(`\uFEFF${buildStoreImportTemplateCsv()}`, {
    headers: {
      "Content-Disposition": 'attachment; filename="survey-store-import-template.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
