import { useEffect, useRef } from "react";
import { Textarea } from "./textarea";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/utils";

interface AutoExpandingTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export function AutoExpandingTextarea({
  minRows = 3,
  maxRows = 20,
  className,
  value,
  onChange,
  ...props
}: AutoExpandingTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    adjustHeight();
  }, []);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        adjustHeight();
      }}
      className={cn("resize-none overflow-y-auto", className)}
      {...props}
    />
  );
}
