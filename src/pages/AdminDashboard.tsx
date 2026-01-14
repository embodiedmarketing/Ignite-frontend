import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/services/queryClient";
import { AlertCircle, Bug, CheckCircle, Clock, Eye, Lightbulb, MessageSquare, Zap, Shield, XCircle, FileText, Download, BarChart3, Users, Activity, Plus, Pencil, Trash2, Video } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import jsPDF from "jspdf";
import type { TrainingVideo, PlatformResource, ChecklistStepDefinition } from "@shared/schema";
import UserActivityOverview from "@/shared/components/UserActivityOverview";

interface IssueReport {
  id: number;
  userId: number;
  userEmail: string;
  issueType: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo: any;
  pageUrl: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface MessagingStrategy {
  id: number;
  userId: number;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  sourceData: any;
  completionPercentage: number;
  missingInformation: any;
  recommendations: any;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
}

interface AdminUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  subscriptionStatus: string | null;
  subscriptionEndDate?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  completedSections: number;
  isActive?: boolean;
}

function getIssueTypeIcon(type: string) {
  switch (type) {
    case 'bug': return <Bug className="w-4 h-4" />;
    case 'feature_request': return <Lightbulb className="w-4 h-4" />;
    case 'improvement': return <Zap className="w-4 h-4" />;
    case 'technical_issue': return <AlertCircle className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-800';
    case 'medium': return 'bg-blue-100 text-blue-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Component to fetch and display a messaging strategy by ID
export const MessagingStrategyButton=({ strategyId, title, version }: { strategyId: number; title: string; version: number }) => {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState<MessagingStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStrategy = async () => {
    if (strategy) return; // Already loaded
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/messaging-strategies/${strategyId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch strategy");
      const data = await response.json();
      setStrategy(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messaging strategy",
        variant: "destructive"
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchStrategy();
    }
  };

  const downloadPDF = () => {
    if (!strategy) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(strategy.title, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Strategy #${strategy.id} • User: ${strategy.userFirstName} ${strategy.userLastName} (${strategy.userEmail})`, margin, yPosition);
      yPosition += 5;
      doc.text(`User ID: ${strategy.userId} • Version: ${strategy.version}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Created: ${format(new Date(strategy.createdAt), 'MMM d, yyyy h:mm a')}`, margin, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(strategy.content, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      const fileName = `messaging-strategy-${strategy.id}-user-${strategy.userId}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `${fileName} has been downloaded successfully.`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
          <FileText className="w-3 h-3" />
          {title} (v{version})
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : strategy ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {strategy.title}
              </DialogTitle>
              <DialogDescription>
                Strategy #{strategy.id} • User: {strategy.userFirstName} {strategy.userLastName} ({strategy.userEmail}) • User ID: {strategy.userId} • Version: {strategy.version} • {format(new Date(strategy.createdAt), 'MMM d, yyyy h:mm a')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{strategy.content}</pre>
              </div>
              {strategy.missingInformation && Array.isArray(strategy.missingInformation) && strategy.missingInformation.length > 0 && (
                <div className="border-l-4 border-orange-400 pl-4 py-2">
                  <h3 className="font-semibold text-orange-700 mb-2">Missing Information:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-orange-600">
                    {strategy.missingInformation.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {strategy.recommendations && Array.isArray(strategy.recommendations) && strategy.recommendations.length > 0 && (
                <div className="border-l-4 border-blue-400 pl-4 py-2">
                  <h3 className="font-semibold text-blue-700 mb-2">Recommendations:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                    {strategy.recommendations.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={downloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Component to fetch and display an offer outline by ID
export const OfferOutlineButton=({ outlineId, title, offerNumber }: { outlineId: number; title: string; offerNumber: number })=> {
  const [open, setOpen] = useState(false);
  const [outline, setOutline] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchOutline = async () => {
    if (outline) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/offer-outlines/${outlineId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch outline");
      const data = await response.json();
      setOutline(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load offer outline",
        variant: "destructive"
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchOutline();
    }
  };

  const downloadPDF = () => {
    if (!outline) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(outline.title, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Outline #${outline.id} • User: ${outline.userFirstName} ${outline.userLastName} (${outline.userEmail})`, margin, yPosition);
      yPosition += 5;
      doc.text(`User ID: ${outline.userId} • Offer #${outline.offerNumber} • Version: ${outline.version}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Created: ${format(new Date(outline.createdAt), 'MMM d, yyyy h:mm a')}`, margin, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(outline.content, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      const fileName = `offer-outline-${outline.id}-user-${outline.userId}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `${fileName} has been downloaded successfully.`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 hover:underline">
          <FileText className="w-3 h-3" />
          {title} (Offer #{offerNumber})
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : outline ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {outline.title}
              </DialogTitle>
              <DialogDescription>
                Outline #{outline.id} • User: {outline.userFirstName} {outline.userLastName} ({outline.userEmail}) • Offer #{outline.offerNumber} • Version: {outline.version} • {format(new Date(outline.createdAt), 'MMM d, yyyy h:mm a')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{outline.content}</pre>
              </div>
              {outline.missingInformation && Array.isArray(outline.missingInformation) && outline.missingInformation.length > 0 && (
                <div className="border-l-4 border-orange-400 pl-4 py-2">
                  <h3 className="font-semibold text-orange-700 mb-2">Missing Information:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-orange-600">
                    {outline.missingInformation.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {outline.recommendations && Array.isArray(outline.recommendations) && outline.recommendations.length > 0 && (
                <div className="border-l-4 border-blue-400 pl-4 py-2">
                  <h3 className="font-semibold text-blue-700 mb-2">Recommendations:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                    {outline.recommendations.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={downloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Component to fetch and display a sales page by ID
export const SalesPageButton=({ pageId, draftNumber }: { pageId: number; draftNumber: number })=> {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPage = async () => {
    if (page) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/sales-pages/${pageId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch sales page");
      const data = await response.json();
      setPage(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sales page",
        variant: "destructive"
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchPage();
    }
  };

  const downloadPDF = () => {
    if (!page) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(page.title, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Sales Page #${page.id} • User: ${page.userFirstName} ${page.userLastName} (${page.userEmail})`, margin, yPosition);
      yPosition += 5;
      doc.text(`User ID: ${page.userId} • Draft #${page.draftNumber}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Created: ${format(new Date(page.createdAt), 'MMM d, yyyy h:mm a')}`, margin, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(page.content, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      const fileName = `sales-page-${page.id}-user-${page.userId}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `${fileName} has been downloaded successfully.`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 hover:underline">
          <FileText className="w-3 h-3" />
          Draft #{draftNumber}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
          </div>
        ) : page ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {page.title}
              </DialogTitle>
              <DialogDescription>
                Sales Page #{page.id} • User: {page.userFirstName} {page.userLastName} ({page.userEmail}) • Draft #{page.draftNumber} • {format(new Date(page.createdAt), 'MMM d, yyyy h:mm a')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{page.content}</pre>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={downloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Component to fetch and display an IGNITE document by ID
export const IgniteDocButton=({ docId, title, docType }: { docId: number; title: string; docType: string })=> {
  const [open, setOpen] = useState(false);
  const [doc, setDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDoc = async () => {
    if (doc) return;
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/ignite-docs/${docId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch document");
      const data = await response.json();
      setDoc(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load IGNITE document",
        variant: "destructive"
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchDoc();
    }
  };

  const downloadPDF = () => {
    if (!doc) return;
    try {
      const pdfDoc = new jsPDF();
      const pageWidth = pdfDoc.internal.pageSize.getWidth();
      const pageHeight = pdfDoc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      pdfDoc.setFontSize(18);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(doc.title, margin, yPosition);
      yPosition += 10;

      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.setTextColor(100);
      pdfDoc.text(`IGNITE Doc #${doc.id} • User: ${doc.userFirstName} ${doc.userLastName} (${doc.userEmail})`, margin, yPosition);
      yPosition += 5;
      pdfDoc.text(`User ID: ${doc.userId} • Type: ${doc.docType}`, margin, yPosition);
      yPosition += 5;
      pdfDoc.text(`Created: ${format(new Date(doc.createdAt), 'MMM d, yyyy h:mm a')}`, margin, yPosition);
      yPosition += 15;

      pdfDoc.setFontSize(11);
      pdfDoc.setTextColor(0);
      const lines = pdfDoc.splitTextToSize(doc.contentMarkdown, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          pdfDoc.addPage();
          yPosition = margin;
        }
        pdfDoc.text(line, margin, yPosition);
        yPosition += 6;
      });

      const fileName = `ignite-doc-${doc.id}-user-${doc.userId}.pdf`;
      pdfDoc.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `${fileName} has been downloaded successfully.`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 hover:underline">
          <FileText className="w-3 h-3" />
          {title} ({docType})
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
          </div>
        ) : doc ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {doc.title}
              </DialogTitle>
              <DialogDescription>
                IGNITE Doc #{doc.id} • User: {doc.userFirstName} {doc.userLastName} ({doc.userEmail}) • Type: {doc.docType} • {format(new Date(doc.createdAt), 'MMM d, yyyy h:mm a')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{doc.contentMarkdown}</pre>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={downloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StrategyContentDialog({ strategy, trigger }: { strategy: MessagingStrategy; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(strategy.title, margin, yPosition);
      yPosition += 10;

      // Metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Strategy #${strategy.id} • User: ${strategy.userFirstName} ${strategy.userLastName} (${strategy.userEmail})`, margin, yPosition);
      yPosition += 5;
      doc.text(`User ID: ${strategy.userId} • Version: ${strategy.version}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Created: ${format(new Date(strategy.createdAt), 'MMM d, yyyy h:mm a')}`, margin, yPosition);
      yPosition += 15;

      // Content
      doc.setFontSize(11);
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(strategy.content, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      // Missing Information (if any)
      if (strategy.missingInformation && Array.isArray(strategy.missingInformation) && strategy.missingInformation.length > 0) {
        yPosition += 10;
        if (yPosition > pageHeight - margin - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150, 100, 0);
        doc.text('Missing Information:', margin, yPosition);
        yPosition += 7;
        doc.setFont('helvetica', 'normal');
        strategy.missingInformation.forEach((item: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          const itemLines = doc.splitTextToSize(`• ${item}`, maxWidth - 5);
          itemLines.forEach((line: string) => {
            doc.text(line, margin + 5, yPosition);
            yPosition += 6;
          });
        });
      }

      // Recommendations (if any)
      if (strategy.recommendations && Array.isArray(strategy.recommendations) && strategy.recommendations.length > 0) {
        yPosition += 10;
        if (yPosition > pageHeight - margin - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 100, 200);
        doc.text('Recommendations:', margin, yPosition);
        yPosition += 7;
        doc.setFont('helvetica', 'normal');
        strategy.recommendations.forEach((item: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          const itemLines = doc.splitTextToSize(`• ${item}`, maxWidth - 5);
          itemLines.forEach((line: string) => {
            doc.text(line, margin + 5, yPosition);
            yPosition += 6;
          });
        });
      }

      // Save the PDF
      const fileName = `messaging-strategy-${strategy.id}-user-${strategy.userId}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `${fileName} has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {strategy.title}
          </DialogTitle>
          <DialogDescription>
            Strategy #{strategy.id} • User: {strategy.userFirstName} {strategy.userLastName} ({strategy.userEmail}) • User ID: {strategy.userId} • Version: {strategy.version} • {format(new Date(strategy.createdAt), 'MMM d, yyyy h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Messaging Strategy Content</h3>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                {strategy.content}
              </pre>
            </div>
          </div>

          {strategy.missingInformation && Array.isArray(strategy.missingInformation) && strategy.missingInformation.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Missing Information
              </h3>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                {strategy.missingInformation.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {strategy.recommendations && Array.isArray(strategy.recommendations) && strategy.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Recommendations
              </h3>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                {strategy.recommendations.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button 
            onClick={downloadPDF}
            className="bg-embodied-blue hover:bg-embodied-navy"
            data-testid="button-download-strategy-pdf"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FunnelCopyDialog({ funnel, trigger }: { funnel: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Funnel Copy - Offer #{funnel.offerNumber}
          </DialogTitle>
          <DialogDescription>
            User: {funnel.userFirstName} {funnel.userLastName} ({funnel.userEmail}) • Generated: {format(new Date(funnel.createdAt), 'MMM d, yyyy h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {funnel.optInPage && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Opt-In Page Copy</h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                  {funnel.optInPage}
                </pre>
              </div>
            </div>
          )}

          {funnel.tripwirePage && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Tripwire Page Copy</h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                  {funnel.tripwirePage}
                </pre>
              </div>
            </div>
          )}

          {funnel.checkoutPage && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Checkout Page Copy</h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                  {funnel.checkoutPage}
                </pre>
              </div>
            </div>
          )}

          {funnel.confirmationPage && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Confirmation Page Copy</h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                  {funnel.confirmationPage}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContentStrategyDialog({ content, trigger }: { content: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Content Strategy
          </DialogTitle>
          <DialogDescription>
            User: {content.userFirstName} {content.userLastName} ({content.userEmail}) • Generated: {format(new Date(content.createdAt), 'MMM d, yyyy h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {content.postingCadence && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Posting Cadence</h3>
              <p className="text-sm text-blue-800">{content.postingCadence}</p>
            </div>
          )}

          {content.contentPillars && Array.isArray(content.contentPillars) && content.contentPillars.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Content Pillars</h3>
              <div className="space-y-3">
                {content.contentPillars.map((pillar: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-slate-900">{pillar.name || pillar.title}</h4>
                    <p className="text-sm text-slate-700 mt-1">
                      {pillar.description || pillar.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.contentIdeas && Array.isArray(content.contentIdeas) && content.contentIdeas.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Content Ideas</h3>
              <div className="space-y-2">
                {content.contentIdeas.map((idea: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                    <p className="text-sm text-slate-800">
                      {typeof idea === 'string' ? idea : idea.title || idea.name}
                    </p>
                    {typeof idea === 'object' && idea.description && (
                      <p className="text-xs text-slate-600 mt-1">{idea.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoScriptDialog({ script, trigger }: { script: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const scripts = script.generatedScripts || {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Video Scripts
          </DialogTitle>
          <DialogDescription>
            User: {script.userFirstName} {script.userLastName} ({script.userEmail}) • Updated: {format(new Date(script.updatedAt), 'MMM d, yyyy h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Input Method:</span>{' '}
              <span className="capitalize">{script.inputMethod || 'Not set'}</span>
            </p>
            {script.landingPageUrl && (
              <p className="text-sm text-blue-900 mt-1">
                <span className="font-medium">URL:</span>{' '}
                <a href={script.landingPageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {script.landingPageUrl}
                </a>
              </p>
            )}
          </div>

          {scripts.script1 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">
                {scripts.script1.title || 'Script 1'}
              </h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                  {scripts.script1.content}
                </pre>
              </div>
            </div>
          )}

          {scripts.script2 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">
                {scripts.script2.title || 'Script 2'}
              </h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                  {scripts.script2.content}
                </pre>
              </div>
            </div>
          )}

          {scripts.script3 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">
                {scripts.script3.title || 'Script 3'}
              </h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent">
                  {scripts.script3.content}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueDetailDialog({ issue, trigger }: { issue: IssueReport; trigger: React.ReactNode }) {
  const [adminNotes, setAdminNotes] = useState(issue.adminNotes || "");
  const [status, setStatus] = useState(issue.status);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateIssueMutation = useMutation({
    mutationFn: async (data: { adminNotes: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/issue-reports/${issue.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue updated successfully",
        description: "The issue status and notes have been updated."
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/issue-reports"] });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update the issue. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleUpdate = () => {
    updateIssueMutation.mutate({ adminNotes, status });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIssueTypeIcon(issue.issueType)}
            {issue.title}
          </DialogTitle>
          <DialogDescription>
            Issue #{issue.id} • Reported by {issue.userEmail} • {format(new Date(issue.createdAt), 'MMM d, yyyy h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="flex items-center gap-2 mt-1">
                {getIssueTypeIcon(issue.issueType)}
                <span className="capitalize">{issue.issueType.replace('_', ' ')}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Badge className={`mt-1 ${getPriorityColor(issue.priority)}`}>
                {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium">Page URL</label>
              <a 
                href={issue.pageUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline text-sm block mt-1 truncate"
              >
                {issue.pageUrl}
              </a>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{issue.description}</p>
          </div>

          {issue.stepsToReproduce && (
            <div>
              <label className="text-sm font-medium">Steps to Reproduce</label>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{issue.stepsToReproduce}</p>
            </div>
          )}

          {issue.expectedBehavior && (
            <div>
              <label className="text-sm font-medium">Expected Behavior</label>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{issue.expectedBehavior}</p>
            </div>
          )}

          {issue.actualBehavior && (
            <div>
              <label className="text-sm font-medium">Actual Behavior</label>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{issue.actualBehavior}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Browser Information</label>
            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
              <p><strong>User Agent:</strong> {issue.browserInfo.userAgent}</p>
              <p><strong>Platform:</strong> {issue.browserInfo.platform}</p>
              <p><strong>Language:</strong> {issue.browserInfo.language}</p>
              <p><strong>Viewport:</strong> {issue.browserInfo.viewport?.width}x{issue.browserInfo.viewport?.height}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1" data-testid="select-status-dialog">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Admin Notes</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about resolution, follow-up actions, or internal comments..."
              className="mt-1"
              rows={4}
              data-testid="textarea-admin-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-update">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={updateIssueMutation.isPending}
            className="bg-embodied-blue hover:bg-embodied-navy"
            data-testid="button-update-issue"
          >
            {updateIssueMutation.isPending ? "Updating..." : "Update Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Validation schemas
const videoFormSchema = z.object({
  moduleTitle: z.string().min(1, "Module title is required").max(255),
  description: z.string().optional(),
  vimeoId: z.string().min(1, "Vimeo ID is required").max(100),
  sectionKey: z.string().optional(),
  orderIndex: z.number().int().min(0).default(0),
});

const resourceFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  resourceType: z.enum(['pdf', 'template', 'link', 'video']),
  resourceUrl: z.string().min(1, "Resource URL is required").url("Must be a valid URL"),
  sectionKey: z.string().optional(),
});

const checklistFormSchema = z.object({
  sectionKey: z.string().min(1, "Section key is required").max(255),
  sectionTitle: z.string().min(1, "Section title is required").max(255),
  steps: z.string().min(1, "Steps are required (JSON format)"),
});

type VideoFormData = z.infer<typeof videoFormSchema>;
type ResourceFormData = z.infer<typeof resourceFormSchema>;
type ChecklistFormData = z.infer<typeof checklistFormSchema>;

// Video Dialog Component
function VideoDialog({ video, trigger, onSuccess }: { video?: TrainingVideo; trigger: React.ReactNode; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      moduleTitle: video?.moduleTitle || "",
      description: video?.description || "",
      vimeoId: video?.vimeoId || "",
      sectionKey: video?.sectionKey || "",
      orderIndex: video?.orderIndex || 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: VideoFormData) => {
      const url = video ? `/api/admin/training-videos/${video.id}` : '/api/admin/training-videos';
      const method = video ? 'PUT' : 'POST';
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({
        title: video ? "Video updated" : "Video added",
        description: `Training video has been ${video ? 'updated' : 'added'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/training-videos'] });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: video ? "Update failed" : "Add failed",
        description: error.message || "Failed to save video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VideoFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{video ? 'Edit' : 'Add'} Training Video</DialogTitle>
          <DialogDescription>
            {video ? 'Update the training video details' : 'Add a new training video to the platform'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="moduleTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Module 1: Getting Started" {...field} data-testid="input-module-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the video content" {...field} data-testid="input-video-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vimeoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vimeo ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123456789" {...field} data-testid="input-vimeo-id" />
                  </FormControl>
                  <FormDescription>
                    The numeric ID from the Vimeo video URL
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sectionKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., messaging-mastery" {...field} data-testid="input-section-key" />
                  </FormControl>
                  <FormDescription>
                    Optional: Key to associate with a specific section
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Index</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-order-index"
                    />
                  </FormControl>
                  <FormDescription>
                    Display order (0 for first, 1 for second, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#f5a89f] hover:bg-[#f39c91]" disabled={mutation.isPending} data-testid="button-submit-video">
                {mutation.isPending ? "Saving..." : video ? "Update Video" : "Add Video"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Resource Dialog Component
function ResourceDialog({ resource, trigger, onSuccess }: { resource?: PlatformResource; trigger: React.ReactNode; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: resource?.title || "",
      description: resource?.description || "",
      resourceType: resource?.resourceType as any || 'pdf',
      resourceUrl: resource?.resourceUrl || "",
      sectionKey: resource?.sectionKey || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ResourceFormData) => {
      const url = resource ? `/api/admin/platform-resources/${resource.id}` : '/api/admin/platform-resources';
      const method = resource ? 'PUT' : 'POST';
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({
        title: resource ? "Resource updated" : "Resource added",
        description: `Platform resource has been ${resource ? 'updated' : 'added'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-resources'] });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: resource ? "Update failed" : "Add failed",
        description: error.message || "Failed to save resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResourceFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{resource ? 'Edit' : 'Add'} Platform Resource</DialogTitle>
          <DialogDescription>
            {resource ? 'Update the resource details' : 'Add a new resource to the platform'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Messaging Strategy Template" {...field} data-testid="input-resource-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the resource" {...field} data-testid="input-resource-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-resource-type">
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource URL *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/resource.pdf" {...field} data-testid="input-resource-url" />
                  </FormControl>
                  <FormDescription>
                    Full URL to the resource
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sectionKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., messaging-mastery" {...field} data-testid="input-resource-section-key" />
                  </FormControl>
                  <FormDescription>
                    Optional: Key to associate with a specific section
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#f5a89f] hover:bg-[#f39c91]" disabled={mutation.isPending} data-testid="button-submit-resource">
                {mutation.isPending ? "Saving..." : resource ? "Update Resource" : "Add Resource"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Checklist Dialog Component
function ChecklistDialog({ checklist, trigger, onSuccess }: { checklist?: ChecklistStepDefinition; trigger: React.ReactNode; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: {
      sectionKey: checklist?.sectionKey || "",
      sectionTitle: checklist?.sectionTitle || "",
      steps: checklist?.steps ? JSON.stringify(checklist.steps, null, 2) : "[]",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ChecklistFormData) => {
      const parsedSteps = JSON.parse(data.steps);
      const payload = {
        sectionKey: data.sectionKey,
        sectionTitle: data.sectionTitle,
        steps: parsedSteps,
      };
      const url = checklist ? `/api/admin/checklist-definitions/${checklist.id}` : '/api/admin/checklist-definitions';
      const method = checklist ? 'PUT' : 'POST';
      return await apiRequest(method, url, payload);
    },
    onSuccess: () => {
      toast({
        title: checklist ? "Checklist updated" : "Checklist added",
        description: `Checklist definition has been ${checklist ? 'updated' : 'added'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/checklist-definitions'] });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: checklist ? "Update failed" : "Add failed",
        description: error.message || "Failed to save checklist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ChecklistFormData) => {
    try {
      JSON.parse(data.steps);
      mutation.mutate(data);
    } catch (e) {
      toast({
        title: "Invalid JSON",
        description: "Steps must be valid JSON format. Please check your input.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{checklist ? 'Edit' : 'Add'} Checklist Definition</DialogTitle>
          <DialogDescription>
            {checklist ? 'Update the checklist definition' : 'Add a new checklist section to the platform'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sectionKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Key *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., launch-your-ads-lead-generation" {...field} data-testid="input-checklist-section-key" />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for this checklist section
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sectionTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Launch Your Ads - Lead Generation" {...field} data-testid="input-checklist-section-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps (JSON Array) *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='[{"key": "step1", "label": "Step 1", "order": 1}]'
                      className="font-mono text-sm min-h-[200px]"
                      {...field}
                      data-testid="input-checklist-steps"
                    />
                  </FormControl>
                  <FormDescription>
                    JSON array of step objects with key, label, and order properties
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#f5a89f] hover:bg-[#f39c91]" disabled={mutation.isPending} data-testid="button-submit-checklist">
                {mutation.isPending ? "Saving..." : checklist ? "Update Checklist" : "Add Checklist"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Confirmation Component
function DeleteConfirmation({ title, description, onConfirm, trigger }: {
  title: string;
  description: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Main Content Management Component
function ContentManagement() {
  const { toast } = useToast();

  // Queries
  const videosQuery = useQuery<TrainingVideo[]>({
    queryKey: ['/api/admin/training-videos'],
  });

  const resourcesQuery = useQuery<PlatformResource[]>({
    queryKey: ['/api/admin/platform-resources'],
  });

  const checklistsQuery = useQuery<ChecklistStepDefinition[]>({
    queryKey: ['/api/admin/checklist-definitions'],
  });

  // Delete mutations
  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/training-videos/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Video deleted",
        description: "Training video has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/training-videos'] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/platform-resources/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Resource deleted",
        description: "Platform resource has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-resources'] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/checklist-definitions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Checklist deleted",
        description: "Checklist definition has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/checklist-definitions'] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete checklist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading = videosQuery.isLoading || resourcesQuery.isLoading || checklistsQuery.isLoading;
  const hasError = videosQuery.isError || resourcesQuery.isError || checklistsQuery.isError;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Content Management
          </CardTitle>
          <CardDescription>
            Manage training videos, to-do steps, and resources for the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load content. Please refresh the page.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-8">
            {/* Training Videos Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">Training Videos</h3>
                  <p className="text-sm text-slate-600">Upload and organize training videos for different modules</p>
                </div>
                <VideoDialog
                  trigger={
                    <Button className="bg-[#f5a89f] hover:bg-[#f39c91]" data-testid="button-add-video">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Video
                    </Button>
                  }
                  onSuccess={() => {}}
                />
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : videosQuery.data && videosQuery.data.length > 0 ? (
                  videosQuery.data.map((video) => (
                    <div key={video.id} className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-slate-900">{video.moduleTitle}</h4>
                          </div>
                          {video.description && (
                            <p className="text-sm text-slate-600 mt-1">{video.description}</p>
                          )}
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs text-slate-500">Vimeo ID: {video.vimeoId}</span>
                            {video.sectionKey && (
                              <span className="text-xs text-slate-500">Section: {video.sectionKey}</span>
                            )}
                            <span className="text-xs text-slate-500">Order: {video.orderIndex}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <VideoDialog
                            video={video}
                            trigger={
                              <Button variant="outline" size="sm" data-testid={`button-edit-video-${video.id}`}>
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            }
                            onSuccess={() => {}}
                          />
                          <DeleteConfirmation
                            title="Delete Video"
                            description="Are you sure you want to delete this training video? This action cannot be undone."
                            onConfirm={() => deleteVideoMutation.mutate(video.id)}
                            trigger={
                              <Button variant="outline" size="sm" data-testid={`button-delete-video-${video.id}`}>
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-500">
                    No training videos found. Click "Add Video" to create one.
                  </p>
                )}
              </div>
            </div>

            {/* Resources Section */}
            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">Platform Resources</h3>
                  <p className="text-sm text-slate-600">Manage PDFs, templates, and downloadable resources for users</p>
                </div>
                <ResourceDialog
                  trigger={
                    <Button className="bg-[#f5a89f] hover:bg-[#f39c91]" data-testid="button-add-resource">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Resource
                    </Button>
                  }
                  onSuccess={() => {}}
                />
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : resourcesQuery.data && resourcesQuery.data.length > 0 ? (
                  resourcesQuery.data.map((resource) => (
                    <div key={resource.id} className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{resource.title}</h4>
                          {resource.description && (
                            <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
                          )}
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs text-slate-500">Type: {resource.resourceType.toUpperCase()}</span>
                            {resource.sectionKey && (
                              <span className="text-xs text-slate-500">Section: {resource.sectionKey}</span>
                            )}
                          </div>
                          <a 
                            href={resource.resourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            {resource.resourceUrl}
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <ResourceDialog
                            resource={resource}
                            trigger={
                              <Button variant="outline" size="sm" data-testid={`button-edit-resource-${resource.id}`}>
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            }
                            onSuccess={() => {}}
                          />
                          <DeleteConfirmation
                            title="Delete Resource"
                            description="Are you sure you want to delete this resource? This action cannot be undone."
                            onConfirm={() => deleteResourceMutation.mutate(resource.id)}
                            trigger={
                              <Button variant="outline" size="sm" data-testid={`button-delete-resource-${resource.id}`}>
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-500">
                    No resources found. Click "Add Resource" to create one.
                  </p>
                )}
              </div>
            </div>

            {/* Checklist Definitions Section */}
            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">Checklist Definitions</h3>
                  <p className="text-sm text-slate-600">Edit or update checklist items and to-do steps across all sections</p>
                </div>
                <ChecklistDialog
                  trigger={
                    <Button className="bg-[#f5a89f] hover:bg-[#f39c91]" data-testid="button-add-checklist">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Checklist
                    </Button>
                  }
                  onSuccess={() => {}}
                />
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </>
                ) : checklistsQuery.data && checklistsQuery.data.length > 0 ? (
                  checklistsQuery.data.map((checklist) => (
                    <div key={checklist.id} className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{checklist.sectionTitle}</h4>
                          <p className="text-xs text-slate-500 mt-1">Key: {checklist.sectionKey}</p>
                          {checklist.steps && Array.isArray(checklist.steps) && checklist.steps.length > 0 ? (
                            <div className="mt-3 space-y-1">
                              {(checklist.steps as any[]).map((step: any, idx: number) => (
                                <p key={idx} className="text-sm text-slate-700">
                                  • {step.label || step.name || `Step ${idx + 1}`}
                                </p>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <ChecklistDialog
                            checklist={checklist}
                            trigger={
                              <Button variant="outline" size="sm" data-testid={`button-edit-checklist-${checklist.id}`}>
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            }
                            onSuccess={() => {}}
                          />
                          <DeleteConfirmation
                            title="Delete Checklist"
                            description="Are you sure you want to delete this checklist definition? This action cannot be undone."
                            onConfirm={() => deleteChecklistMutation.mutate(checklist.id)}
                            trigger={
                              <Button variant="outline" size="sm" data-testid={`button-delete-checklist-${checklist.id}`}>
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-slate-500">
                    No checklist definitions found. Click "Add Checklist" to create one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("issues");
  const [usersPage, setUsersPage] = useState<number>(1);
  const usersPerPage = 10;

  const { data: issues, isLoading } = useQuery({
    queryKey: ["/api/issue-reports"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/issue-reports");
      return response.json();
    },
    enabled: !!user?.isAdmin,
  });

  const { data: messagingStrategies, isLoading: strategiesLoading } = useQuery<MessagingStrategy[]>({
    queryKey: ["/api/admin/messaging-strategies"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/messaging-strategies");
      return response.json();
    },
    enabled: !!user?.isAdmin && activeTab === "strategies",
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/usage"],
    queryFn: async () => {
      console.log("Fetching analytics data...");
      const response = await apiRequest("GET", "/api/admin/analytics/usage");
      const data = await response.json();
      console.log("Analytics data received:", data);
      return data;
    },
    enabled: !!user?.isAdmin && activeTab === "analytics",
  });

  const { data: recentLogins, isLoading: loginsLoading, error: loginsError, isError: isLoginsError } = useQuery({
    queryKey: ["/api/admin/analytics/logins"],
    queryFn: async ({ signal }) => {
      try {
        const response = await apiRequest("GET", "/api/admin/analytics/logins?limit=50");
        
        // Check if request was cancelled
        if (signal?.aborted) {
          throw new Error("Request was cancelled");
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Login analytics data received:", data);
        return data;
      } catch (error: any) {
        console.error("Error fetching login analytics:", error);
        
        // Handle cancellation errors
        if (error?.name === 'AbortError' || error?.message?.includes('cancelled') || error?.message?.includes('aborted')) {
          console.warn("Request was cancelled - this is normal when switching tabs");
          throw new Error("Request was cancelled");
        }
        
        throw error;
      }
    },
    enabled: !!user?.isAdmin && activeTab === "analytics",
    retry: (failureCount, error: any) => {
      // Don't retry if request was cancelled
      if (error?.message?.includes('cancelled') || error?.message?.includes('aborted')) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const { data: moduleStats, isLoading: moduleStatsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/modules"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/analytics/modules");
      return response.json();
    },
    enabled: !!user?.isAdmin && activeTab === "analytics",
  });

  const { data: learningProgress, isLoading: learningLoading } = useQuery({
    queryKey: ["/api/admin/analytics/learning-progress"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/analytics/learning-progress");
      return response.json();
    },
    enabled: !!user?.isAdmin && activeTab === "learning",
  });

  const { data: toolOutputs, isLoading: toolsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/tool-outputs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/analytics/tool-outputs");
      return response.json();
    },
    enabled: !!user?.isAdmin && activeTab === "tools",
  });

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    },
    enabled: !!user?.isAdmin && activeTab === "users",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      setUpdatingUserId(userId);
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/toggle-active`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUpdatingUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
      setUpdatingUserId(null);
    },
  });

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    updateUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const filteredIssues = issues?.filter((issue: IssueReport) => {
    const statusMatch = filterStatus === "all" || issue.status === filterStatus;
    const typeMatch = filterType === "all" || issue.issueType === filterType;
    return statusMatch && typeMatch;
  }) || [];

  const stats = {
    total: issues?.length || 0,
    open: issues?.filter((i: IssueReport) => i.status === 'open').length || 0,
    inProgress: issues?.filter((i: IssueReport) => i.status === 'in_progress').length || 0,
    resolved: issues?.filter((i: IssueReport) => i.status === 'resolved').length || 0,
  };

  // Access control - redirect if not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Access control - show access denied if not admin
  if (!user.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="w-6 h-6 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You do not have permission to access the admin dashboard. This area is restricted to administrators only.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation("/")} 
              className="mt-4"
              data-testid="button-back-home"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Shield className="w-8 h-8 mr-3 text-embodied-coral" />
        <div>
          <h1 className="text-2xl font-bold text-[#192231]">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage and track user feedback, issue reports, and messaging strategies</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-6xl grid-cols-6" data-testid="tabs-admin">
          <TabsTrigger value="issues" data-testid="tab-issues">
            <Bug className="w-4 h-4 mr-2" />
            Report Issue
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard Analytics
          </TabsTrigger>
          <TabsTrigger value="learning" data-testid="tab-learning">
            <Activity className="w-4 h-4 mr-2" />
            Learning Progress
          </TabsTrigger>
          <TabsTrigger value="tools" data-testid="tab-tools">
            <Zap className="w-4 h-4 mr-2" />
            Tool Outputs
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            <FileText className="w-4 h-4 mr-2" />
            Content Management
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="stats-total">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#192231]">{stats.total}</div>
          </CardContent>
        </Card>
        <Card data-testid="stats-open">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card data-testid="stats-in-progress">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card data-testid="stats-resolved">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium">Filter by Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 mt-1" data-testid="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Filter by Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 mt-1" data-testid="filter-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="technical_issue">Technical Issue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No issues found matching your filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue: IssueReport) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow" data-testid={`issue-card-${issue.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      {getIssueTypeIcon(issue.issueType)}
                      <span className="text-sm capitalize">{issue.issueType.replace('_', ' ')}</span>
                    </div>
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex items-center gap-4 text-sm">
                    <span>#{issue.id}</span>
                    <span>{issue.userEmail}</span>
                    <span>{format(new Date(issue.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{issue.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    Page: <span className="font-mono">{new URL(issue.pageUrl).pathname}</span>
                  </div>
                  <IssueDetailDialog 
                    issue={issue}
                    trigger={
                      <Button variant="outline" size="sm" data-testid={`button-view-details-${issue.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Stats */}
              {analyticsData?.overall && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card data-testid="analytics-total-users">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#192231]">{analyticsData.overall.totalUsers}</div>
                      <p className="text-xs text-slate-500 mt-1">{analyticsData.overall.activeUsers} active</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="analytics-total-logins">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Total Logins
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#192231]">{analyticsData.overall.totalLogins}</div>
                      <p className="text-xs text-slate-500 mt-1">{analyticsData.overall.loginsLast7Days} in last 7 days</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="analytics-completions">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Completions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#192231]">{analyticsData.overall.totalCompletions}</div>
                      <p className="text-xs text-slate-500 mt-1">section completions</p>
                    </CardContent>
                  </Card>
                  <Card data-testid="analytics-strategies">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Strategies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#192231]">{analyticsData.overall.totalStrategies}</div>
                      <p className="text-xs text-slate-500 mt-1">messaging strategies</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Member Logins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Member Logins
                  </CardTitle>
                  <CardDescription>Last 50 login events across all users</CardDescription>
                </CardHeader>
                <CardContent>
                  {loginsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin w-6 h-6 border-4 border-[#4593ed] border-t-transparent rounded-full" />
                    </div>
                  ) : isLoginsError && loginsError ? (
                    <div className="text-center py-8">
                      {loginsError instanceof Error && loginsError.message.includes('cancelled') ? (
                        <>
                          <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                          <p className="text-sm text-slate-500">Request was cancelled</p>
                          <p className="text-xs text-slate-400 mt-2">This may happen when switching tabs</p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-300" />
                          <p className="font-medium text-red-600">Error loading login data</p>
                          <p className="text-sm text-red-500 mt-2">
                            {loginsError instanceof Error ? loginsError.message : "Unknown error occurred"}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Please check if the API endpoint is available or try refreshing the page.
                          </p>
                        </>
                      )}
                    </div>
                  ) : recentLogins && recentLogins.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recentLogins.map((login: any) => (
                        <div key={login.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-embodied-blue text-white flex items-center justify-center text-sm font-medium">
                              {login.userFirstName?.[0]}{login.userLastName?.[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {login.userFirstName} {login.userLastName}
                              </p>
                              <p className="text-xs text-slate-600">{login.userEmail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {format(new Date(login.loginAt), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-slate-400">
                              {format(new Date(login.loginAt), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No login data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Module Completion Statistics */}
              {moduleStats && moduleStats.modules && moduleStats.modules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Module Completion Statistics
                    </CardTitle>
                    <CardDescription>Completion rates across all course modules ({moduleStats.totalUsers} total users)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {moduleStats.modules.map((module: any) => (
                        <div key={`${module.stepNumber}-${module.sectionTitle}`} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                Step {module.stepNumber}: {module.sectionTitle}
                              </p>
                              <p className="text-xs text-slate-500">
                                {module.completionCount} users completed ({module.completionPercentage}%)
                              </p>
                            </div>
                            <Badge className="bg-embodied-coral text-white">
                              {module.completionPercentage}%
                            </Badge>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className="bg-embodied-coral h-2 rounded-full transition-all duration-500"
                              style={{ width: `${module.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

           
              {analyticsData?.userStats && analyticsData.userStats.length > 0 && (
            <UserActivityOverview
            userStats={analyticsData.userStats}
            MessagingStrategyButton={MessagingStrategyButton}
            OfferOutlineButton={OfferOutlineButton}
            SalesPageButton={SalesPageButton}
            IgniteDocButton={IgniteDocButton}
          />
        )}
            
            </div>
          )}
        </TabsContent>

        <TabsContent value="learning" className="mt-6">
          {learningLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
            </div>
          ) : learningProgress && learningProgress.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Learning and Progress Tracking
                  </CardTitle>
                  <CardDescription>
                    Monitor module completion, estimated time to finish, and user learning pace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium text-slate-600">User</th>
                          <th className="p-3 text-center text-sm font-medium text-slate-600">Progress</th>
                          <th className="p-3 text-center text-sm font-medium text-slate-600">Completed Sections</th>
                          <th className="p-3 text-center text-sm font-medium text-slate-600">Checklist Items</th>
                          <th className="p-3 text-center text-sm font-medium text-slate-600">Workbook Responses</th>
                          <th className="p-3 text-center text-sm font-medium text-slate-600">Days Active</th>
                          <th className="p-3 text-center text-sm font-medium text-slate-600">Est. Days to Finish</th>
                          <th className="p-3 text-right text-sm font-medium text-slate-600">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {learningProgress.map((user: any) => (
                          <tr 
                            key={user.userId} 
                            className="hover:bg-slate-50 transition-colors"
                            data-testid={`learning-user-${user.userId}`}
                          >
                            <td className="p-3">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-slate-600">{user.email}</p>
                                {user.businessName && (
                                  <p className="text-xs text-slate-500 mt-0.5">{user.businessName}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${user.completionPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-slate-700">
                                  {user.completionPercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {user.completedSections}
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-700">{user.totalChecklistItemsChecked}</td>
                            <td className="p-3 text-center text-slate-700">{user.workbookResponsesCount}</td>
                            <td className="p-3 text-center">
                              <span className="text-slate-700">
                                {user.daysActive > 0 ? user.daysActive : '-'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-slate-700">
                                {user.estimatedDaysToFinish > 0 ? user.estimatedDaysToFinish : '-'}
                              </span>
                            </td>
                            <td className="p-3 text-right text-xs text-slate-600">
                              {user.lastCompletionAt 
                                ? format(new Date(user.lastCompletionAt), 'MMM d, yyyy')
                                : user.lastLoginAt
                                ? format(new Date(user.lastLoginAt), 'MMM d, yyyy')
                                : 'No activity'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">No learning progress data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tools" className="mt-6">
          {toolsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
            </div>
          ) : toolOutputs ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Messaging Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#192231]">{toolOutputs.stats.totalMessagingStrategies}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Funnel Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#192231]">{toolOutputs.stats.totalFunnelTemplates}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Content Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#192231]">{toolOutputs.stats.totalContentStrategies}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Video Scripts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#192231]">{toolOutputs.stats.totalVideoScripts}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Messaging Strategies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Messaging Strategies Generated
                  </CardTitle>
                  <CardDescription>Review all generated messaging strategies</CardDescription>
                </CardHeader>
                <CardContent>
                  {toolOutputs.messagingStrategies && toolOutputs.messagingStrategies.length > 0 ? (
                    <div className="space-y-3">
                      {toolOutputs.messagingStrategies.slice(0, 10).map((strategy: any) => (
                        <StrategyContentDialog
                          key={strategy.id}
                          strategy={strategy}
                          trigger={
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{strategy.title}</p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    User: {strategy.userFirstName} {strategy.userLastName} ({strategy.userEmail})
                                  </p>
                                  <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                                    {strategy.content?.substring(0, 200)}...
                                  </p>
                                </div>
                                <div className="ml-4 flex flex-col items-end gap-2">
                                  <Badge variant="outline">Version {strategy.version}</Badge>
                                  <span className="text-xs text-slate-500">
                                    {format(new Date(strategy.createdAt), 'MMM d, yyyy')}
                                  </span>
                                  <Eye className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-500">No messaging strategies generated yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Funnel Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    Funnel Templates Usage
                  </CardTitle>
                  <CardDescription>Track funnel template creation and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {toolOutputs.funnelTemplates && toolOutputs.funnelTemplates.length > 0 ? (
                    <div className="space-y-3">
                      {toolOutputs.funnelTemplates.slice(0, 10).map((funnel: any) => (
                        <FunnelCopyDialog
                          key={funnel.id}
                          funnel={funnel}
                          trigger={
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">
                                    Funnel Copy - Offer #{funnel.offerNumber}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    User: {funnel.userFirstName} {funnel.userLastName} ({funnel.userEmail})
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="text-xs">
                                      <span className="font-medium text-slate-700">Opt-in:</span>{' '}
                                      <span className={funnel.optInPage ? 'text-green-600' : 'text-slate-400'}>
                                        {funnel.optInPage ? '✓ Generated' : '✗ Not generated'}
                                      </span>
                                    </div>
                                    <div className="text-xs">
                                      <span className="font-medium text-slate-700">Tripwire:</span>{' '}
                                      <span className={funnel.tripwirePage ? 'text-green-600' : 'text-slate-400'}>
                                        {funnel.tripwirePage ? '✓ Generated' : '✗ Not generated'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-xs text-slate-500">
                                    {format(new Date(funnel.createdAt), 'MMM d, yyyy')}
                                  </span>
                                  <Eye className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-500">No funnel templates created yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Content Strategies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Content Strategies
                  </CardTitle>
                  <CardDescription>Review generated content strategies and ideas</CardDescription>
                </CardHeader>
                <CardContent>
                  {toolOutputs.contentStrategies && toolOutputs.contentStrategies.length > 0 ? (
                    <div className="space-y-3">
                      {toolOutputs.contentStrategies.slice(0, 10).map((content: any) => (
                        <ContentStrategyDialog
                          key={content.id}
                          content={content}
                          trigger={
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">Content Strategy</p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    User: {content.userFirstName} {content.userLastName} ({content.userEmail})
                                  </p>
                                  {content.postingCadence && (
                                    <p className="text-xs text-slate-700 mt-2">
                                      <span className="font-medium">Cadence:</span> {content.postingCadence}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4 flex flex-col items-end gap-2">
                                  <Badge variant="outline">Version {content.version}</Badge>
                                  <span className="text-xs text-slate-500">
                                    {format(new Date(content.createdAt), 'MMM d, yyyy')}
                                  </span>
                                  <Eye className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-500">No content strategies generated yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Video Scripts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-600" />
                    Video Scripts
                  </CardTitle>
                  <CardDescription>Review generated video scripts</CardDescription>
                </CardHeader>
                <CardContent>
                  {toolOutputs.videoScripts && toolOutputs.videoScripts.length > 0 ? (
                    <div className="space-y-3">
                      {toolOutputs.videoScripts.slice(0, 10).map((script: any) => (
                        <VideoScriptDialog
                          key={script.id}
                          script={script}
                          trigger={
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">Video Script Generator</p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    User: {script.userFirstName} {script.userLastName} ({script.userEmail})
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs">
                                      <span className="font-medium text-slate-700">Input Method:</span>{' '}
                                      <span className="capitalize">{script.inputMethod || 'Not set'}</span>
                                    </p>
                                    {script.landingPageUrl && (
                                      <p className="text-xs">
                                        <span className="font-medium text-slate-700">URL:</span>{' '}
                                        <span className="text-blue-600 truncate max-w-xs inline-block align-bottom">
                                          {script.landingPageUrl}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className="text-xs text-slate-500">
                                    {format(new Date(script.updatedAt), 'MMM d, yyyy')}
                                  </span>
                                  <Eye className="w-4 h-4 text-slate-400" />
                                </div>
                              </div>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-500">No video scripts generated yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">No tool output data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <ContentManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {usersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
            </div>
          ) : users && users.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage all platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        {/* <TableHead>Active</TableHead> */}
                        <TableHead>Subscription Status</TableHead>
                        {/* <TableHead>End Date</TableHead>
                        <TableHead>Days Left</TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users
                        .slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage)
                        .map((user) => {
                          const endDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const daysLeft = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                          
                          const status = user.isActive

                          return (
                            <TableRow 
                              key={user.id}
                              onClick={() => setLocation(`/admin/users/${user.id}`)}
                              className="cursor-pointer hover:bg-muted/50"
                            >
                              <TableCell>
                                <div className="font-medium">
                                  {user.firstName || user.lastName
                                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                    : 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              {/* <TableCell>
                                <Badge variant={status === true ? 'default' : 'secondary'}>
                                  {status}
                                </Badge>
                              </TableCell> */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {updatingUserId === user.id ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-[#4593ed] border-t-transparent rounded-full" />
                                  ) : (
                                    <Switch
                                      checked={user.isActive !== false}
                                      onCheckedChange={() => handleToggleUserStatus(user.id, user.isActive !== false)}
                                      data-testid={`switch-user-active-${user.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <span className="text-sm text-slate-600 dark:text-slate-300">
                                    {status!== false ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                                  {user.subscriptionStatus || 'N/A'}
                                </Badge>
                              </TableCell>
                              {/* <TableCell>
                                {endDate ? format(endDate, 'MMM d, yyyy') : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {daysLeft !== null ? (
                                  <span className={daysLeft < 0 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-slate-600'}>
                                    {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                                  </span>
                                ) : 'N/A'}
                              </TableCell> */}
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
                {users.length > usersPerPage && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      Showing {(usersPage - 1) * usersPerPage + 1} to {Math.min(usersPage * usersPerPage, users.length)} of {users.length} users
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setUsersPage((prev) => Math.max(1, prev - 1))}
                            className={usersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.ceil(users.length / usersPerPage) }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setUsersPage(page)}
                              isActive={usersPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setUsersPage((prev) => Math.min(Math.ceil(users.length / usersPerPage), prev + 1))}
                            className={usersPage >= Math.ceil(users.length / usersPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-slate-500">
                  No users found
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
