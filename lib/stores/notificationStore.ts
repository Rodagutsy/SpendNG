import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationState {
  clearedIds: string[];
  clearAll: (ids: string[]) => void;
  isCleared: (id: string) => boolean;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      clearedIds: [],
      clearAll: (ids) => set({ clearedIds: ids }),
      isCleared: (id) => get().clearedIds.includes(id),
    }),
    {
      name: 'notification-cleared-ids',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
