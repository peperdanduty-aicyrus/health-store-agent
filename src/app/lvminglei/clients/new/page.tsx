import { saveOpsClient } from "@/app/lvminglei/actions";
import { ClientForm } from "@/components/ops/ClientForm";
import { PageHeader, Panel } from "@/components/ops/OpsUi";
import { requireWorkbenchOwner } from "@/lib/auth/workbench-session";

export default async function NewClientPage() {
  await requireWorkbenchOwner();
  return (
    <>
      <PageHeader title="新增客户" description="先建立客户主体，保存后即可继续添加机构、任务、合同与工作记录。" />
      <Panel>
        <ClientForm />
      </Panel>
    </>
  );
}
