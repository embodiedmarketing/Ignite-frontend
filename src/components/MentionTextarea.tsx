import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect, forwardRef } from "react";
import { Card } from "@/components/ui/card";

interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface MentionTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ value, onChange, ...props }, ref) => {
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: users = [] } = useQuery<User[]>({
      queryKey: ['/api/forum/users/search', mentionQuery],
      queryFn: () => 
        fetch(`/api/forum/users/search?q=${encodeURIComponent(mentionQuery)}`, {
          credentials: 'include'
        }).then(res => res.json()),
      enabled: showMentions,
    });

    // Find @ symbol before cursor and extract query
    const checkForMention = (text: string, position: number) => {
      const textBeforeCursor = text.substring(0, position);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbol === -1) {
        setShowMentions(false);
        return;
      }

      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      const hasWhitespace = /\s/.test(textAfterAt);

      if (hasWhitespace) {
        setShowMentions(false);
        return;
      }

      setMentionQuery(textAfterAt);
      setShowMentions(true);
      setSelectedIndex(0);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const position = e.target.selectionStart || 0;
      
      onChange(newValue);
      setCursorPosition(position);
      checkForMention(newValue, position);
    };

    const insertMention = (user: User) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const textBeforeCursor = value.substring(0, cursorPosition);
      const textAfterCursor = value.substring(cursorPosition);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

      if (lastAtSymbol === -1) return;

      // Create mention string using firstName, lastName, or email username
      let mentionText = '';
      if (user.firstName) {
        mentionText = user.firstName;
      } else {
        mentionText = user.email.split('@')[0];
      }

      const beforeAt = value.substring(0, lastAtSymbol);
      const newValue = beforeAt + '@' + mentionText + ' ' + textAfterCursor;
      const newCursorPos = (beforeAt + '@' + mentionText + ' ').length;

      onChange(newValue);
      setShowMentions(false);
      setMentionQuery("");

      // Set cursor position after mention
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showMentions || users.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(users[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          !textareaRef.current?.contains(e.target as Node)
        ) {
          setShowMentions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getUserDisplayName = (user: User) => {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        return user.firstName;
      } else {
        return user.email;
      }
    };

    const getMentionHandle = (user: User) => {
      if (user.firstName) {
        return user.firstName;
      } else {
        return user.email.split('@')[0];
      }
    };

    return (
      <div className="relative">
        <Textarea
          ref={(node) => {
            // @ts-ignore
            textareaRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          {...props}
        />

        {showMentions && users.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute bottom-full left-0 mb-2 w-72 max-h-64 overflow-hidden z-50 bg-white rounded-lg shadow-2xl border border-slate-200"
            data-testid="mention-dropdown"
          >
            <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="text-orange-600">@</span>
                Mention someone
              </p>
            </div>
            <div className="overflow-y-auto max-h-56 py-1">
              {users.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  className={`w-full text-left px-3 py-2.5 transition-all duration-150 ${
                    index === selectedIndex 
                      ? 'bg-gradient-to-r from-orange-50 to-pink-50 border-l-3 border-orange-500' 
                      : 'hover:bg-slate-50 border-l-3 border-transparent'
                  }`}
                  onClick={() => insertMention(user)}
                  data-testid={`mention-option-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm ${
                      index % 5 === 0 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                      index % 5 === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      index % 5 === 2 ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      index % 5 === 3 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                      'bg-gradient-to-br from-pink-400 to-pink-500'
                    }`}>
                      {user.firstName?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        @{getMentionHandle(user)}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">↵</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MentionTextarea.displayName = "MentionTextarea";
