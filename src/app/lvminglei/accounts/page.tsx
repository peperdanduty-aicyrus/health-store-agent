import { redirect } from "next/navigation";

export default function LegacyAccountsRedirect() {
  redirect("/agent-admin/operators");
}
