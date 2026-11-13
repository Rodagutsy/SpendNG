import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const LOCK_ENABLED_KEY = 'spendng_biometric_lock_enabled';

interface AppLockState {
  biometricEnabled: boolean;
  locked: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  lock: () => void;
  unlockWithBiometrics: () => Promise<boolean>;
}

async function readStoredLockFlag(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const val = await SecureStore.getItemAsync(LOCK_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

async function writeStoredLockFlag(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.setItemAsync(LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage write error
  }
}

export const useAppLockStore = create<AppLockState>((set, get) => ({
  biometricEnabled: false,
  locked: false,
  hydrated: false,

  hydrate: async () => {
    const enabled = await readStoredLockFlag();
    set({
      biometricEnabled: enabled,
      locked: enabled,
      hydrated: true,
    });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    if (Platform.OS === 'web') return false;

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return false;
    }

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: enabled ? 'Enable Biometric / Device Lock' : 'Disable Biometric / Device Lock',
      fallbackLabel: 'Use Device Passcode',
      cancelLabel: 'Cancel',
    });

    if (!auth.success) return false;

    await writeStoredLockFlag(enabled);
    set({ biometricEnabled: enabled, locked: false });
    return true;
  },

  lock: () => {
    if (get().biometricEnabled) {
      set({ locked: true });
    }
  },

  unlockWithBiometrics: async () => {
    if (!get().biometricEnabled) {
      set({ locked: false });
      return true;
    }
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock SpendNG',
      fallbackLabel: 'Use Device Passcode',
      cancelLabel: 'Cancel',
    });
    if (auth.success) {
      set({ locked: false });
      return true;
    }
    return false;
  },
}));

