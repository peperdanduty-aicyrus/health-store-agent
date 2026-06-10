import type { GenerationRecord, Profile, OpeningApplication } from "./types";

const now = "2026-06-10T00:00:00.000Z";

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
