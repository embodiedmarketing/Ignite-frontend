import React from 'react';
import { cn } from "@/utils/utils";
import { Loader2, Check, AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useSaveStatus, type SaveStatus, type SaveOperation } from "@/hooks/useSaveStatus";

interface SaveStatusIndicatorProps {
  className?: string;
  itemKey?: string; // Show status for specific item
  showGlobalStatus?: boolean; // Show global save status
  showMessage?: boolean;
  compact?: boolean;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  className,
  itemKey,
  showGlobalStatus = true,
  showMessage = true,
  compact = false
}) => {
  const { globalSaveState, getSaveStatus, retryFailedSave } = useSaveStatus();
  
  // Determine which status to show
  const operation = itemKey ? getSaveStatus(itemKey) : null;
  const status = operation?.status || (showGlobalStatus ? globalSaveState.status : 'idle');
  const message = operation?.message || (showGlobalStatus ? globalSaveState.message : '');
  const error = operation?.error || globalSaveState.error;
  const lastSaved = globalSaveState.lastSaved;
  
  const getStatusIcon = (status: SaveStatus) => {
    switch (status) {
      case 'saving':
        return <Loader2 className={cn("animate-spin", compact ? "h-3 w-3" : "h-4 w-4")} />;
      case 'saved':
        return <Check className={cn("text-green-600", compact ? "h-3 w-3" : "h-4 w-4")} />;
      case 'error':
        return <AlertTriangle className={cn("text-red-600", compact ? "h-3 w-3" : "h-4 w-4")} />;
      case 'conflict':
        return <RefreshCw className={cn("text-yellow-600", compact ? "h-3 w-3" : "h-4 w-4")} />;
      case 'offline':
        return <WifiOff className={cn("text-gray-600", compact ? "h-3 w-3" : "h-4 w-4")} />;
      default:
        return <Wifi className={cn("text-gray-400", compact ? "h-3 w-3" : "h-4 w-4")} />;
    }
  };

  const getStatusColor = (status: SaveStatus) => {
    switch (status) {
      case 'saving':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'saved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'conflict':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'offline':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  const handleRetry = async () => {
    if (itemKey && status === 'error') {
      try {
        await retryFailedSave(itemKey);
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  };

  const formatLastSaved = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (status === 'idle' && !compact) return null;

  const content = (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-md border transition-all duration-200",
      getStatusColor(status),
      compact && "px-2 py-0.5 text-xs",
      className
    )}>
      {getStatusIcon(status)}
      
      {showMessage && message && (
        <span className={cn(
          "text-sm font-medium",
          compact && "text-xs"
        )}>
          {message}
        </span>
      )}
      
      {status === 'saved' && lastSaved && (
        <span className={cn(
          "text-xs text-gray-500",
          compact && "hidden"
        )}>
          {formatLastSaved(lastSaved)}
        </span>
      )}
      
      {status === 'error' && itemKey && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRetry}
          className={cn(
            "h-6 px-2 text-xs",
            compact && "h-4 px-1"
          )}
        >
          Retry
        </Button>
      )}
    </div>
  );

  if (error || (status === 'error' && message)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-sm">
              {error?.message || message}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

// Global save status bar component
export const GlobalSaveStatusBar: React.FC<{ className?: string }> = ({ className }) => {
  const { globalSaveState, getFailedSaves, clearAllSaveStatus } = useSaveStatus();
  const failedSaves = getFailedSaves();
  
  if (globalSaveState.status === 'idle') return null;
  
  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50",
      className
    )}>
      <div className="flex items-center gap-2">
        <SaveStatusIndicator 
          showGlobalStatus={true}
          showMessage={true}
        />
        
        {failedSaves.length > 0 && (
          <Badge variant="destructive">
            {failedSaves.length} failed
          </Badge>
        )}
        
        {(globalSaveState.status === 'saved' || failedSaves.length > 0) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearAllSaveStatus}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

// Field-level save status indicator
export const FieldSaveStatus: React.FC<{
  fieldKey: string;
  className?: string;
}> = ({ fieldKey, className }) => {
  return (
    <SaveStatusIndicator
      itemKey={fieldKey}
      showGlobalStatus={false}
      compact={true}
      className={className}
    />
  );
};

export default SaveStatusIndicator;
