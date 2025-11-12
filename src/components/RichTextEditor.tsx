import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  List, 
  ListOrdered, 
  Image as ImageIcon,
  Paperclip
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAttachmentsChange?: (attachments: File[]) => void;
  placeholder?: string;
  minHeight?: string;
}

export interface RichTextEditorRef {
  focus: () => void;
  clear: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, onAttachmentsChange, placeholder = "Write your message...", minHeight = "200px" }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const isTyping = useRef(false);

    // Sync external value changes to editor (but not while user is typing)
    useEffect(() => {
      if (editorRef.current && !isTyping.current) {
        const currentHtml = editorRef.current.innerHTML;
        if (currentHtml !== value) {
          editorRef.current.innerHTML = value || "";
        }
      }
    }, [value]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      clear: () => {
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
          onChange("");
          setAttachedFiles([]);
          if (onAttachmentsChange) {
            onAttachmentsChange([]);
          }
        }
      }
    }));

    const execCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    };

    const handleInput = () => {
      isTyping.current = true;
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        onChange(html);
      }
      setTimeout(() => {
        isTyping.current = false;
      }, 100);
    };

    const insertLink = () => {
      if (linkUrl && linkText) {
        const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${linkText}</a>`;
        execCommand('insertHTML', linkHtml);
        setShowLinkDialog(false);
        setLinkUrl("");
        setLinkText("");
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newFiles = [...attachedFiles, ...files];
      setAttachedFiles(newFiles);
      if (onAttachmentsChange) {
        onAttachmentsChange(newFiles);
      }
    };

    const removeAttachment = (index: number) => {
      const newFiles = attachedFiles.filter((_, i) => i !== index);
      setAttachedFiles(newFiles);
      if (onAttachmentsChange) {
        onAttachmentsChange(newFiles);
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="bg-slate-50 border-b p-2 flex items-center gap-1 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            title="Bold"
            data-testid="button-format-bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            title="Italic"
            data-testid="button-format-italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
            data-testid="button-format-bullet-list"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
            data-testid="button-format-numbered-list"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkDialog(true)}
            title="Insert Link"
            data-testid="button-insert-link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Attach File"
            data-testid="button-attach-file"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-4 outline-none prose prose-sm max-w-none"
          style={{ minHeight }}
          data-placeholder={placeholder}
          data-testid="rich-text-editor-content"
        />

        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="border-t bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-medium text-slate-700">Attachments ({attachedFiles.length})</p>
            <div className="space-y-1">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white border rounded px-3 py-2 text-sm"
                  data-testid={`attachment-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-900">{file.name}</span>
                    <span className="text-slate-500">({formatFileSize(file.size)})</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    data-testid={`button-remove-attachment-${index}`}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          data-testid="file-input"
        />

        {/* Link Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
              <DialogDescription>
                Add a link to your post
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="link-text">Link Text</Label>
                <Input
                  id="link-text"
                  placeholder="Enter the text to display"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  data-testid="input-link-text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  data-testid="input-link-url"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl("");
                  setLinkText("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={insertLink}
                disabled={!linkUrl || !linkText}
                data-testid="button-insert-link-confirm"
              >
                Insert Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
