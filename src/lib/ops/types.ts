export const opsTaskStatuses = ["待生成", "待处理", "已完成", "已交付", "已发布", "已作废"] as const;
export type OpsTaskStatus = (typeof opsTaskStatuses)[number];

export const opsReportTypes = ["weekly", "monthly"] as const;
export type OpsReportType = (typeof opsReportTypes)[number];

export type OpsClient = {
  id: string;
  clientName: string;
  brandName: string;
  industry: string;
  city: string;
  serviceArea: string;
  contactName: string;
  contactMethod: string;
  address: string;
  companyIntro: string;
  mainBusiness: string;
  targetAudience: string;
  businessHours: string;
  customerSource: string;
  cooperationStatus: string;
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OpsOrganization = {
  id: string;
  clientId: string;
  organizationName: string;
  organizationType: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OpsServiceAgreement = {
  id: string;
  clientId: string;
  serviceStartDate: string;
  serviceEndDate: string;
  monthlyFee: number;
  settlementDay: number;
  expectedAmount: number;
  paidAmount: number;
  paymentStatus: string;
  deliveryMethod: string;
  serviceScope: string;
  monthlyTasks: string;
  weeklyTasks: string;
  importantAgreements: string;
  renewalProbability: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsTask = {
  id: string;
  clientId: string;
  organizationId: string;
  title: string;
  taskType: string;
  description: string;
  scheduledDate: string;
  dueDate: string;
  status: OpsTaskStatus;
  priority: string;
  assignedUserId: string;
  relatedPlatform: string;
  keyword: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsTaskLog = {
  id: string;
  taskId: string;
  clientId: string;
  organizationId: string;
  logType: string;
  content: string;
  nextAction: string;
  createdByUserId: string;
  createdAt: string;
};

export type OpsPayment = {
  id: string;
  clientId: string;
  billingMonth: string;
  expectedAmount: number;
  receivedAmount: number;
  dueDate: string;
  receivedDate: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsSubscription = {
  id: string;
  serviceName: string;
  accountNote: string;
  purchaseDate: string;
  expiryDate: string;
  price: number;
  billingCycle: string;
  autoRenew: boolean;
  usageNote: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsOperatorAssignment = {
  id: string;
  assignedUserId: string;
  clientId: string;
  organizationId: string;
  generationLimit: number;
  createdAt: string;
  updatedAt: string;
};

export type OpsContentProfile = {
  id: string;
  organizationId: string;
  detailedIntro: string;
  services: string;
  realAdvantages: string;
  teamInfo: string;
  qualifications: string;
  faq: string;
  audienceConcerns: string;
  writingStyle: string;
  prohibitedClaims: string;
  bannedWords: string;
  referenceAccounts: string;
  keywords: string;
  usedKeywords: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsReport = {
  id: string;
  clientId: string;
  organizationId: string;
  reportType: OpsReportType;
  periodStart: string;
  periodEnd: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type OpsClientInput = Omit<OpsClient, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsOrganizationInput = Omit<OpsOrganization, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsServiceAgreementInput = Omit<OpsServiceAgreement, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsTaskInput = Omit<OpsTask, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsTaskLogInput = Omit<OpsTaskLog, "id" | "createdAt"> & { id?: string };
export type OpsPaymentInput = Omit<OpsPayment, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsSubscriptionInput = Omit<OpsSubscription, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsOperatorAssignmentInput = Omit<OpsOperatorAssignment, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsContentProfileInput = Omit<OpsContentProfile, "id" | "createdAt" | "updatedAt"> & { id?: string };
export type OpsReportInput = Omit<OpsReport, "id" | "createdAt" | "updatedAt"> & { id?: string };

export type OpsDashboardMetrics = {
  activeClients: number;
  expectedThisMonth: number;
  receivedThisMonth: number;
  overdueAmount: number;
  tasksThisMonth: number;
  completedTasks: number;
  pendingTasks: number;
};
