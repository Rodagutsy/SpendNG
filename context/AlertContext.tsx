import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertModal, AlertConfig } from '@/components/AlertModal';

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((c: AlertConfig) => setConfig(c), []);
  const hideAlert = useCallback(() => setConfig(null), []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal visible={config !== null} config={config} onClose={hideAlert} />
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
