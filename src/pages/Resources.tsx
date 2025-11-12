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
  Copy,
  Download,
  Calendar,
  Send,
  FileImage,
  Layout,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OfferOutlinePanel from '@/components/OfferOutlinePanel';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

// Messaging strategy formatting component - matches InteractiveStep version exactly
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
                  <strong key={partIndex} className="font-bold text-slate-900">
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
                  <strong key={partIndex} className="font-bold text-slate-900">
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

export default function Resources() {
  const { user } = useAuth();
  const userId = user?.id || 1;
  const [messagingStrategy, setMessagingStrategy] = useState<string>("");
  const [salesPageContent, setSalesPageContent] = useState<string>("");
  const [editingStrategy, setEditingStrategy] = useState(false);
  const [editingSalesPage, setEditingSalesPage] = useState(false);
  const [activeTab, setActiveTab] = useState("messaging");
  const { toast } = useToast();

  // Fetch funnel optimization documents from database
  const { data: allDocs = [], isLoading: isFunnelDocsLoading } = useQuery<any[]>({
    queryKey: ['/api/ignite-docs', 'user', userId],
    enabled: !!userId,
  });

  // Filter for funnel optimization documents
  const funnelOptDocs = allDocs.filter((doc: any) => doc.docType === 'funnel_optimization');
  
  // Filter for launch registration funnel documents
  const launchFunnelDocs = allDocs.filter((doc: any) => doc.docType === 'launch_registration_funnel');
  
  // Filter for sales page documents
  const salesPageDocs = allDocs.filter((doc: any) => doc.docType === 'sales_page');

  // Load messaging strategy from localStorage
  useEffect(() => {
    const savedStrategy = localStorage.getItem('generated-messaging-strategy');
    
    if (savedStrategy) {
      try {
        // Try to parse as JSON first (new format)
        const parsed = JSON.parse(savedStrategy);
        const content = parsed.content || parsed;
        setMessagingStrategy(content);
      } catch (error) {
        // Fallback to plain string (old format)
        setMessagingStrategy(savedStrategy);
      }
    }
  }, []);

  // Load sales page from localStorage - check multiple possible keys
  useEffect(() => {
    // Check multiple possible storage keys used by different sales page generators
    const possibleKeys = [
      `generatedSalesPage_${userId}`,
      `emotionalSalesPage_${userId}`,
      `simplifiedSalesPage_${userId}`,
      'generated-sales-page',
      'emotional-sales-page'
    ];
    
    for (const key of possibleKeys) {
      const savedSalesPage = localStorage.getItem(key);
      if (savedSalesPage && savedSalesPage.trim().length > 50) {
        setSalesPageContent(savedSalesPage);
        break;
      }
    }
  }, [userId]);

  const saveMessagingStrategy = () => {
    // Save in the same format as InteractiveStep component
    const strategyData = {
      content: messagingStrategy,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('generated-messaging-strategy', JSON.stringify(strategyData));
    setEditingStrategy(false);
    toast({
      title: "Messaging strategy saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const saveSalesPage = () => {
    // Save to multiple keys to ensure compatibility with different generators
    localStorage.setItem(`generatedSalesPage_${userId}`, salesPageContent);
    localStorage.setItem(`emotionalSalesPage_${userId}`, salesPageContent);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">Your Resources</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Access and edit your generated messaging strategy, offer outline, and sales page with full editing capabilities
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-8 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 h-16 p-0">
                <TabsTrigger 
                  value="messaging" 
                  className="flex items-center gap-3 data-[state=active]:bg-coral-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Messaging Strategy</span>
                  <span className="sm:hidden">Messaging</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="offer" 
                  className="flex items-center gap-3 data-[state=active]:bg-coral-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                >
                  <Gift className="w-5 h-5" />
                  <span className="hidden sm:inline">Offer Outline</span>
                  <span className="sm:hidden">Offer</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sales" 
                  className="flex items-center gap-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                >
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">Sales Page</span>
                  <span className="sm:hidden">Sales</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ad-request" 
                  className="flex items-center gap-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                  data-testid="tab-ad-request"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Monthly Ad Request</span>
                  <span className="sm:hidden">Ad Request</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ghl-templates" 
                  className="flex items-center gap-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                  data-testid="tab-ghl-templates"
                >
                  <Layout className="w-5 h-5" />
                  <span className="hidden sm:inline">GHL Templates</span>
                  <span className="sm:hidden">GHL</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="planning" 
                  className="flex items-center gap-3 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                  data-testid="tab-planning-resources"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="hidden sm:inline">Planning Resources</span>
                  <span className="sm:hidden">Planning</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="funnel-optimization" 
                  className="flex items-center gap-3 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                  data-testid="tab-funnel-optimization"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="hidden sm:inline">Funnel Optimization</span>
                  <span className="sm:hidden">Funnel</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="launch-funnel" 
                  className="flex items-center gap-3 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-none h-16 text-base font-medium"
                  data-testid="tab-launch-funnel"
                >
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">Launch Funnel</span>
                  <span className="sm:hidden">Launch</span>
                </TabsTrigger>
              </TabsList>

              {/* Messaging Strategy Tab */}
              <TabsContent value="messaging" className="p-8">
                {messagingStrategy ? (
                  <Card className="border-coral-200 bg-gradient-to-r from-coral-50 to-indigo-50 shadow-lg">
                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-coral-500 rounded-full"></div>
                          <CardTitle className="text-2xl text-coral-900">Your Messaging Strategy</CardTitle>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Generated
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => setEditingStrategy(!editingStrategy)}
                            className="border-coral-300 text-coral-700 hover:bg-coral-100 px-6"
                          >
                            {editingStrategy ? "Save Changes" : "Edit Strategy"}
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => copyToClipboard(messagingStrategy)}
                            className="border-coral-300 text-coral-700 hover:bg-coral-100"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => downloadAsFile(messagingStrategy, 'messaging-strategy.txt')}
                            className="border-coral-300 text-coral-700 hover:bg-coral-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <p className="text-coral-700 text-lg">
                        Your comprehensive messaging strategy created from your workbook responses. Edit anytime to refine your brand messaging.
                      </p>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="bg-white rounded-xl border border-coral-200 p-8 shadow-sm">
                        {editingStrategy ? (
                          <div className="space-y-6">
                            <textarea
                              className="w-full border-2 border-coral-300 rounded-lg p-6 min-h-[500px] focus:outline-none focus:ring-4 focus:ring-coral-200 transition-all resize-none font-mono text-sm"
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
                              placeholder="Enter your messaging strategy content here..."
                            />
                            
                            <div className="flex justify-between items-center pt-6 border-t border-coral-200">
                              <div className="text-sm text-coral-600 flex items-center">
                                Press Ctrl+Enter to save, Esc to cancel
                              </div>
                              <div className="flex space-x-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingStrategy(false)}
                                  size="default"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={saveMessagingStrategy}
                                  size="default"
                                  className="bg-coral-600 hover:bg-coral-700 px-8"
                                >
                                  Save Changes
                                </Button>
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
                  <Card className="border-slate-200 shadow-lg">
                    <CardContent className="pt-12">
                      <div className="text-center space-y-6">
                        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto" />
                        <h3 className="text-2xl font-medium text-slate-900">No Messaging Strategy Found</h3>
                        <p className="text-slate-600 text-lg max-w-md mx-auto">
                          Generate your messaging strategy from the "Your Messaging" section first.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Offer Outline Tab */}
              <TabsContent value="offer" className="p-8">
                <OfferOutlinePanel userId={userId} stepNumber={2} />
              </TabsContent>

              {/* Sales Page Tab */}
              <TabsContent value="sales" className="p-8">
                {salesPageContent ? (
                  <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <CardTitle className="text-2xl text-blue-900">Your Sales Page</CardTitle>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Generated
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => setEditingSalesPage(!editingSalesPage)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-100 px-6"
                          >
                            {editingSalesPage ? "Save Changes" : "Edit Sales Page"}
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => copyToClipboard(salesPageContent)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => downloadAsFile(salesPageContent, 'sales-page.txt')}
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <p className="text-blue-700 text-lg">
                        Your complete sales page generated from your messaging strategy and offer outline. Edit anytime to refine your copy.
                      </p>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="bg-white rounded-xl border border-blue-200 p-8 shadow-sm">
                        {editingSalesPage ? (
                          <div className="space-y-6">
                            <div 
                              className="border-2 border-blue-300 rounded-lg p-6 min-h-[500px] focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all"
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
                            
                            <div className="flex justify-between items-center pt-6 border-t border-blue-200">
                              <div className="text-sm text-blue-600 flex items-center">
                                Press Ctrl+Enter to save, Esc to cancel
                              </div>
                              <div className="flex space-x-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingSalesPage(false)}
                                  size="default"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={saveSalesPage}
                                  size="default"
                                  className="bg-blue-600 hover:bg-blue-700 px-8"
                                >
                                  Save Changes
                                </Button>
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
                  <Card className="border-slate-200 shadow-lg">
                    <CardContent className="pt-12">
                      <div className="text-center space-y-6">
                        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto" />
                        <h3 className="text-2xl font-medium text-slate-900">No Sales Page Found</h3>
                        <p className="text-slate-600 text-lg max-w-md mx-auto">
                          Generate your sales page from the "Build Your Offer" section first.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Monthly Ad Request Tab */}
              <TabsContent value="ad-request" className="p-8">
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <CardTitle className="text-2xl text-purple-900">Monthly Ad Request</CardTitle>
                    </div>
                    <p className="text-purple-700 text-lg">
                      Submit your monthly ad creative requests to our team. We'll create professional ads to help you promote your offers.
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="bg-white rounded-xl border border-purple-200 p-8 shadow-sm">
                      <div className="space-y-6">
                        {/* Request Form */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Ad Type
                            </label>
                            <select 
                              className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              data-testid="select-ad-type"
                            >
                              <option value="">Select ad type...</option>
                              <option value="social">Social Media Ad</option>
                              <option value="display">Display Ad</option>
                              <option value="video">Video Ad</option>
                              <option value="carousel">Carousel Ad</option>
                              <option value="story">Story Ad</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Campaign Objective
                            </label>
                            <input
                              type="text"
                              className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              placeholder="e.g., Drive registrations for webinar, Promote tripwire offer..."
                              data-testid="input-campaign-objective"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Target Audience
                            </label>
                            <input
                              type="text"
                              className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              placeholder="e.g., Busy moms, fitness enthusiasts, small business owners..."
                              data-testid="input-target-audience"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Key Message / Offer
                            </label>
                            <textarea
                              className="w-full border-2 border-slate-300 rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                              placeholder="Describe the key message or offer you want to promote..."
                              data-testid="textarea-key-message"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Ad Dimensions / Platform
                            </label>
                            <select 
                              className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              data-testid="select-platform"
                            >
                              <option value="">Select platform...</option>
                              <option value="facebook">Facebook Feed (1080x1080)</option>
                              <option value="instagram">Instagram Feed (1080x1080)</option>
                              <option value="instagram-story">Instagram Story (1080x1920)</option>
                              <option value="linkedin">LinkedIn (1200x627)</option>
                              <option value="google-display">Google Display (Various)</option>
                              <option value="youtube">YouTube (1920x1080)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Brand Colors (Optional)
                            </label>
                            <input
                              type="text"
                              className="w-full border-2 border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              placeholder="e.g., #FF6B6B, #4ECDC4, or coral and teal..."
                              data-testid="input-brand-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Image Preferences / References
                            </label>
                            <textarea
                              className="w-full border-2 border-slate-300 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                              placeholder="Describe any image style preferences, reference links, or visual direction..."
                              data-testid="textarea-image-preferences"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Additional Notes
                            </label>
                            <textarea
                              className="w-full border-2 border-slate-300 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                              placeholder="Any other details or special requirements..."
                              data-testid="textarea-additional-notes"
                            />
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 border-t border-slate-200">
                          <Button 
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                            data-testid="button-submit-ad-request"
                          >
                            <Send className="w-5 h-5 mr-2" />
                            Submit Ad Request
                          </Button>
                        </div>

                        {/* Info Notice */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start space-x-3">
                            <FileImage className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div className="text-sm text-purple-800">
                              <p className="font-semibold mb-1">Request Processing</p>
                              <p>Your ad request will be reviewed by our creative team. We'll reach out within 2-3 business days with your custom ad creative or any clarifying questions.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GHL Templates Tab */}
              <TabsContent value="ghl-templates" className="p-8">
                <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <CardTitle className="text-2xl text-orange-900">GHL Templates</CardTitle>
                    </div>
                    <p className="text-orange-700 text-lg">
                      Access pre-built GoHighLevel templates, snapshots, and workflows to accelerate your business setup.
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="bg-white rounded-xl border border-orange-200 p-8 shadow-sm">
                      <div className="text-center space-y-6">
                        <Layout className="w-16 h-16 text-orange-400 mx-auto" />
                        <h3 className="text-2xl font-medium text-slate-900">Coming Soon</h3>
                        <p className="text-slate-600 text-lg max-w-md mx-auto">
                          GoHighLevel templates and snapshots will be available here to help you quickly set up funnels, automations, and workflows.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Planning Resources Tab */}
              <TabsContent value="planning" className="p-8">
                <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <CardTitle className="text-2xl text-green-900">Planning Resources</CardTitle>
                    </div>
                    <p className="text-green-700 text-lg">
                      Access your planning tools, templates, and strategic resources to help you implement your offers effectively.
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="bg-white rounded-xl border border-green-200 p-8 shadow-sm">
                      <div className="text-center space-y-6">
                        <Calendar className="w-16 h-16 text-green-400 mx-auto" />
                        <h3 className="text-2xl font-medium text-slate-900">Coming Soon</h3>
                        <p className="text-slate-600 text-lg max-w-md mx-auto">
                          Planning resources and templates will be added here to help you execute your business strategy.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Funnel Optimization Tab */}
              <TabsContent value="funnel-optimization" className="p-8">
                <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <CardTitle className="text-2xl text-indigo-900">Funnel Optimization Suggestions</CardTitle>
                    </div>
                    <p className="text-indigo-700 text-lg">
                      View your saved funnel optimization suggestions and recommendations from the Track & Optimize section.
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-6">
                    {isFunnelDocsLoading ? (
                      <div className="bg-white rounded-xl border border-indigo-200 p-8 shadow-sm">
                        <div className="text-center space-y-4">
                          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                          <p className="text-slate-600">Loading funnel optimization documents...</p>
                        </div>
                      </div>
                    ) : funnelOptDocs.length === 0 ? (
                      <div className="bg-white rounded-xl border border-indigo-200 p-8 shadow-sm">
                        <div className="text-center space-y-6">
                          <TrendingUp className="w-16 h-16 text-indigo-400 mx-auto" />
                          <h3 className="text-2xl font-medium text-slate-900">No Saved Suggestions Yet</h3>
                          <p className="text-slate-600 text-lg max-w-md mx-auto">
                            Go to the Track & Optimize section, analyze your funnel metrics, and save your optimization suggestions to see them here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {funnelOptDocs.map((doc: any) => (
                          <Card key={doc.id} className="bg-white border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-slate-900">{doc.title}</CardTitle>
                                <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  {new Date(doc.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none text-slate-700">
                                <FormattedMessagingStrategy content={doc.contentMarkdown || ''} />
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(doc.contentMarkdown || '')}
                                  className="gap-2"
                                  data-testid={`button-copy-funnel-opt-${doc.id}`}
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
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
                                  className="gap-2"
                                  data-testid={`button-download-funnel-opt-${doc.id}`}
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Launch Registration Funnel Tab */}
              <TabsContent value="launch-funnel" className="p-8">
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <CardTitle className="text-2xl text-purple-900">Launch Registration Funnel Copy</CardTitle>
                    </div>
                    <p className="text-purple-700 text-lg">
                      View your generated launch registration funnel copy including opt-in and thank you pages.
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-6">
                    {isFunnelDocsLoading ? (
                      <div className="bg-white rounded-xl border border-purple-200 p-8 shadow-sm">
                        <div className="text-center space-y-4">
                          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                          <p className="text-slate-600">Loading launch funnel documents...</p>
                        </div>
                      </div>
                    ) : launchFunnelDocs.length === 0 ? (
                      <div className="bg-white rounded-xl border border-purple-200 p-8 shadow-sm">
                        <div className="text-center space-y-6">
                          <FileText className="w-16 h-16 text-purple-400 mx-auto" />
                          <h3 className="text-2xl font-medium text-slate-900">No Saved Launch Funnel Copy Yet</h3>
                          <p className="text-slate-600 text-lg max-w-md mx-auto">
                            Go to Build Your Strategy → Copy Generator → Launch Registration Funnel and generate your copy to see it here.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {launchFunnelDocs.map((doc: any) => (
                          <Card key={doc.id} className="bg-white border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-slate-900">{doc.title}</CardTitle>
                                <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                                  {new Date(doc.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none text-slate-700">
                                <FormattedMessagingStrategy content={doc.contentMarkdown || ''} />
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(doc.contentMarkdown || '')}
                                  className="gap-2"
                                  data-testid={`button-copy-launch-funnel-${doc.id}`}
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
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
                                  className="gap-2"
                                  data-testid={`button-download-launch-funnel-${doc.id}`}
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Sales Page Copy Section */}
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg mt-6">
                      <CardHeader className="pb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <CardTitle className="text-2xl text-blue-900">Sales Page Copy</CardTitle>
                        </div>
                        <p className="text-blue-700 text-lg">
                          View your generated sales page copy from the Copy Generator.
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-6">
                        {isFunnelDocsLoading ? (
                          <div className="bg-white rounded-xl border border-blue-200 p-8 shadow-sm">
                            <div className="text-center space-y-4">
                              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                              <p className="text-slate-600">Loading sales page documents...</p>
                            </div>
                          </div>
                        ) : salesPageDocs.length === 0 ? (
                          <div className="bg-white rounded-xl border border-blue-200 p-8 shadow-sm">
                            <div className="text-center space-y-6">
                              <FileText className="w-16 h-16 text-blue-400 mx-auto" />
                              <h3 className="text-2xl font-medium text-slate-900">No Saved Sales Page Copy Yet</h3>
                              <p className="text-slate-600 text-lg max-w-md mx-auto">
                                Go to Build Your Strategy → Copy Generator → Sales Page and generate your copy to see it here.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {salesPageDocs.map((doc: any) => (
                              <Card key={doc.id} className="bg-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold text-slate-900">{doc.title}</CardTitle>
                                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                                      {new Date(doc.createdAt).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="prose prose-sm max-w-none text-slate-700">
                                    <FormattedMessagingStrategy content={doc.contentMarkdown || ''} />
                                  </div>
                                  <div className="flex gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => copyToClipboard(doc.contentMarkdown || '')}
                                      className="gap-2"
                                      data-testid={`button-copy-sales-page-${doc.id}`}
                                    >
                                      <Copy className="w-4 h-4" />
                                      Copy
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
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
                                      className="gap-2"
                                      data-testid={`button-download-sales-page-${doc.id}`}
                                    >
                                      <Download className="w-4 h-4" />
                                      Download
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
