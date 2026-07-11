import type { Profile, WorkbenchAccount } from "@/lib/data/types";
import type { OpsOperatorAssignment } from "./types";

export class OpsAccessError extends Error {
  readonly status = 403;

  constructor(message = "没有权限访问该机构。") {
    super(message);
    this.name = "OpsAccessError";
  }
}

export function canAccessOpsControlCenter(account: WorkbenchAccount | null) {
  return account?.role === "owner" && !account.disabled;
}

export function requireOpsOwnerRole(account: WorkbenchAccount | null) {
  if (!canAccessOpsControlCenter(account)) {
    throw new OpsAccessError("只有超级管理员可以访问运营总控台。");
  }
  return account;
}

export function requireOperatorRole(profile: Profile | null) {
  if (!profile || profile.role !== "user" || profile.disabled) {
    throw new OpsAccessError("请使用有效的运营人员账号登录。");
  }
  return profile;
}

export function assignedOrganizationIds(assignments: OpsOperatorAssignment[], userId: string) {
  return new Set(assignments.filter((item) => item.assignedUserId === userId).map((item) => item.organizationId));
}

export function assertOrganizationAccess(
  assignments: OpsOperatorAssignment[],
  userId: string,
  organizationId: string,
) {
  if (!assignedOrganizationIds(assignments, userId).has(organizationId)) {
    throw new OpsAccessError();
  }
}

export function assertFinanceAccess(account: WorkbenchAccount | null) {
  return requireOpsOwnerRole(account);
}
