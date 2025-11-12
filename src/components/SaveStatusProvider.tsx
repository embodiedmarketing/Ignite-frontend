import React, { ReactNode } from 'react';
import { SaveStatusContext, useSaveStatusManager } from '@/hooks/useSaveStatus';
import { GlobalSaveStatusBar } from '@/components/ui/SaveStatusIndicator';

interface SaveStatusProviderProps {
  children: ReactNode;
  showGlobalBar?: boolean;
}

export const SaveStatusProvider: React.FC<SaveStatusProviderProps> = ({ 
  children, 
  showGlobalBar = true 
}) => {
  const saveStatusManager = useSaveStatusManager();

  return (
    <SaveStatusContext.Provider value={saveStatusManager}>
      {children}
      {showGlobalBar && <GlobalSaveStatusBar />}
    </SaveStatusContext.Provider>
  );
};

export default SaveStatusProvider;
