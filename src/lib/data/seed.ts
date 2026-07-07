import type { GenerationRecord, Profile, OpeningApplication, WorkbenchAccount } from "./types";

const now = "2026-06-10T00:00:00.000Z";
const defaultWorkbenchUser = "13066622206";
const defaultWorkbenchPassword = "a81366776";

export const seedProfiles: Profile[] = [
  {
    id: "admin_001",
    phone: "13800000000",
    password: "admin123",
    role: "admin",
    storeName: "Cyrus 管理员",
    storeType: "管理员",
    cityArea: "北京",
    mainProjects: "",
    storeAdvantages: "",
    sourceChannel: "其他",
    planName: "coaching",
    memberStatus: "paid",
    expiresAt: "2027-06-10",
    dailyLimit: 100,
    disabled: false,
    createdAt: now,
    updatedAt: now,
  },
];

export const seedOpeningApplications: OpeningApplication[] = [];

export const seedGenerations: GenerationRecord[] = [];

export const seedWorkbenchAccounts: WorkbenchAccount[] = [
  {
    id: "workbench_owner_001",
    phone: process.env.WORKBENCH_USER || defaultWorkbenchUser,
    password: process.env.WORKBENCH_PASSWORD || defaultWorkbenchPassword,
    role: "owner",
    displayName: "吕明磊",
    note: "私用副业运营工作台主账号",
    disabled: false,
    createdAt: now,
    updatedAt: now,
  },
];
