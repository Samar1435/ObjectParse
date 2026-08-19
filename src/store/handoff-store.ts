import { create } from "zustand";

export type HandoffSourceTool = "base64";

export interface HandoffPayload {
  content: string;
  sourceTool: HandoffSourceTool;
  createdAt: number;
}

interface HandoffState {
  payload: HandoffPayload | null;
  setPayload: (payload: HandoffPayload) => void;
  consume: () => HandoffPayload | null;
}

export const useHandoffStore = create<HandoffState>((set, get) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
  consume: () => {
    const payload = get().payload;
    if (payload) set({ payload: null });
    return payload;
  },
}));
