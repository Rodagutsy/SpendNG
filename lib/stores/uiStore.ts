import { create } from 'zustand';

interface UIState {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'paused';
  syncProgress: number;
  importProgress: { found: number; processed: number } | null;
  dbInitialized: boolean;

  setOnline: (online: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error' | 'paused') => void;
  setSyncProgress: (progress: number) => void;
  setImportProgress: (progress: { found: number; processed: number } | null) => void;
  setDbInitialized: (init: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: true,
  syncStatus: 'idle',
  syncProgress: 0,
  importProgress: null,
  dbInitialized: false,

  setOnline: (isOnline) => set({ isOnline }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setSyncProgress: (syncProgress) => set({ syncProgress }),
  setImportProgress: (importProgress) => set({ importProgress }),
  setDbInitialized: (dbInitialized) => set({ dbInitialized }),
}));
