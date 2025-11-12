import { Paperclip, Download, FileText, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "isomorphic-dompurify";

interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

interface RichContentDisplayProps {
  content: string;
  attachments?: Attachment[] | null;
}

export default function RichContentDisplay({ content, attachments }: RichContentDisplayProps) {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'b', 'i'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return VideoIcon;
    return FileText;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Rich Text Content */}
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        data-testid="rich-content-display"
      />

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Attachments ({attachments.length})
          </p>
          <div className="space-y-2">
            {attachments.map((attachment, index) => {
              const Icon = getFileIcon(attachment.mimeType);
              
              // Display images inline
              if (isImage(attachment.mimeType)) {
                return (
                  <div key={index} className="space-y-2" data-testid={`attachment-${index}`}>
                    <img 
                      src={attachment.dataUrl} 
                      alt={attachment.filename}
                      className="max-w-full h-auto rounded-lg border border-slate-200"
                      data-testid={`attachment-image-${index}`}
                    />
                    <div className="flex items-center justify-between bg-slate-50 border rounded px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-900">{attachment.filename}</span>
                        <span className="text-slate-500">({formatFileSize(attachment.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        data-testid={`button-download-attachment-${index}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              }
              
              // Display videos inline
              if (isVideo(attachment.mimeType)) {
                return (
                  <div key={index} className="space-y-2" data-testid={`attachment-${index}`}>
                    <video 
                      controls 
                      className="max-w-full h-auto rounded-lg border border-slate-200"
                      data-testid={`attachment-video-${index}`}
                    >
                      <source src={attachment.dataUrl} type={attachment.mimeType} />
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex items-center justify-between bg-slate-50 border rounded px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-900">{attachment.filename}</span>
                        <span className="text-slate-500">({formatFileSize(attachment.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        data-testid={`button-download-attachment-${index}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              }
              
              // Display other files as download links
              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 border rounded px-3 py-2 text-sm hover:bg-slate-100 transition-colors"
                  data-testid={`attachment-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-900">{attachment.filename}</span>
                    <span className="text-slate-500">({formatFileSize(attachment.size)})</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    data-testid={`button-download-attachment-${index}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
