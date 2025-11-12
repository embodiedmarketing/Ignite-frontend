import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Save, Loader2, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/utils/utils";
import { useSaveStatus } from "@/hooks/useSaveStatus";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManualSaveButtonProps {
  onSave: () => Promise<void>;
  saveKey?: string; // Unique identifier for this save operation
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showStatus?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const ManualSaveButton: React.FC<ManualSaveButtonProps> = ({
  onSave,
  saveKey = 'manual-save',
  className,
  variant = "default",
  size = "default",
  showStatus = true,
  disabled = false,
  children
}) => {
  const { getSaveStatus, manualSave } = useSaveStatus();
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  
  const operation = getSaveStatus(saveKey);
  const status = operation?.status || 'idle';
  const isSaving = status === 'saving' || isLocalSaving;
  const hasError = status === 'error';
  const isSaved = status === 'saved';
  
  const handleSave = async () => {
    if (isSaving || disabled) return;
    
    try {
      setIsLocalSaving(true);
      await manualSave(saveKey, onSave);
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsLocalSaving(false);
    }
  };

  const getIcon = () => {
    if (isSaving) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isSaved && showStatus) return <Check className="h-4 w-4" />;
    if (hasError && showStatus) return <AlertTriangle className="h-4 w-4" />;
    return <Save className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (children) return children;
    if (isSaving) return 'Saving...';
    if (isSaved && showStatus) return 'Saved';
    if (hasError && showStatus) return 'Retry Save';
    return 'Save';
  };

  const getButtonVariant = () => {
    if (hasError) return 'destructive' as const;
    if (isSaved && showStatus) return 'outline' as const;
    return variant;
  };

  const button = (
    <Button
      onClick={handleSave}
      disabled={disabled || (isSaving && !hasError)}
      variant={getButtonVariant()}
      size={size}
      className={cn(
        "transition-all duration-200",
        isSaved && showStatus && "text-green-600 border-green-200",
        className
      )}
    >
      {getIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  );

  if (operation?.error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-sm">
              Error: {operation.error.message}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

// Save All Button - for bulk operations
interface SaveAllButtonProps {
  onSaveAll: () => Promise<void>;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const SaveAllButton: React.FC<SaveAllButtonProps> = ({
  onSaveAll,
  className,
  disabled = false,
  children
}) => {
  const { hasUnsavedChanges, manualSaveAll, globalSaveState } = useSaveStatus();
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  
  const hasChanges = hasUnsavedChanges();
  const isSaving = globalSaveState.status === 'saving' || isLocalSaving;
  const hasError = globalSaveState.status === 'error';
  const isSaved = globalSaveState.status === 'saved';
  
  const handleSaveAll = async () => {
    if (isSaving || disabled || !hasChanges) return;
    
    try {
      setIsLocalSaving(true);
      await manualSaveAll(onSaveAll);
    } catch (error) {
      console.error('Save all failed:', error);
    } finally {
      setIsLocalSaving(false);
    }
  };

  const getIcon = () => {
    if (isSaving) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isSaved) return <Check className="h-4 w-4" />;
    if (hasError) return <RefreshCw className="h-4 w-4" />;
    return <Save className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (children) return children;
    if (isSaving) return 'Saving All...';
    if (isSaved) return 'All Saved';
    if (hasError) return 'Retry All';
    if (!hasChanges) return 'No Changes';
    return 'Save All';
  };

  const getButtonVariant = () => {
    if (hasError) return 'destructive' as const;
    if (isSaved) return 'outline' as const;
    if (!hasChanges) return 'ghost' as const;
    return 'default' as const;
  };

  const button = (
    <Button
      onClick={handleSaveAll}
      disabled={disabled || isSaving || !hasChanges}
      variant={getButtonVariant()}
      className={cn(
        "transition-all duration-200",
        isSaved && "text-green-600 border-green-200",
        !hasChanges && "opacity-50",
        className
      )}
    >
      {getIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  );

  if (globalSaveState.error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-sm">
              Error: {globalSaveState.error.message}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

// Quick Save floating action button
interface QuickSaveButtonProps {
  onSave: () => Promise<void>;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const QuickSaveButton: React.FC<QuickSaveButtonProps> = ({
  onSave,
  className,
  position = 'bottom-right'
}) => {
  const { hasUnsavedChanges } = useSaveStatus();
  
  if (!hasUnsavedChanges()) return null;

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={cn(
      "fixed z-50",
      positionClasses[position],
      className
    )}>
      <ManualSaveButton
        onSave={onSave}
        saveKey="quick-save"
        variant="default"
        className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        Quick Save
      </ManualSaveButton>
    </div>
  );
};

export default ManualSaveButton;
