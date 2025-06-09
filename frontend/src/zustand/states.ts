import { create } from "zustand";

interface StoreState {
  file: File | null;
  setFile: (input: StoreState["file"]) => void;
}

interface CreditState {
  credits: number | null;
  setCredits: (input: number) => void;
}

export const useStore = create<StoreState>((set) => {
  return {
    file: null,
    setFile: (input) => set({ file: input }),
  };
});

export const useCredits = create<CreditState>((set) => {
  return {
    credits: null,
    setCredits: (input) => set({ credits: input }),
  };
});
