import { create } from "zustand";
import { getCookie, setCookie } from "@/lib/cookies";
import { MAX_HISTORY_ENTRIES, type HistoryEntry, type HistoryPayload, type ToolSlug } from "@/lib/history";

const CONSENT_COOKIE = "dt_history_consent";
const STORAGE_KEY = "dt_history_entries";

export type ConsentStatus = "unknown" | "accepted" | "declined";

interface HistoryState {
  hydrated: boolean;
  consent: ConsentStatus;
  entries: HistoryEntry[];
  pendingRestore: HistoryPayload | null;
  hydrate: () => void;
  setConsent: (consent: "accepted" | "declined") => void;
  record: (entry: Omit<HistoryEntry, "createdAt">) => void;
  removeEntry: (id: string) => void;
  clear: () => void;
  restore: (payload: HistoryPayload) => void;
  consumeRestore: (tool: ToolSlug) => HistoryPayload | null;
}

function persistEntries(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — history just won't survive a reload.
  }
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  hydrated: false,
  consent: "unknown",
  entries: [],
  pendingRestore: null,

  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;
    const cookieValue = getCookie(CONSENT_COOKIE);
    const consent: ConsentStatus =
      cookieValue === "accepted" || cookieValue === "declined" ? cookieValue : "unknown";
    let entries: HistoryEntry[] = [];
    if (consent === "accepted") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        entries = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
      } catch {
        entries = [];
      }
    }
    set({ consent, entries, hydrated: true });
  },

  setConsent: (consent) => {
    setCookie(CONSENT_COOKIE, consent, 365);
    if (consent === "declined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      set({ consent, entries: [] });
      return;
    }
    set({ consent });
  },

  record: (entry) => {
    if (get().consent !== "accepted") return;
    const createdAt = Date.now();
    const rest = get().entries.filter((existing) => existing.id !== entry.id);
    const nextEntries = [{ ...entry, createdAt }, ...rest]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_HISTORY_ENTRIES);
    persistEntries(nextEntries);
    set({ entries: nextEntries });
  },

  removeEntry: (id) => {
    const nextEntries = get().entries.filter((entry) => entry.id !== id);
    persistEntries(nextEntries);
    set({ entries: nextEntries });
  },

  clear: () => {
    persistEntries([]);
    set({ entries: [] });
  },

  restore: (payload) => set({ pendingRestore: payload }),

  consumeRestore: (tool) => {
    const pending = get().pendingRestore;
    if (!pending || pending.tool !== tool) return null;
    set({ pendingRestore: null });
    return pending;
  },
}));
