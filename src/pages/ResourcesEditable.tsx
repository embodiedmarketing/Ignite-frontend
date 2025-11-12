import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  MessageCircle, 
  Gift, 
  FileText,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

interface EditableResource {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  content: string;
  completeness: number;
  storageKey: string;
  generateFn?: () => string;
}

export default function ResourcesEditable() {
  const [activeTab, setActiveTab] = useState('messaging-guide');
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || 1;

  // Fetch IGNITE Docs from database
  const { data: allDocs = [], isLoading: isDocsLoading } = useQuery<any[]>({
    queryKey: ['/api/ignite-docs', 'user', userId],
    enabled: !!userId,
  });

  // Filter for sales page documents from database
  const salesPageDocs = allDocs.filter((doc: any) => doc.docType === 'sales_page');

  // Get messaging strategy from localStorage
  const getMessagingStrategy = (): string => {
    try {
      const stored = localStorage.getItem('generated-messaging-strategy');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.strategy || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  // Get offer outline from localStorage
  const getOfferOutline = (): string => {
    try {
      const stored = localStorage.getItem('generated-offer-outline');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.outline || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  // Get sales page from localStorage
  const getSalesPage = (): string => {
    try {
      const stored = localStorage.getItem('generated-sales-page');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.content || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  // Calculate completeness based on content length
  const calculateCompleteness = (content: string): number => {
    if (!content || content.trim().length === 0) return 0;
    if (content.length < 500) return 25;
    if (content.length < 1500) return 50;
    if (content.length < 3000) return 75;
    return 100;
  };

  // Resources configuration
  const resources: EditableResource[] = [
    {
      id: 'messaging-guide',
      title: 'Messaging Strategy',
      icon: MessageCircle,
      description: 'Your complete messaging strategy with positioning, brand voice, and customer avatar',
      content: getMessagingStrategy(),
      completeness: calculateCompleteness(getMessagingStrategy()),
      storageKey: 'generated-messaging-strategy'
    },
    {
      id: 'offer-outline',
      title: 'Offer Outline',
      icon: Gift,
      description: 'Your structured offer with components, pricing, and positioning',
      content: getOfferOutline(),
      completeness: calculateCompleteness(getOfferOutline()),
      storageKey: 'generated-offer-outline'
    },
    {
      id: 'sales-page',
      title: 'Sales Page',
      icon: FileText,
      description: 'Your complete sales page with headlines, copy, and call-to-actions',
      content: getSalesPage(),
      completeness: calculateCompleteness(getSalesPage()),
      storageKey: 'generated-sales-page'
    }
  ];

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (completeness >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (completeness >= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  const getCompletenessIcon = (completeness: number) => {
    if (completeness >= 75) return CheckCircle;
    if (completeness >= 50) return AlertCircle;
    return FileText;
  };

  const startEditing = (resourceId: string, content: string) => {
    setEditingResource(resourceId);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingResource(null);
    setEditContent('');
  };

  const saveEdits = (resource: EditableResource) => {
    try {
      // Update the stored content based on the resource type
      if (resource.storageKey === 'generated-messaging-strategy') {
        const existing = JSON.parse(localStorage.getItem(resource.storageKey) || '{}');
        existing.strategy = editContent;
        localStorage.setItem(resource.storageKey, JSON.stringify(existing));
      } else if (resource.storageKey === 'generated-offer-outline') {
        const existing = JSON.parse(localStorage.getItem(resource.storageKey) || '{}');
        existing.outline = editContent;
        localStorage.setItem(resource.storageKey, JSON.stringify(existing));
      } else if (resource.storageKey === 'generated-sales-page') {
        const existing = JSON.parse(localStorage.getItem(resource.storageKey) || '{}');
        existing.content = editContent;
        localStorage.setItem(resource.storageKey, JSON.stringify(existing));
      }
      
      setEditingResource(null);
      setEditContent('');
      
      toast({
        title: "Changes Saved",
        description: `Your ${resource.title.toLowerCase()} has been updated.`,
      });
      
      // Force re-render by updating state
      window.location.reload();
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your changes.",
        variant: "destructive",
      });
    }
  };

  const downloadResource = (resource: EditableResource) => {
    const content = editingResource === resource.id ? editContent : resource.content;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (content: string, title: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: `${title} has been copied to your clipboard.`,
      });
    });
  };

  const formatContent = (content: string) => {
    if (!content) return '';
    
    // Split content into lines and format with proper spacing
    return content.split('\n').map((line, index) => {
      // Handle headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold text-slate-900 mt-6 mb-4 first:mt-0">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold text-slate-800 mt-5 mb-3">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-medium text-slate-700 mt-4 mb-2">{line.substring(4)}</h3>;
      }
      
      // Handle bullet points
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 text-slate-700">{line.substring(2)}</li>;
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-3 text-slate-700 leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
            )}
          </p>
        );
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <div key={index} className="mb-2"></div>;
      }
      
      // Regular paragraphs
      return <p key={index} className="mb-3 text-slate-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Your Generated Resources</h1>
        <p className="text-slate-600 mt-2">
          View and edit your finalized documents with the same editing power as the rest of the app
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {resources.map((resource) => {
            const IconComponent = resource.icon;
            const CompletenessIcon = getCompletenessIcon(resource.completeness);
            
            return (
              <TabsTrigger 
                key={resource.id} 
                value={resource.id}
                className="flex items-center gap-2 px-4 py-2"
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{resource.title}</span>
                <CompletenessIcon className="w-3 h-3 text-slate-400" />
              </TabsTrigger>
            );
          })}
        </TabsList>

        {resources.map((resource) => (
          <TabsContent key={resource.id} value={resource.id} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <resource.icon className="w-6 h-6 text-blue-600" />
                    <div>
                      <CardTitle className="text-xl">{resource.title}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{resource.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getCompletenessColor(resource.completeness)} border`}>
                      {resource.completeness}% Complete
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {!resource.content ? (
                  <div className="text-center py-12 bg-slate-50 rounded-lg">
                    <resource.icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No Content Generated Yet</h3>
                    <p className="text-slate-500 mb-4">
                      Complete the relevant sections to generate your {resource.title.toLowerCase()}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2 pb-4 border-b">
                      {editingResource === resource.id ? (
                        <>
                          <Button
                            onClick={() => saveEdits(resource)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => startEditing(resource.id, resource.content)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => copyToClipboard(resource.content, resource.title)}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            onClick={() => downloadResource(resource)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Content Display/Editing */}
                    {editingResource === resource.id ? (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-600 font-medium">
                          Editing {resource.title} - Make your changes below:
                        </p>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          spellCheck={true}
                          placeholder={`Edit your ${resource.title.toLowerCase()} content here...`}
                        />
                        <p className="text-xs text-slate-500">
                          Use Ctrl+Enter to save, Esc to cancel. Changes are saved to your browser storage.
                        </p>
                      </div>
                    ) : (
                      <div className="prose prose-slate max-w-none">
                        {formatContent(resource.content)}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Sales Page Documents from Database */}
      {salesPageDocs.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Live Launch - Sales Page Copy</h2>
            <p className="text-slate-600 mt-2">
              Generated sales page copies from your Copy Generator (automatically saved from Live Launch section)
            </p>
          </div>

          <div className="space-y-4">
            {salesPageDocs.map((doc: any) => (
              <Card key={doc.id} className="bg-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <CardTitle className="text-xl">{doc.title}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          Generated on {new Date(doc.createdAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                      Sales Page
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2 pb-4 border-b">
                      <Button
                        onClick={() => copyToClipboard(doc.contentMarkdown || '', doc.title)}
                        size="sm"
                        variant="outline"
                        data-testid={`button-copy-sales-page-${doc.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        onClick={() => {
                          const blob = new Blob([doc.contentMarkdown || ''], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        size="sm"
                        variant="outline"
                        data-testid={`button-download-sales-page-${doc.id}`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    {/* Content Display */}
                    <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-lg">
                      {formatContent(doc.contentMarkdown || '')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
