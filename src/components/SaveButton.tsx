import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/utils/utils';

export type SaveButtonState = 'idle' | 'saving' | 'success' | 'error';

interface SaveButtonProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
  isDirty?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  useDarkerCoral?: boolean;
  customBackgroundColor?: string;
}

export function SaveButton({ 
  onSave, 
  disabled = false, 
  isDirty = false, 
  className,
  size = 'sm',
  useDarkerCoral = false,
  customBackgroundColor
}: SaveButtonProps) {
  const [state, setState] = useState<SaveButtonState>('idle');

  const handleSave = async () => {
    if (disabled || state === 'saving') return;

    console.log('[SAVE BUTTON] Save button clicked:', {
      disabled,
      state,
      isDirty,
      timestamp: new Date().toISOString()
    });

    setState('saving');
    try {
      await onSave();
      setState('success');
      
      console.log('[SAVE BUTTON] Save successful');
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState('idle');
      }, 2000);
    } catch (error: any) {
      setState('error');
      console.error('[SAVE BUTTON] Save failed:', error);
      
      // Log detailed error information for debugging
      console.error('[SAVE BUTTON] Save error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        timestamp: new Date().toISOString()
      });
      
      // Reset to idle after 4 seconds for errors (longer so user can see)
      setTimeout(() => {
        setState('idle');
      }, 4000);
    }
  };

  const handleRetry = () => {
    if (state === 'error') {
      handleSave();
    }
  };

  // Handle keyboard shortcut (Ctrl+S)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'saving':
        return (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </>
        );
      case 'success':
        return (
          <>
            <Check className="h-3 w-3" />
            Saved
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-3 w-3" />
            Retry
          </>
        );
      default:
        return (
          <>
            <Save className="h-3 w-3" />
            Save
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (state) {
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return isDirty ? 'default' : 'outline' as const;
    }
  };

  const getButtonClassName = () => {
    const baseClasses = 'gap-1.5 font-medium transition-all';
    const coralBg = useDarkerCoral ? 'bg-coral-700' : 'bg-embodied-coral';
    const coralHover = useDarkerCoral ? 'hover:bg-coral-800' : 'hover:bg-embodied-orange';
    
    // If custom background color is provided, don't add background classes
    if (customBackgroundColor) {
      switch (state) {
        case 'saving':
          return cn(baseClasses, 'cursor-not-allowed opacity-70 text-white');
        case 'success':
          return cn(baseClasses, 'bg-green-600 hover:bg-green-700 text-white');
        case 'error':
          return cn(baseClasses, 'bg-red-600 hover:bg-red-700');
        default:
          return cn(baseClasses, 'text-white');
      }
    }
    
    switch (state) {
      case 'saving':
        return cn(baseClasses, `cursor-not-allowed opacity-70 ${coralBg} text-white`);
      case 'success':
        return cn(baseClasses, 'bg-green-600 hover:bg-green-700 text-white');
      case 'error':
        return cn(baseClasses, 'bg-red-600 hover:bg-red-700');
      default:
        if (isDirty) {
          return cn(baseClasses, `${coralBg} ${coralHover} text-white`);
        }
        return cn(baseClasses, `${coralBg} ${coralHover} text-white`);
    }
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[SAVE BUTTON] Button clicked, state:', state);
        if (state === 'error') {
          handleRetry();
        } else {
          handleSave();
        }
      }}
      disabled={disabled || state === 'saving'}
      onKeyDown={handleKeyDown}
      className={cn(getButtonClassName(), className)}
      style={customBackgroundColor && state !== 'success' && state !== 'error' ? { backgroundColor: customBackgroundColor } : undefined}
      title={
        state === 'error' 
          ? 'Click to retry save'
          : isDirty 
            ? 'Save changes (Ctrl+S)' 
            : 'No changes to save'
      }
    >
      {getButtonContent()}
    </Button>
  );
}
