import { seedGenerations, seedProfiles, seedOpeningApplications } from "./seed";
import type {
  CreateGenerationInput,
  CreateOpeningApplicationInput,
  CreateUserInput,
  GenerationFilter,
  GenerationRecord,
  Profile,
  OpeningApplication,
  OpeningApplicationStatus,
} from "./types";

type StoreState = {
  applications: OpeningApplication[];
  generations: GenerationRecord[];
  profiles: Profile[];
};

export function createMockStore(initialState?: Partial<StoreState>) {
  const state: StoreState = {
    applications: clone(initialState?.applications ?? seedOpeningApplications),
    generations: clone(initialState?.generations ?? seedGenerations),
    profiles: clone(initialState?.profiles ?? seedProfiles),
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

    getGenerationById(id: string): GenerationRecord | null {
      return state.generations.find((record) => record.id === id) ?? null;
    },

    getUserById(id: string): Profile | null {
      return state.profiles.find((profile) => profile.id === id) ?? null;
    },

    login(phone: string, password: string): Profile | null {
      return (
        state.profiles.find((profile) => profile.phone === phone && profile.password === password && !profile.disabled) ??
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

export const mockStore = createMockStore();
