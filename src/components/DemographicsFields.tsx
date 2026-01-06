import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

// Demographics Fields Component with local state to fix spacebar issue
export function DemographicsFields({
  promptKey,
  currentValue,
  onUpdate,
}: {
  promptKey: string;
  currentValue: string;
  onUpdate: (value: string) => void;
}) {
  const fields = [
    { label: "Age Range", key: "ageRange" },
    { label: "Gender", key: "gender" },
    { label: "Income Level", key: "incomeLevel" },
    { label: "Job Title or Role", key: "jobTitle" },
    { label: "Relationship Status", key: "relationshipStatus" },
    { label: "Children", key: "children" },
  ];

  // Helper to extract field value from combined string
  const extractFieldValue = (
    responseText: string,
    fieldLabel: string
  ): string => {
    if (!responseText) return "";
    const lines = responseText.split("\n");
    for (const line of lines) {
      if (line.includes(fieldLabel + ":")) {
        return line.split(fieldLabel + ":")[1]?.trim() || "";
      }
    }
    return "";
  };

  // Initialize local state from current value
  const [localFields, setLocalFields] = useState<{ [key: string]: string }>(
    () => {
      const initial: { [key: string]: string } = {};
      fields.forEach((field) => {
        initial[field.label] = extractFieldValue(currentValue, field.label);
      });
      return initial;
    }
  );

  // Sync local state when currentValue changes externally (e.g., from prefill)
  useEffect(() => {
    const newFields: { [key: string]: string } = {};
    fields.forEach((field) => {
      newFields[field.label] = extractFieldValue(currentValue, field.label);
    });
    setLocalFields(newFields);
  }, [currentValue]);

  // Debounced update to parent
  const debouncedUpdate = useRef<NodeJS.Timeout | null>(null);

  const updateParent = useCallback(
    (updatedFields: { [key: string]: string }) => {
      // Construct the combined string
      let result = "";
      fields.forEach((field) => {
        result += `${field.label}: ${updatedFields[field.label] || ""}\n`;
      });
      onUpdate(result.trim());
    },
    [onUpdate]
  );

  const handleFieldChange = (fieldLabel: string, value: string) => {
    // Update local state immediately for responsive UI
    const updatedFields = { ...localFields, [fieldLabel]: value };
    setLocalFields(updatedFields);

    // Debounce parent update to avoid too many writes
    if (debouncedUpdate.current) {
      clearTimeout(debouncedUpdate.current);
    }
    debouncedUpdate.current = setTimeout(() => {
      updateParent(updatedFields);
    }, 300);
  };

  const handleFieldBlur = () => {
    // Update parent immediately on blur
    if (debouncedUpdate.current) {
      clearTimeout(debouncedUpdate.current);
    }
    updateParent(localFields);
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {field.label}:
          </label>
          <Input
            value={localFields[field.label] || ""}
            onChange={(e) => handleFieldChange(field.label, e.target.value)}
            onBlur={handleFieldBlur}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            className="text-sm md:text-base"
          />
        </div>
      ))}
    </div>
  );
}

