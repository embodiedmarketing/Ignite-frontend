import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Download, FileText, Calendar, User, Eye, Edit3, Loader2, AlertCircle, Save, X } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import type { MessagingStrategy, UserOfferOutline, IgniteDocument } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/services/queryClient';

type IGNITEDocument = {
  id: number;
  type: 'messaging' | 'tripwire' | 'core' | 'content_strategy' | 'content_ideas' | 'lead_generation' | 'email_sequence' | 'video_scripts' | 'launch_registration_funnel' | 'sales_page' | 'launch_email_sequence' | 'funnel_optimization' | 'interview_transcript' | 'messaging_strategy';
  title: string;
  content: string;
  createdAt: Date;
  editLink: string;
};

export default function CompletedIgniteDocs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IGNITEDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  const { data: strategies, isLoading: strategiesLoading, error: strategiesError } = useQuery<MessagingStrategy[]>({
    queryKey: ['/api/messaging-strategies/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/messaging-strategies/user/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messaging strategies');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: offerOutlines, isLoading: outlinesLoading, error: outlinesError } = useQuery<UserOfferOutline[]>({
    queryKey: ['/api/user-offer-outlines/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/user-offer-outlines/user/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch offer outlines');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: igniteDocuments, isLoading: igniteDocsLoading, error: igniteDocsError } = useQuery<IgniteDocument[]>({
    queryKey: ['/api/ignite-docs/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/ignite-docs/user/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch IGNITE documents');
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Mutations for updating documents
  const updateMessagingStrategyMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      return await apiRequest('PUT', `/api/messaging-strategies/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messaging-strategies/user', user?.id] });
      toast({ title: "Document updated successfully!" });
      setEditingDocId(null);
      setEditedContent('');
    },
    onError: () => {
      toast({ title: "Failed to update document", variant: "destructive" });
    }
  });

  const updateOfferOutlineMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      return await apiRequest('PUT', `/api/user-offer-outlines/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-offer-outlines/user', user?.id] });
      toast({ title: "Document updated successfully!" });
      setEditingDocId(null);
      setEditedContent('');
    },
    onError: () => {
      toast({ title: "Failed to update document", variant: "destructive" });
    }
  });

  const updateIgniteDocMutation = useMutation({
    mutationFn: async ({ id, contentMarkdown }: { id: number; contentMarkdown: string }) => {
      return await apiRequest('PUT', `/api/ignite-docs/${id}`, { contentMarkdown });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ignite-docs/user', user?.id] });
      toast({ title: "Document updated successfully!" });
      setEditingDocId(null);
      setEditedContent('');
    },
    onError: () => {
      toast({ title: "Failed to update document", variant: "destructive" });
    }
  });

  // Helper functions for editing
  const handleEditClick = (doc: IGNITEDocument) => {
    setEditingDocId(doc.id);
    setEditedContent(doc.content);
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setEditedContent('');
  };

  const handleSaveEdit = (doc: IGNITEDocument) => {
    if (doc.type === 'messaging') {
      updateMessagingStrategyMutation.mutate({ id: doc.id, content: editedContent });
    } else if (doc.type === 'tripwire' || doc.type === 'core') {
      updateOfferOutlineMutation.mutate({ id: doc.id, content: editedContent });
    } else {
      updateIgniteDocMutation.mutate({ id: doc.id, contentMarkdown: editedContent });
    }
  };

  // Combine all documents into a single array
  const documents: IGNITEDocument[] = [
    ...(strategies || []).map(s => {
      console.log('[IGNITE DOCS] Mapping messaging strategy:', {
        id: s.id,
        title: s.title,
        hasContent: !!s.content,
        contentLength: s.content?.length,
        createdAt: s.createdAt
      });
      return {
        id: s.id,
        type: 'messaging' as const,
        title: s.title || 'Messaging Strategy',
        content: s.content,
        createdAt: s.createdAt,
        editLink: '/step/1/strategy-results'
      };
    }),
    ...(offerOutlines || []).filter(o => o.title?.includes('Tripwire')).map(o => ({
      id: o.id,
      type: 'tripwire' as const,
      title: o.title || 'Tripwire Offer Outline',
      content: o.content,
      createdAt: o.createdAt,
      editLink: '/create-offer'
    })),
    ...(offerOutlines || []).filter(o => o.title?.includes('Core')).map(o => ({
      id: o.id,
      type: 'core' as const,
      title: o.title || 'Core Offer Outline',
      content: o.content,
      createdAt: o.createdAt,
      editLink: '/create-offer'
    })),
    ...(igniteDocuments || []).map(d => ({
      id: d.id,
      type: d.docType as 'content_strategy' | 'content_ideas' | 'lead_generation' | 'email_sequence' | 'video_scripts' | 'launch_registration_funnel' | 'sales_page' | 'launch_email_sequence' | 'funnel_optimization' | 'interview_transcript' | 'messaging_strategy',
      title: d.title || (d.docType === 'content_strategy' ? 'Content Strategy Plan' : d.docType === 'content_ideas' ? 'Content Ideas' : d.docType === 'email_sequence' ? 'Email Sequence' : d.docType === 'video_scripts' ? 'Video Script Generator' : d.docType === 'launch_registration_funnel' ? 'Launch Registration Funnel Copy' : d.docType === 'sales_page' ? 'Sales Page Copy' : d.docType === 'launch_email_sequence' ? 'Launch Email Sequence' : d.docType === 'funnel_optimization' ? 'Funnel Optimization Suggestions' : d.docType === 'interview_transcript' ? 'Interview Transcript' : d.docType === 'messaging_strategy' ? 'Messaging Strategy' : 'Copy Generation'),
      content: d.contentMarkdown,
      createdAt: d.createdAt,
      editLink: d.docType === 'lead_generation' ? '/step/4/build-strategy' : d.docType === 'email_sequence' ? '/building-your-strategy' : d.docType === 'video_scripts' ? '/launch-your-ads' : d.docType === 'launch_registration_funnel' ? '/launch-sales/strategy' : d.docType === 'sales_page' ? '/launch-sales/strategy' : d.docType === 'launch_email_sequence' ? '/launch-sales/strategy' : d.docType === 'funnel_optimization' ? '/track-optimize' : d.docType === 'interview_transcript' ? '/step/1/customer-research' : d.docType === 'messaging_strategy' ? '/step/1/strategy-results' : '/resources/monthly-planning'
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  console.log('[IGNITE DOCS] Final documents array:', {
    totalCount: documents.length,
    types: documents.map(d => d.type),
    ids: documents.map(d => d.id)
  });

  const isLoading = strategiesLoading || outlinesLoading || igniteDocsLoading;
  const error = strategiesError || outlinesError || igniteDocsError;

  // Group documents by section
  const foundationDocs = documents.filter(doc => 
    doc.type === 'messaging' || doc.type === 'tripwire' || doc.type === 'core' || doc.type === 'interview_transcript' || doc.type === 'messaging_strategy'
  );
  const contentStrategyDocs = documents.filter(doc => 
    doc.type === 'content_strategy' || doc.type === 'content_ideas'
  );
  const resourcesDocs = documents.filter(doc => 
    doc.type === 'lead_generation' || doc.type === 'email_sequence'
  );
  const liveLaunchDocs = documents.filter(doc => 
    doc.type === 'launch_registration_funnel' || doc.type === 'sales_page' || doc.type === 'launch_email_sequence' || doc.type === 'video_scripts' || doc.type === 'funnel_optimization'
  );

  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let index = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${index}`} className="ml-6 mb-4 space-y-2">
            {currentList.map((item, i) => (
              <li key={i} className="text-slate-700 text-sm list-disc">
                {item}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${index++}`} className="text-lg font-bold mt-8 mb-4 pb-2" style={{ color: 'rgb(235, 150, 140)' }}>
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index++}`} className="text-base font-bold mt-6 mb-3" style={{ color: '#689cf2' }}>
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${index++}`} className="text-sm font-semibold text-slate-700 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.includes('**')) {
        flushList();
        const parts = line.split(/(\*\*.*?\*\*)/);
        elements.push(
          <p key={`p-${index++}`} className="mb-3 leading-relaxed text-slate-700 text-sm">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIndex} className="font-semibold text-slate-900">
                    {part.replace(/\*\*/g, '')}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      } else if (line.trim() === '---') {
        flushList();
        elements.push(<hr key={`hr-${index++}`} className="my-6 border-slate-300" />);
      } else if (line.trim() === '') {
        flushList();
        elements.push(<br key={`br-${index++}`} />);
      } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
        currentList.push(line.replace(/^[-•*]\s/, ''));
      } else {
        flushList();
        elements.push(
          <p key={`text-${index++}`} className="mb-2 leading-relaxed text-slate-600 text-sm">
            {line}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  const handleView = (document: IGNITEDocument) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  const handleDownloadDOCX = async (document: IGNITEDocument) => {
    setDownloadingId(document.id);
    
    try {
      const sections = document.content.split('\n').filter(line => line.trim());
      const docParagraphs: Paragraph[] = [];

      sections.forEach((line) => {
        if (line.startsWith('# ')) {
          docParagraphs.push(
            new Paragraph({
              text: line.replace('# ', ''),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );
        } else if (line.startsWith('## ')) {
          docParagraphs.push(
            new Paragraph({
              text: line.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            })
          );
        } else if (line.startsWith('### ')) {
          docParagraphs.push(
            new Paragraph({
              text: line.replace('### ', ''),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (line.includes('**')) {
          const parts = line.split(/(\*\*.*?\*\*)/);
          const runs: TextRun[] = parts.map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return new TextRun({
                text: part.replace(/\*\*/g, ''),
                bold: true,
              });
            }
            return new TextRun({ text: part });
          });
          docParagraphs.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
        } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
          docParagraphs.push(
            new Paragraph({
              text: line.replace(/^[-•*]\s/, ''),
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        } else if (line.trim() !== '---') {
          docParagraphs.push(
            new Paragraph({
              text: line,
              spacing: { after: 100 },
            })
          );
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: docParagraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${document.title}.docx`);
    } catch (error) {
      console.error('Error generating DOCX:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadPDF = async (document: IGNITEDocument) => {
    setDownloadingId(document.id);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = 20;

      const sections = document.content.split('\n').filter(line => line.trim());

      sections.forEach((line) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        if (line.startsWith('# ')) {
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('# ', '');
          pdf.text(text, margin, yPosition, { maxWidth });
          yPosition += 12;
        } else if (line.startsWith('## ')) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('## ', '');
          pdf.text(text, margin, yPosition, { maxWidth });
          yPosition += 10;
        } else if (line.startsWith('### ')) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          const text = line.replace('### ', '');
          pdf.text(text, margin, yPosition, { maxWidth });
          yPosition += 8;
        } else if (line.trim() === '---') {
          yPosition += 5;
        } else {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const cleanedLine = line.replace(/\*\*/g, '').replace(/^[-•*]\s/, '');
          const splitText = pdf.splitTextToSize(cleanedLine, maxWidth);
          pdf.text(splitText, margin, yPosition);
          yPosition += splitText.length * 6;
        }
      });

      pdf.save(`${document.title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load documents. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Completed IGNITE Docs</h1>
            <p className="text-slate-600 mt-2">
              Access your completed docs and copy as you move through the IGNITE journey. You can view, edit and download each doc!
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            Your Progress
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Documents List */}
        {documents.length > 0 ? (
          <>
            {/* Foundation Section */}
            {foundationDocs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Foundation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {foundationDocs.map((doc) => (
                      <div key={`${doc.type}-${doc.id}`} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Completed {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  Foundation
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`badge-complete-${doc.id}`}>
                              Complete
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => handleView(doc)}
                              data-testid={`button-view-${doc.id}`}
                              className="bg-embodied-coral hover:bg-coral-600 text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {editingDocId === doc.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveEdit(doc)}
                                  data-testid={`button-save-${doc.id}`}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending}
                                >
                                  {updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleCancelEdit}
                                  data-testid={`button-cancel-${doc.id}`}
                                  variant="outline"
                                  className="border-slate-300"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => handleEditClick(doc)}
                                data-testid={`button-edit-${doc.id}`}
                                className="bg-embodied-coral hover:bg-coral-600 text-white"
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm"
                                  disabled={downloadingId === doc.id}
                                  data-testid={`button-download-${doc.id}`}
                                  className="bg-embodied-coral hover:bg-coral-600 text-white disabled:bg-slate-300 disabled:text-slate-500"
                                >
                                  {downloadingId === doc.id ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4 mr-1" />
                                  )}
                                  Download
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDownloadDOCX(doc)} data-testid={`menu-download-docx-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download DOCX
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPDF(doc)} data-testid={`menu-download-pdf-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {editingDocId === doc.id && (
                          <div className="mt-4">
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[400px] font-mono text-sm"
                              placeholder="Edit document content..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Strategy Section */}
            {contentStrategyDocs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Audience Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contentStrategyDocs.map((doc) => (
                      <div key={`${doc.type}-${doc.id}`} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Completed {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  Content Strategy
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`badge-complete-${doc.id}`}>
                              Complete
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => handleView(doc)}
                              data-testid={`button-view-${doc.id}`}
                              className="bg-embodied-coral hover:bg-coral-600 text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {editingDocId === doc.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveEdit(doc)}
                                  data-testid={`button-save-${doc.id}`}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending}
                                >
                                  {updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleCancelEdit}
                                  data-testid={`button-cancel-${doc.id}`}
                                  variant="outline"
                                  className="border-slate-300"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => handleEditClick(doc)}
                                data-testid={`button-edit-${doc.id}`}
                                className="bg-embodied-coral hover:bg-coral-600 text-white"
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm"
                                  disabled={downloadingId === doc.id}
                                  data-testid={`button-download-${doc.id}`}
                                  className="bg-embodied-coral hover:bg-coral-600 text-white disabled:bg-slate-300 disabled:text-slate-500"
                                >
                                  {downloadingId === doc.id ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4 mr-1" />
                                  )}
                                  Download
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDownloadDOCX(doc)} data-testid={`menu-download-docx-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download DOCX
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPDF(doc)} data-testid={`menu-download-pdf-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {editingDocId === doc.id && (
                          <div className="mt-4">
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[400px] font-mono text-sm"
                              placeholder="Edit document content..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resources Section */}
            {resourcesDocs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lead Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resourcesDocs.map((doc) => (
                      <div key={`${doc.type}-${doc.id}`} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Completed {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {doc.type === 'email_sequence' ? 'Email Copy' : doc.type === 'video_scripts' ? 'Video Script Generator' : 'Funnel Copy'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`badge-complete-${doc.id}`}>
                              Complete
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => handleView(doc)}
                              data-testid={`button-view-${doc.id}`}
                              className="bg-embodied-coral hover:bg-coral-600 text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {editingDocId === doc.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveEdit(doc)}
                                  data-testid={`button-save-${doc.id}`}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending}
                                >
                                  {updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleCancelEdit}
                                  data-testid={`button-cancel-${doc.id}`}
                                  variant="outline"
                                  className="border-slate-300"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => handleEditClick(doc)}
                                data-testid={`button-edit-${doc.id}`}
                                className="bg-embodied-coral hover:bg-coral-600 text-white"
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm"
                                  disabled={downloadingId === doc.id}
                                  data-testid={`button-download-${doc.id}`}
                                  className="bg-embodied-coral hover:bg-coral-600 text-white disabled:bg-slate-300 disabled:text-slate-500"
                                >
                                  {downloadingId === doc.id ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4 mr-1" />
                                  )}
                                  Download
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDownloadDOCX(doc)} data-testid={`menu-download-docx-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download DOCX
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPDF(doc)} data-testid={`menu-download-pdf-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {editingDocId === doc.id && (
                          <div className="mt-4">
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[400px] font-mono text-sm"
                              placeholder="Edit document content..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Launch Section */}
            {liveLaunchDocs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Live Launch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {liveLaunchDocs.map((doc) => (
                      <div key={`${doc.type}-${doc.id}`} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Completed {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  Live Launch
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600 border-green-600" data-testid={`badge-complete-${doc.id}`}>
                              Complete
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => handleView(doc)}
                              data-testid={`button-view-${doc.id}`}
                              className="bg-embodied-coral hover:bg-coral-600 text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {editingDocId === doc.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveEdit(doc)}
                                  data-testid={`button-save-${doc.id}`}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending}
                                >
                                  {updateMessagingStrategyMutation.isPending || updateOfferOutlineMutation.isPending || updateIgniteDocMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleCancelEdit}
                                  data-testid={`button-cancel-${doc.id}`}
                                  variant="outline"
                                  className="border-slate-300"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => handleEditClick(doc)}
                                data-testid={`button-edit-${doc.id}`}
                                className="bg-embodied-coral hover:bg-coral-600 text-white"
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm"
                                  disabled={downloadingId === doc.id}
                                  data-testid={`button-download-${doc.id}`}
                                  className="bg-embodied-coral hover:bg-coral-600 text-white disabled:bg-slate-300 disabled:text-slate-500"
                                >
                                  {downloadingId === doc.id ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4 mr-1" />
                                  )}
                                  Download
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDownloadDOCX(doc)} data-testid={`menu-download-docx-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download DOCX
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadPDF(doc)} data-testid={`menu-download-pdf-${doc.id}`} className="hover:bg-slate-100 focus:bg-slate-100">
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {editingDocId === doc.id && (
                          <div className="mt-4">
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[400px] font-mono text-sm"
                              placeholder="Edit document content..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Documents Yet</h3>
              <p className="text-slate-600 mb-4">
                Complete your messaging strategy, tripwire offer outline, or core offer outline to see your documents here.
              </p>
              <Link href="/step/1">
                <Button>
                  Go to Strategic Messaging
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            {selectedDocument && formatContent(selectedDocument.content)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
