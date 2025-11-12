import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Gift, 
  FileText,
  CheckCircle,
  AlertCircle,
  Edit,
  Copy,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OfferOutlinePanel from '@/components/OfferOutlinePanel';
import { useMessagingStrategy } from '@/hooks/useDatabasePersistence';

// Import the exact formatting components from other pages
function FormattedMessagingStrategy({ content }: { content: string }) {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Handle main headers (# Header)
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b-2 border-coral-200">
            {line.replace('# ', '')}
          </h1>
        );
      }
      
      // Handle subheaders (## Header)
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3 text-coral-800">
            {line.replace('## ', '')}
          </h2>
        );
      }
      
      // Handle section headers (### Header)
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-slate-700 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      
      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/);
        return (
          <p key={index} className="mb-3 leading-relaxed text-slate-700">
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
      }
      
      // Handle italic text (*text*)
      if (line.includes('*') && !line.startsWith('*') && line.length > 1) {
        const parts = line.split(/(\*.*?\*)/);
        return (
          <p key={index} className="mb-2 leading-relaxed text-slate-600 italic">
            {parts.map((part, partIndex) => {
              if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return (
                  <em key={partIndex} className="text-slate-500">
                    {part.replace(/\*/g, '')}
                  </em>
                );
              }
              return part;
            })}
          </p>
        );
      }
      
      // Handle horizontal rules (---)
      if (line.trim() === '---') {
        return <hr key={index} className="my-6 border-coral-200" />;
      }
      
      // Handle bullet points (- item)
      if (line.trim().startsWith('- ')) {
        return (
          <li key={index} className="mb-1 text-slate-700 ml-4">
            {line.replace(/^- /, '')}
          </li>
        );
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <div key={index} className="mb-2" />;
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="mb-3 leading-relaxed text-slate-700">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-none">
      {formatContent(content)}
    </div>
  );
}

function FormattedSalesPage({ content }: { content: string }) {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Handle main headers (# Header)
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-3xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b-2 border-blue-200">
            {line.replace('# ', '')}
          </h1>
        );
      }
      
      // Handle subheaders (## Header)
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-bold text-slate-800 mt-6 mb-3 text-blue-800">
            {line.replace('## ', '')}
          </h2>
        );
      }
      
      // Handle section headers (### Header)
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl font-semibold text-slate-700 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      
      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.*?\*\*)/);
        return (
          <p key={index} className="mb-3 leading-relaxed text-slate-700">
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
      }
      
      // Handle CTA buttons (marked with [CTA])
      if (line.includes('[CTA]')) {
        return (
          <div key={index} className="my-6 text-center">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-coral-600 text-white font-bold py-4 px-8 rounded-lg text-lg">
              {line.replace('[CTA]', '').trim()}
            </div>
          </div>
        );
      }
      
      // Handle bullet points (- item)
      if (line.trim().startsWith('- ')) {
        return (
          <li key={index} className="mb-1 text-slate-700 ml-4">
            {line.replace(/^- /, '')}
          </li>
        );
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <div key={index} className="mb-2" />;
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="mb-3 leading-relaxed text-slate-700">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-none prose prose-lg">
      {formatContent(content)}
    </div>
  );
}

interface ResourcesProps {
  userId?: number;
}

export default function Resources({ userId = 1 }: ResourcesProps) {
  const [messagingStrategy, setMessagingStrategy] = useState<string>("");
  const [salesPageContent, setSalesPageContent] = useState<string>("");
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [editingSalesPage, setEditingSalesPage] = useState(false);
  const [activeTab, setActiveTab] = useState("messaging");
  const { toast } = useToast();

  // Use database hooks for messaging strategy
  const { activeStrategy, updateStrategy } = useMessagingStrategy(userId);

  // Load messaging strategy from database with localStorage fallback
  useEffect(() => {
    if (activeStrategy?.content) {
      setMessagingStrategy(activeStrategy.content);
    } else {
      // Fallback to localStorage during migration period
      const savedStrategy = localStorage.getItem('generated-messaging-strategy');
      if (savedStrategy) {
        try {
          const strategy = JSON.parse(savedStrategy);
          setMessagingStrategy(strategy.content || strategy);
        } catch (error) {
          setMessagingStrategy(savedStrategy);
        }
      }
    }
  }, [activeStrategy]);

  // Load sales page from localStorage
  useEffect(() => {
    const savedSalesPage = localStorage.getItem(`generatedSalesPage_${userId}`);
    if (savedSalesPage) {
      setSalesPageContent(savedSalesPage);
    }
  }, [userId]);

  const saveMessagingStrategy = () => {
    if (activeStrategy?.id) {
      // Update existing strategy in database
      updateStrategy.mutate({
        id: activeStrategy.id,
        updates: {
          content: messagingStrategy
        }
      });
    }
    
    // Keep localStorage backup during migration
    localStorage.setItem('generated-messaging-strategy', JSON.stringify({
      content: messagingStrategy,
      lastUpdated: new Date().toISOString(),
      migratedToDatabase: true
    }));
    
    setEditingStrategy(false);
    toast({
      title: "Messaging strategy saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const saveSalesPage = () => {
    localStorage.setItem(`generatedSalesPage_${userId}`, salesPageContent);
    setEditingSalesPage(false);
    toast({
      title: "Sales page saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try selecting and copying manually.",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Your Resources</h1>
          <p className="text-lg text-slate-600">
            Access and edit your generated messaging strategy, offer outline, and sales page
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messaging Strategy</span>
              <span className="sm:hidden">Messaging</span>
            </TabsTrigger>
            <TabsTrigger value="offer" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Offer Outline</span>
              <span className="sm:hidden">Offer</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Sales Page</span>
              <span className="sm:hidden">Sales</span>
            </TabsTrigger>
          </TabsList>

          {/* Messaging Strategy Tab */}
          <TabsContent value="messaging">
            {messagingStrategy ? (
              <Card className="border-coral-200 bg-gradient-to-r from-coral-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-coral-500 rounded-full"></div>
                      <CardTitle className="text-lg text-coral-900">Your Messaging Strategy</CardTitle>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Generated
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStrategy(!editingStrategy)}
                        className="border-coral-300 text-coral-700 hover:bg-coral-100"
                      >
                        {editingStrategy ? "Save" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(messagingStrategy)}
                        className="border-coral-300 text-coral-700 hover:bg-coral-100"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsFile(messagingStrategy, 'messaging-strategy.txt')}
                        className="border-coral-300 text-coral-700 hover:bg-coral-100"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-coral-700">
                    Your comprehensive messaging strategy created from your workbook responses. Edit anytime to refine your brand messaging.
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="bg-white rounded-lg border border-coral-200 p-6">
                    {editingStrategy ? (
                      <div className="space-y-4">
                        <textarea
                          className="w-full border-2 border-coral-300 rounded-lg p-4 min-h-[400px] focus:outline-none focus:ring-4 focus:ring-coral-200 transition-all resize-none"
                          value={messagingStrategy}
                          onChange={(e) => setMessagingStrategy(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              saveMessagingStrategy();
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              setEditingStrategy(false);
                            }
                          }}
                          spellCheck={true}
                          placeholder="Edit your messaging strategy content here..."
                        />
                        <div className="text-sm text-coral-600 flex items-center">
                          Press Ctrl+Enter to save, Esc to cancel
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4 border-t border-coral-200">
                          <Button
                            variant="outline"
                            onClick={() => setEditingStrategy(false)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={saveMessagingStrategy}
                            size="sm"
                            className="bg-coral-600 hover:bg-coral-700"
                          >
                            Save Changes
                          </Button>
                          <div className="text-xs text-coral-600 flex items-center ml-2">
                            Press Ctrl+Enter to save, Esc to cancel
                          </div>
                        </div>
                      </div>
                    ) : (
                      <FormattedMessagingStrategy content={messagingStrategy} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
                    <h3 className="text-lg font-medium text-slate-900">No Messaging Strategy Found</h3>
                    <p className="text-slate-600">
                      Generate your messaging strategy from the "Your Messaging" section first.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Offer Outline Tab */}
          <TabsContent value="offer">
            <OfferOutlinePanel userId={userId} stepNumber={2} />
          </TabsContent>

          {/* Sales Page Tab */}
          <TabsContent value="sales">
            {salesPageContent ? (
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <CardTitle className="text-lg text-blue-900">Your Sales Page</CardTitle>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Generated
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSalesPage(!editingSalesPage)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {editingSalesPage ? "Save" : "Edit"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(salesPageContent)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsFile(salesPageContent, 'sales-page.txt')}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">
                    Your complete sales page generated from your messaging strategy and offer outline. Edit anytime to refine your copy.
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="bg-white rounded-lg border border-blue-200 p-6">
                    {editingSalesPage ? (
                      <div className="space-y-4">
                        <div 
                          className="border border-blue-300 rounded p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-400"
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            setSalesPageContent(e.currentTarget.innerHTML);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              saveSalesPage();
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              setEditingSalesPage(false);
                            }
                          }}
                          style={{
                            whiteSpace: 'pre-wrap',
                          }}
                          spellCheck={true}
                          dangerouslySetInnerHTML={{ __html: salesPageContent }}
                        />
                        
                        <div className="flex justify-end space-x-2 pt-4 border-t border-blue-200">
                          <Button
                            variant="outline"
                            onClick={() => setEditingSalesPage(false)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={saveSalesPage}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Save Changes
                          </Button>
                          <div className="text-xs text-blue-600 flex items-center ml-2">
                            Press Ctrl+Enter to save, Esc to cancel
                          </div>
                        </div>
                      </div>
                    ) : (
                      <FormattedSalesPage content={salesPageContent} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
                    <h3 className="text-lg font-medium text-slate-900">No Sales Page Found</h3>
                    <p className="text-slate-600">
                      Generate your sales page from the "Build Your Offer" section first.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
