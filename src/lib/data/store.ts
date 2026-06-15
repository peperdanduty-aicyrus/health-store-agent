import { seedGenerations, seedProfiles, seedOpeningApplications, seedWorkbenchAccounts } from "./seed";
import type {
  CreateGenerationInput,
  CreateOpeningApplicationInput,
  CreateUserInput,
  CreateWorkbenchAccountInput,
  CreateWorkbenchGenerationInput,
  GenerationFilter,
  GenerationRecord,
  Profile,
  OpeningApplication,
  OpeningApplicationStatus,
  WorkbenchAccount,
  WorkbenchGenerationFilter,
  WorkbenchGenerationRecord,
} from "./types";

type StoreState = {
  applications: OpeningApplication[];
  generations: GenerationRecord[];
  profiles: Profile[];
  workbenchAccounts: WorkbenchAccount[];
  workbenchGenerations: WorkbenchGenerationRecord[];
};

export function createMockStore(initialState?: Partial<StoreState>) {
  const state: StoreState = {
    applications: clone(initialState?.applications ?? seedOpeningApplications),
    generations: clone(initialState?.generations ?? seedGenerations),
    profiles: clone(initialState?.profiles ?? seedProfiles),
    workbenchAccounts: clone(initialState?.workbenchAccounts ?? seedWorkbenchAccounts),
    workbenchGenerations: clone(initialState?.workbenchGenerations ?? []),
  };

  return {
    createGeneration(input: CreateGenerationInput): GenerationRecord {
      const record: GenerationRecord = {
        ...input,
        id: makeId("generation", state.generations.length + 1),
        createdAt: new Date().toISOString(),
      };
      state.generations.unshift(record);
      return record;
    },

    createOpeningApplication(input: CreateOpeningApplicationInput): OpeningApplication {
      const application: OpeningApplication = {
        ...input,
        id: makeId("application", state.applications.length + 1),
        openedUserId: "",
        status: "new",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.applications.unshift(application);
      return application;
    },

    createUser(input: CreateUserInput): Profile {
      const user: Profile = {
        ...input,
        id: makeId("user", state.profiles.length + 1),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.profiles.push(user);
      return user;
    },

    createWorkbenchAccount(input: CreateWorkbenchAccountInput): WorkbenchAccount {
      const account: WorkbenchAccount = {
        ...input,
        id: makeId("workbench_account", state.workbenchAccounts.length + 1),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.workbenchAccounts.unshift(account);
      return account;
    },

    createWorkbenchGeneration(input: CreateWorkbenchGenerationInput): WorkbenchGenerationRecord {
      const record: WorkbenchGenerationRecord = {
        ...input,
        id: makeId("workbench_generation", state.workbenchGenerations.length + 1),
        createdAt: new Date().toISOString(),
      };
      state.workbenchGenerations.unshift(record);
      return record;
    },

    deleteAllGenerations(): number {
      const deletedCount = state.generations.length;
      state.generations = [];
      return deletedCount;
    },

    deleteGeneration(id: string): boolean {
      const originalLength = state.generations.length;
      state.generations = state.generations.filter((record) => record.id !== id);
      return state.generations.length !== originalLength;
    },

    deleteOpeningApplication(id: string): boolean {
      const originalLength = state.applications.length;
      state.applications = state.applications.filter((application) => application.id !== id);
      return state.applications.length !== originalLength;
    },

    deleteWorkbenchGeneration(id: string): boolean {
      const originalLength = state.workbenchGenerations.length;
      state.workbenchGenerations = state.workbenchGenerations.filter((record) => record.id !== id);
      return state.workbenchGenerations.length !== originalLength;
    },

    listApplications(): OpeningApplication[] {
      return [...state.applications];
    },

    listGenerations(filter: GenerationFilter = {}): GenerationRecord[] {
      return state.generations.filter((record) => {
        return (
          matches(filter.userId, record.userId) &&
          matches(filter.generationType, record.generationType) &&
          matches(filter.planName, record.planName) &&
          matches(filter.storeType, record.storeType)
        );
      });
    },

    listUsers(): Profile[] {
      return [...state.profiles];
    },

    listWorkbenchAccounts(): WorkbenchAccount[] {
      return [...state.workbenchAccounts];
    },

    listWorkbenchGenerations(filter: WorkbenchGenerationFilter = {}): WorkbenchGenerationRecord[] {
      return state.workbenchGenerations.filter((record) => {
        return matches(filter.accountId, record.accountId) && matches(filter.generationType, record.generationType);
      });
    },

    getGenerationById(id: string): GenerationRecord | null {
      return state.generations.find((record) => record.id === id) ?? null;
    },

    getUserById(id: string): Profile | null {
      return state.profiles.find((profile) => profile.id === id) ?? null;
    },

    getWorkbenchAccountById(id: string): WorkbenchAccount | null {
      return state.workbenchAccounts.find((account) => account.id === id) ?? null;
    },

    getWorkbenchGenerationById(id: string): WorkbenchGenerationRecord | null {
      return state.workbenchGenerations.find((record) => record.id === id) ?? null;
    },

    login(phone: string, password: string): Profile | null {
      return (
        state.profiles.find((profile) => profile.phone === phone && profile.password === password && !profile.disabled) ??
        null
      );
    },

    loginWorkbenchAccount(phone: string, password: string): WorkbenchAccount | null {
      return (
        state.workbenchAccounts.find((account) => account.phone === phone && account.password === password && !account.disabled) ??
        null
      );
    },

    markGenerationCopied(id: string): GenerationRecord | null {
      const record = state.generations.find((item) => item.id === id);
      if (!record) {
        return null;
      }
      record.copied = true;
      return record;
    },

    markWorkbenchGenerationCopied(id: string): WorkbenchGenerationRecord | null {
      const record = state.workbenchGenerations.find((item) => item.id === id);
      if (!record) {
        return null;
      }
      record.copied = true;
      return record;
    },

    updateGenerationNote(id: string, userNote: string): GenerationRecord | null {
      const record = state.generations.find((item) => item.id === id);
      if (!record) {
        return null;
      }
      record.userNote = userNote;
      return record;
    },

    updateOpeningApplicationStatus(
      id: string,
      status: OpeningApplicationStatus,
      openedUserId = "",
    ): OpeningApplication | null {
      const application = state.applications.find((item) => item.id === id);
      if (!application) {
        return null;
      }
      application.status = status;
      application.openedUserId = openedUserId || application.openedUserId;
      application.updatedAt = new Date().toISOString();
      return application;
    },

    updateUserDisabled(id: string, disabled: boolean): Profile | null {
      const profile = state.profiles.find((item) => item.id === id);
      if (!profile || profile.role === "admin") {
        return null;
      }
      profile.disabled = disabled;
      profile.updatedAt = new Date().toISOString();
      return profile;
    },

    updateUserPassword(id: string, password: string): Profile | null {
      const profile = state.profiles.find((item) => item.id === id);
      if (!profile) {
        return null;
      }
      profile.password = password;
      profile.updatedAt = new Date().toISOString();
      return profile;
    },

    updateWorkbenchAccountDisabled(id: string, disabled: boolean): WorkbenchAccount | null {
      const account = state.workbenchAccounts.find((item) => item.id === id);
      if (!account) {
        return null;
      }
      account.disabled = disabled;
      account.updatedAt = new Date().toISOString();
      return account;
    },

    updateWorkbenchAccountPassword(id: string, password: string): WorkbenchAccount | null {
      const account = state.workbenchAccounts.find((item) => item.id === id);
      if (!account) {
        return null;
      }
      account.password = password;
      account.updatedAt = new Date().toISOString();
      return account;
    },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string, index: number): string {
  return `${prefix}_${index.toString().padStart(3, "0")}`;
}

function matches<T>(expected: T | undefined, actual: T): boolean {
  return expected === undefined || expected === actual;
}

type GlobalWithMockStore = typeof globalThis & {
  __hsaMockStore?: ReturnType<typeof createMockStore>;
};

const globalForMockStore = globalThis as GlobalWithMockStore;

export const mockStore = (globalForMockStore.__hsaMockStore ??= createMockStore());
