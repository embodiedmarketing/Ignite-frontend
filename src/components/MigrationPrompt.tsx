import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Database, CheckCircle, AlertTriangle } from "lucide-react";
import { useLocalStorageMigration } from "@/hooks/useDatabasePersistence";

interface MigrationPromptProps {
  userId: number;
  onMigrationComplete?: () => void;
}

export default function MigrationPrompt({ userId, onMigrationComplete }: MigrationPromptProps) {
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  const { hasExistingData, isCheckingData, migrateData } = useLocalStorageMigration(userId);

  useEffect(() => {
    // Check for localStorage data that could be migrated
    const checkLocalStorageData = () => {
      const data: any = {
        workbookResponses: {},
        messagingStrategy: null,
        completedSections: []
      };

      // Collect workbook responses
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('workbook_') || key.startsWith('step'))) {
          const value = localStorage.getItem(key);
          if (value && value.length > 10) {
            data.workbookResponses[key] = value;
          }
        }
      }

      // Check for messaging strategy
      const messagingStrategy = localStorage.getItem('generated-messaging-strategy');
      if (messagingStrategy) {
        try {
          const parsed = JSON.parse(messagingStrategy);
          data.messagingStrategy = parsed.content || messagingStrategy;
        } catch {
          data.messagingStrategy = messagingStrategy;
        }
      }

      // Check for completed sections
      const completedSections = localStorage.getItem('completedSections');
      if (completedSections) {
        try {
          data.completedSections = JSON.parse(completedSections);
        } catch {
          data.completedSections = [];
        }
      }

      // Determine if migration is needed
      const hasLocalData = Object.keys(data.workbookResponses).length > 0 || data.messagingStrategy;
      
      if (hasLocalData && !hasExistingData && !isCheckingData) {
        setLocalStorageData(data);
        setShowPrompt(true);
      }
    };

    checkLocalStorageData();
  }, [hasExistingData, isCheckingData]);

  const handleMigrate = () => {
    if (!localStorageData) return;

    migrateData.mutate(localStorageData, {
      onSuccess: () => {
        setShowPrompt(false);
        onMigrationComplete?.();
      },
      onError: (error) => {
        console.error('Migration failed:', error);
      }
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Mark as dismissed so we don't show again
    localStorage.setItem('migration-dismissed', 'true');
  };

  // Don't show if user dismissed or no data to migrate
  if (!showPrompt || isCheckingData || localStorage.getItem('migration-dismissed')) {
    return null;
  }

  const responseCount = Object.keys(localStorageData?.workbookResponses || {}).length;
  const hasStrategy = !!localStorageData?.messagingStrategy;

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Database className="h-5 w-5" />
          Sync Your Data Across Devices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              We found {responseCount} workbook responses{hasStrategy ? ' and your messaging strategy' : ''} 
              stored locally on this device. Would you like to sync this data to your account so you can 
              access it from any device?
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleMigrate}
              disabled={migrateData.isPending}
              className="flex items-center gap-2"
            >
              {migrateData.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Yes, Sync My Data
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              disabled={migrateData.isPending}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Keep Local Only
            </Button>
          </div>

          <p className="text-sm text-slate-600">
            Syncing your data enables access from multiple devices and provides backup protection. 
            Your local data will remain as a backup.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
