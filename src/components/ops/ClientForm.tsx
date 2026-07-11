import { saveOpsClient } from "@/app/lvminglei/actions";
import { Field } from "./OpsUi";

export function ClientForm({ client }: { client?: Record<string, string | boolean> }) {
  const value = (key: string) => String(client?.[key] ?? "");
  return (
    <form action={saveOpsClient} className="ops-form-grid">
      {client?.id ? <input name="id" type="hidden" value={value("id")} /> : null}
      <Field label="客户名称"><input name="clientName" defaultValue={value("clientName")} required /></Field>
      <Field label="品牌名称"><input name="brandName" defaultValue={value("brandName")} /></Field>
      <Field label="行业"><input name="industry" defaultValue={value("industry")} /></Field>
      <Field label="城市"><input name="city" defaultValue={value("city")} /></Field>
      <Field label="服务区域"><input name="serviceArea" defaultValue={value("serviceArea")} /></Field>
      <Field label="客户来源"><input name="customerSource" defaultValue={value("customerSource")} /></Field>
      <Field label="联系人"><input name="contactName" defaultValue={value("contactName")} /></Field>
      <Field label="联系方式"><input name="contactMethod" defaultValue={value("contactMethod")} /></Field>
      <Field label="营业时间"><input name="businessHours" defaultValue={value("businessHours")} /></Field>
      <Field label="合作状态"><select name="cooperationStatus" defaultValue={value("cooperationStatus") || "合作中"}><option>合作中</option><option>待签约</option><option>暂停合作</option><option>已结束</option></select></Field>
      <Field wide label="地址"><input name="address" defaultValue={value("address")} /></Field>
      <Field wide label="公司介绍"><textarea name="companyIntro" defaultValue={value("companyIntro")} rows={3} /></Field>
      <Field wide label="主营业务"><textarea name="mainBusiness" defaultValue={value("mainBusiness")} rows={3} /></Field>
      <Field wide label="目标受众"><textarea name="targetAudience" defaultValue={value("targetAudience")} rows={3} /></Field>
      <Field wide label="备注"><textarea name="notes" defaultValue={value("notes")} rows={3} /></Field>
      <div className="ops-form-actions wide"><button className="ops-button ops-button-primary" type="submit">保存客户资料</button></div>
    </form>
  );
}
