import { useAuth } from "@/hooks/useAuth";
import { useMessagingStrategyManager } from "@/hooks/useMessagingStrategy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, FileText, Loader2, Upload, Copy, FileDown, FileType } from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

function FormattedMessagingStrategy({ content }: { content: string }) {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Skip separator lines (---)
      if (line.trim() === '---' || line.trim() === '---' || line.trim().match(/^-{3,}$/)) {
        return null;
      }
      
      // Handle main headers (# Header) - MESSAGING STRATEGY with darker coral color
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-lg font-bold mt-8 mb-4 pb-2" style={{ color: 'rgba(235, 150, 140, 255)' }}>
            {line.replace('# ', '')}
          </h1>
        );
      }
      
      // Handle subheaders (## Header) - with circular number badges
      if (line.startsWith('## ')) {
        const headerText = line.replace('## ', '');
        // Check if it starts with a number (e.g., "1. CORE PROMISE")
        const numberMatch = headerText.match(/^(\d+)\.\s+(.+)$/);
        
        if (numberMatch) {
          const number = numberMatch[1];
          const title = numberMatch[2];
          
          return (
            <h2 key={index} className="flex items-center gap-3 mt-6 mb-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: '#689cf2' }}>
                {number}
              </span>
              <span className="text-base font-bold text-slate-900">{title}</span>
            </h2>
          );
        }
        
        // Regular subheader without number
        return (
          <h2 key={index} className="text-base font-bold text-slate-900 mt-6 mb-3">
            {headerText}
          </h2>
        );
      }
      
      // Handle section headers (### Header)
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-sm font-semibold text-slate-900 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      
      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="text-slate-700 mb-2 leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
            )}
          </p>
        );
      }
      
      // Handle bullet points
      if (line.trim().startsWith('- ')) {
        return (
          <li key={index} className="text-slate-700 ml-4 mb-1 leading-relaxed">
            {line.trim().replace('- ', '')}
          </li>
        );
      }
      
      // Handle numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li key={index} className="text-slate-700 ml-4 mb-1 leading-relaxed list-decimal">
            {line.trim().replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Regular text
      return (
        <p key={index} className="text-slate-700 mb-2 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return <div className="space-y-1">{formatContent(content)}</div>;
}

export default function MessagingStrategyResults() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const memoizedUserId = useMemo(() => {
    return user?.id ? Number(user.id) : 0;
  }, [user?.id]);

  const {
    activeStrategy,
    isLoading: isLoadingStrategy,
  } = useMessagingStrategyManager(memoizedUserId);

  // Helper function to strip markdown formatting for plain text
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/^#{1,6}\s+/gm, '') // Remove headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/^-{3,}$/gm, '') // Remove separators
      .trim();
  };

  // Copy to Clipboard handler
  const handleCopyToClipboard = async () => {
    if (!activeStrategy?.content) return;
    
    try {
      const plainText = stripMarkdown(activeStrategy.content);
      await navigator.clipboard.writeText(plainText);
      toast({
        title: "Copied!",
        description: "Messaging strategy copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Download DOCX handler
  const handleDownloadDOCX = async () => {
    if (!activeStrategy?.content) return;

    try {
      const lines = activeStrategy.content.split('\n');
      const children: Paragraph[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip separator lines
        if (trimmedLine.match(/^-{3,}$/)) continue;
        
        // Main header (# Header)
        if (line.startsWith('# ')) {
          children.push(
            new Paragraph({
              text: line.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );
        }
        // Subheader (## Header)
        else if (line.startsWith('## ')) {
          children.push(
            new Paragraph({
              text: line.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            })
          );
        }
        // Section header (### Header)
        else if (line.startsWith('### ')) {
          children.push(
            new Paragraph({
              text: line.replace('### ', ''),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            })
          );
        }
        // Bullet points
        else if (trimmedLine.startsWith('- ')) {
          children.push(
            new Paragraph({
              text: trimmedLine.replace('- ', ''),
              bullet: { level: 0 },
              spacing: { before: 50, after: 50 },
            })
          );
        }
        // Numbered lists
        else if (/^\d+\.\s/.test(trimmedLine)) {
          children.push(
            new Paragraph({
              text: trimmedLine.replace(/^\d+\.\s/, ''),
              numbering: { reference: "default-numbering", level: 0 },
              spacing: { before: 50, after: 50 },
            })
          );
        }
        // Regular text with bold formatting
        else if (trimmedLine && !trimmedLine.match(/^-{3,}$/)) {
          const textRuns: TextRun[] = [];
          const parts = trimmedLine.split('**');
          parts.forEach((part: string, index: number) => {
            if (part) {
              textRuns.push(
                new TextRun({
                  text: part,
                  bold: index % 2 === 1,
                })
              );
            }
          });
          
          children.push(
            new Paragraph({
              children: textRuns,
              spacing: { before: 100, after: 100 },
            })
          );
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${activeStrategy.title || 'Messaging-Strategy'}.docx`);
      
      toast({
        title: "Success!",
        description: "DOCX file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate DOCX file",
        variant: "destructive",
      });
    }
  };

  // Download PDF handler
  const handleDownloadPDF = async () => {
    if (!activeStrategy?.content) return;

    try {
      const pdf = new jsPDF();
      const lines = activeStrategy.content.split('\n');
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip separator lines
        if (trimmedLine.match(/^-{3,}$/)) continue;
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Main header
        if (line.startsWith('# ')) {
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('# ', '');
          const splitText = pdf.splitTextToSize(text, maxWidth);
          pdf.text(splitText, margin, yPosition);
          yPosition += splitText.length * 10 + 5;
        }
        // Subheader
        else if (line.startsWith('## ')) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('## ', '');
          const splitText = pdf.splitTextToSize(text, maxWidth);
          pdf.text(splitText, margin, yPosition);
          yPosition += splitText.length * 8 + 4;
        }
        // Section header
        else if (line.startsWith('### ')) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('### ', '');
          const splitText = pdf.splitTextToSize(text, maxWidth);
          pdf.text(splitText, margin, yPosition);
          yPosition += splitText.length * 7 + 3;
        }
        // Regular text
        else if (trimmedLine) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const plainText = trimmedLine.replace(/\*\*(.+?)\*\*/g, '$1');
          const splitText = pdf.splitTextToSize(plainText, maxWidth);
          pdf.text(splitText, margin, yPosition);
          yPosition += splitText.length * 6 + 2;
        }
      }

      pdf.save(`${activeStrategy.title || 'Messaging-Strategy'}.pdf`);
      
      toast({
        title: "Success!",
        description: "PDF file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF file",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoadingAuth || isLoadingStrategy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-coral-600" />
                <p className="text-slate-600">Loading your messaging strategy...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show empty state if no strategy exists
  if (!activeStrategy || !activeStrategy.content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-slate-400" />
                <div>
                  <CardTitle>No Messaging Strategy Yet</CardTitle>
                  <CardDescription>
                    You haven't generated a messaging strategy yet. Complete the questions and generate your strategy first.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/step/1">
                <Button className="bg-coral-600 hover:bg-coral-700 text-white" data-testid="button-generate-strategy">
                  Go to Strategic Messaging
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <div className="mt-6 flex justify-center">
            <Link href="/step/1">
              <Button size="sm" data-testid="button-back-to-messaging" style={{ backgroundColor: '#689cf2', color: 'white' }} className="hover:opacity-90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Messaging Strategy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Display the messaging strategy
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader className="border-b border-coral-100 bg-gradient-to-r from-coral-50 to-orange-50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-coral-600" />
                <div>
                  <CardTitle className="text-2xl" data-testid="text-strategy-title">
                    {activeStrategy.title || "Your Messaging Strategy"}
                  </CardTitle>
                  <CardDescription>
                    Your comprehensive messaging strategy
                  </CardDescription>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm" 
                    data-testid="button-export-document"
                    style={{ backgroundColor: '#689cf2', color: 'white' }} 
                    className="hover:opacity-90"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Export Document
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={handleCopyToClipboard} 
                    data-testid="menu-copy-clipboard"
                    className="hover:bg-slate-100 focus:bg-slate-100"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDownloadDOCX} 
                    data-testid="menu-download-docx"
                    className="hover:bg-slate-100 focus:bg-slate-100"
                  >
                    <FileType className="w-4 h-4 mr-2" />
                    Download DOCX
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDownloadPDF} 
                    data-testid="menu-download-pdf"
                    className="hover:bg-slate-100 focus:bg-slate-100"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <div className="prose prose-lg max-w-none" data-testid="content-messaging-strategy">
              <FormattedMessagingStrategy content={activeStrategy.content} />
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 flex justify-center">
          <Link href="/step/1#workbook-section-0">
            <Button size="sm" data-testid="button-back-to-messaging" style={{ backgroundColor: '#689cf2', color: 'white' }} className="hover:opacity-90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Messaging Strategy
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
