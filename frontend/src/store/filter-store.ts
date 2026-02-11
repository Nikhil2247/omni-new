import { create } from "zustand";

interface FilterState {
  search: string;
  category: string | null;
  sortBy: string;
  setSearch: (search: string) => void;
  setCategory: (category: string | null) => void;
  setSortBy: (sortBy: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>()((set) => ({
  search: "",
  category: null,
  sortBy: "relevance",
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setSortBy: (sortBy) => set({ sortBy }),
  reset: () => set({ search: "", category: null, sortBy: "relevance" }),
}));
