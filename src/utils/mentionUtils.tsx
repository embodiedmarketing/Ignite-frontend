/**
 * Parse text and highlight @mentions
 * Matches the backend regex: /@([a-zA-Z0-9._'-]{2,30})/g
 */
export function parseAndHighlightMentions(text: string) {
  const mentionRegex = /@([a-zA-Z0-9._'-]{2,30})/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the highlighted mention
    parts.push(
      <span
        key={`mention-${keyCounter++}`}
        className="text-blue-600 font-medium bg-blue-50 px-1 rounded"
        data-mention={match[1]}
      >
        @{match[1]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Component to render text with highlighted @mentions
 */
interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className = "" }: MentionTextProps) {
  const parts = parseAndHighlightMentions(text);
  
  return (
    <span className={className}>
      {parts}
    </span>
  );
}
