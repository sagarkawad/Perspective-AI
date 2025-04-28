import { create } from "zustand";

interface StoreState {
  file: File | null;
  setFile: (input: StoreState["file"]) => void;
}

export const useStore = create<StoreState>((set) => {
  return {
    file: null,
    setFile: (input) => set({ file: input }),
  };
});
