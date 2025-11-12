import { toast } from "@/hooks/use-toast";

export interface PrerequisiteValidationResult {
  isValid: boolean;
  missingItems: string[];
}

/**
 * Validates that required prerequisite documents exist before content generation
 * @param requirements - Object specifying which prerequisites are needed
 * @param data - Object containing the actual data to validate
 * @returns Validation result with missing items
 */
export function validatePrerequisites(
  requirements: {
    messagingStrategy?: boolean;
    offerOutline?: boolean;
    offerResponses?: boolean;
  },
  data: {
    messagingStrategy?: any;
    offerOutline?: any;
    offerResponses?: any;
  }
): PrerequisiteValidationResult {
  const missingItems: string[] = [];

  if (requirements.messagingStrategy) {
    if (!data.messagingStrategy || Object.keys(data.messagingStrategy).length === 0) {
      missingItems.push("Messaging Strategy");
    }
  }

  if (requirements.offerOutline) {
    if (!data.offerOutline || Object.keys(data.offerOutline).length === 0) {
      missingItems.push("Offer Outline");
    }
  }

  if (requirements.offerResponses) {
    if (!data.offerResponses || Object.keys(data.offerResponses).length === 0) {
      missingItems.push("Offer Creation Responses");
    }
  }

  return {
    isValid: missingItems.length === 0,
    missingItems
  };
}

/**
 * Shows a toast notification for missing prerequisites
 * @param missingItems - Array of missing prerequisite names
 * @param customMessage - Optional custom message override
 */
export function showPrerequisiteToast(missingItems: string[], customMessage?: string) {
  const defaultMessage = missingItems.length === 1
    ? `Please complete your ${missingItems[0]} first to generate this content.`
    : `Please complete the following first: ${missingItems.join(", ")}.`;

  toast({
    title: "Missing Required Information",
    description: customMessage || defaultMessage,
    variant: "destructive",
  });
}

/**
 * Validates prerequisites and shows toast if validation fails
 * @returns true if valid, false if invalid (toast shown automatically)
 */
export function validateAndNotify(
  requirements: {
    messagingStrategy?: boolean;
    offerOutline?: boolean;
    offerResponses?: boolean;
  },
  data: {
    messagingStrategy?: any;
    offerOutline?: any;
    offerResponses?: any;
  },
  customMessage?: string
): boolean {
  const result = validatePrerequisites(requirements, data);
  
  if (!result.isValid) {
    showPrerequisiteToast(result.missingItems, customMessage);
    return false;
  }
  
  return true;
}
