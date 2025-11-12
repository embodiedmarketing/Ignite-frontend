import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  MessageCircle, 
  Gift, 
  Settings, 
  Target, 
  Users, 
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ResourceDocument {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  content: string;
  completeness: number;
  lastUpdated: Date;
  source: string;
}

export default function Resources() {
  const [documents, setDocuments] = useState<ResourceDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Helper functions for data retrieval
  const getWorkbookResponses = (section: string): Record<string, string> => {
    try {
      const stored = localStorage.getItem(`workbook-responses-${section}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const getAllResponses = (): Record<string, string> => {
    const allResponses: Record<string, string> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('workbook-responses') || key.includes('step-'))) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            Object.assign(allResponses, parsed);
          }
        } catch {
          continue;
        }
      }
    }
    
    return allResponses;
  };

  const formatTitle = (key: string): string => {
    const mappings: Record<string, string> = {
      'customer-avatar-0': 'Primary Customer Description',
      'customer-avatar-1': 'Customer Pain Points',
      'positioning-0': 'Core Positioning Statement',
      'brand-voice-0': 'Brand Personality',
      'offer-foundation-0': 'Core Transformation',
      'offer-structure-0': 'Offer Components',
      'pricing-strategy-0': 'Pricing Structure',
    };

    return mappings[key] || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSalesPageData = () => {
    try {
      return JSON.parse(localStorage.getItem('generated-sales-page') || '{}');
    } catch {
      return {};
    }
  };

  const getLocationData = () => {
    try {
      return JSON.parse(localStorage.getItem('selected-customer-locations') || '[]');
    } catch {
      return [];
    }
  };

  const getMessageData = () => {
    try {
      return JSON.parse(localStorage.getItem('connection-strategies') || '{}');
    } catch {
      return {};
    }
  };

  // Query for real-time updates
  const { refetch } = useQuery({
    queryKey: ['/api/user-progress/all', 1],
    queryFn: () => getAllResponses(),
    refetchInterval: 5000,
  });

  useEffect(() => {
    buildDocuments();
  }, []);

  const buildDocuments = () => {
    const newDocs: ResourceDocument[] = [];

    // 1. Messaging Guide
    const messagingData = buildMessagingGuide();
    newDocs.push({
      id: 'messaging-guide',
      title: 'Your Messaging Guide',
      icon: MessageCircle,
      description: 'Complete messaging foundation from Messaging Mastery workbook',
      content: messagingData.content,
      completeness: messagingData.completeness,
      lastUpdated: new Date(),
      source: 'Messaging Mastery Interactive Workbook'
    });

    // 2. Offer Outline
    const offerData = buildOfferOutline();
    newDocs.push({
      id: 'offer-outline',
      title: 'Your Offer Outline',
      icon: Gift,
      description: 'Detailed offer structure from Create Your Offer workbook',
      content: offerData.content,
      completeness: offerData.completeness,
      lastUpdated: new Date(),
      source: 'Create Your Offer Interactive Workbook'
    });

    // 3. Sales Page
    const salesData = buildSalesPageDoc();
    newDocs.push({
      id: 'sales-page',
      title: 'Your Sales Page',
      icon: Settings,
      description: 'AI-generated sales page from Build Your Offer section',
      content: salesData.content,
      completeness: salesData.completeness,
      lastUpdated: new Date(),
      source: 'Build Your Offer - Sales Page Generator'
    });

    // 4. Customer Experience Strategy
    const customerData = buildCustomerExperience();
    newDocs.push({
      id: 'customer-experience',
      title: 'Customer Experience Strategy',
      icon: Users,
      description: 'Complete customer journey and experience design',
      content: customerData.content,
      completeness: customerData.completeness,
      lastUpdated: new Date(),
      source: 'Build Your Offer - Customer Experience Design'
    });

    // 5. Sales Strategy
    const salesStrategyData = buildSalesStrategy();
    newDocs.push({
      id: 'sales-strategy',
      title: 'Your Sales Strategy',
      icon: Target,
      description: 'Complete sales approach including locations and messages',
      content: salesStrategyData.content,
      completeness: salesStrategyData.completeness,
      lastUpdated: new Date(),
      source: 'Sell Your Offer - Interactive Sales Strategy Builder'
    });

    setDocuments(newDocs);
  };

  const buildMessagingGuide = () => {
    const responses = getAllResponses();
    let content = `# Your Messaging Guide\n\n`;
    let sections = 0;
    
    const avatarItems = Object.entries(responses).filter(([key]) => key.includes('customer-avatar'));
    const positioningItems = Object.entries(responses).filter(([key]) => key.includes('positioning'));
    const brandItems = Object.entries(responses).filter(([key]) => key.includes('brand-voice'));
    
    if (avatarItems.length > 0) {
      content += `## Customer Avatar\n\n`;
      avatarItems.forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          content += `### ${formatTitle(key)}\n${value}\n\n`;
          sections++;
        }
      });
    }
    
    if (positioningItems.length > 0) {
      content += `## Positioning & Messaging\n\n`;
      positioningItems.forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          content += `### ${formatTitle(key)}\n${value}\n\n`;
          sections++;
        }
      });
    }
    
    if (brandItems.length > 0) {
      content += `## Brand Voice & Tone\n\n`;
      brandItems.forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          content += `### ${formatTitle(key)}\n${value}\n\n`;
          sections++;
        }
      });
    }

    if (sections === 0) {
      content += `*Complete the Your Messaging workbook to generate your personalized messaging guide.*\n\n`;
      content += `Visit **Your Messaging** in the sidebar to start building your messaging foundation.\n\n`;
    }

    const completeness = Math.min(100, (sections / 12) * 100);
    return { content, completeness };
  };

  const buildOfferOutline = () => {
    const responses = getAllResponses();
    let content = `# Your Offer Outline\n\n`;
    let sections = 0;
    
    const foundationItems = Object.entries(responses).filter(([key]) => key.includes('offer-foundation'));
    const structureItems = Object.entries(responses).filter(([key]) => key.includes('offer-structure'));
    const pricingItems = Object.entries(responses).filter(([key]) => key.includes('pricing-strategy'));
    
    if (foundationItems.length > 0) {
      content += `## Core Transformation\n\n`;
      foundationItems.forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          content += `### ${formatTitle(key)}\n${value}\n\n`;
          sections++;
        }
      });
    }
    
    if (structureItems.length > 0) {
      content += `## Offer Components\n\n`;
      structureItems.forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          content += `### ${formatTitle(key)}\n${value}\n\n`;
          sections++;
        }
      });
    }
    
    if (pricingItems.length > 0) {
      content += `## Pricing Strategy\n\n`;
      pricingItems.forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          content += `### ${formatTitle(key)}\n${value}\n\n`;
          sections++;
        }
      });
    }

    if (sections === 0) {
      content += `*Complete the Create Your Offer workbook to generate your detailed offer outline.*\n\n`;
    }

    const completeness = Math.min(100, (sections / 15) * 100);
    return { content, completeness };
  };

  const buildSalesPageDoc = () => {
    const salesPage = getSalesPageData();
    let content = `# Your Sales Page\n\n`;
    
    if (salesPage.headline) {
      content += `## Headline\n${salesPage.headline}\n\n`;
      content += `## Problem Statement\n${salesPage.problem || 'N/A'}\n\n`;
      content += `## Solution Overview\n${salesPage.solution || 'N/A'}\n\n`;
      content += `## Call to Action\n${salesPage.cta || 'N/A'}\n\n`;
    } else {
      content += `*Generate your sales page in the Build Your Offer section to see it here.*\n\n`;
    }

    const completeness = salesPage.headline ? 100 : 0;
    return { content, completeness };
  };

  const buildCustomerExperience = () => {
    const responses = getAllResponses();
    let content = `# Customer Experience Strategy\n\n`;
    let sections = 0;
    
    const experienceItems = Object.entries(responses).filter(([key]) => 
      key.includes('customer-experience') || key.includes('onboarding') || key.includes('support')
    );
    
    if (experienceItems.length > 0) {
      experienceItems.forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          content += `## ${formatTitle(key)}\n${value}\n\n`;
          sections++;
        }
      });
    }

    if (sections === 0) {
      content += `*Complete the Customer Experience Design questions in Build Your Offer to generate your strategy.*\n\n`;
    }

    const completeness = Math.min(100, (sections / 8) * 100);
    return { content, completeness };
  };

  const buildSalesStrategy = () => {
    const locations = getLocationData();
    const messages = getMessageData();
    
    let content = `# Your Sales Strategy\n\n`;
    
    // Include networking strategy responses
    const networkingStrategy: Record<string, any> = {
      'Network Contacts (20 People)': messages.network_contacts || '',
      'Partnership Opportunities': messages.partnerships || '',
      'Relationship Nurturing Approach': messages.relationship_nurturing || ''
    };
    
    // Include networking strategy first
    const hasNetworkingStrategy = Object.values(networkingStrategy).some(value => value && typeof value === 'string' && value.trim());
    
    if (hasNetworkingStrategy) {
      content += `## Your Network Strategy\n\n`;
      Object.entries(networkingStrategy).forEach(([title, response]) => {
        if (response && typeof response === 'string' && response.trim()) {
          content += `### ${title}\n${response}\n\n`;
        }
      });
    }

    if (locations.length > 0) {
      content += `## Where You'll Find New Customers\n\n`;
      locations.forEach((location: any, index: number) => {
        content += `### ${index + 1}. ${location.platform}\n`;
        content += `**Location:** ${location.specificLocation}\n\n`;
        content += `**Strategy:** ${location.connectionStrategy}\n\n`;
      });
    }
    
    // Include custom messages from the message writing section
    const customMessages: Record<string, string> = {
      'Initial Connection Message': messages.custom_initial || '',
      'Value-First Follow Up': messages.custom_followup || '',
      'Soft Offer Introduction': messages.custom_offer || ''
    };
    
    const hasCustomMessages = Object.values(customMessages).some(msg => msg && msg.trim());
    
    if (hasCustomMessages) {
      content += `## Your Custom Conversation Templates\n\n`;
      Object.entries(customMessages).forEach(([title, message]) => {
        if (message && message.trim()) {
          content += `### ${title}\n${message}\n\n`;
        }
      });
    }
    
    // Include platform-specific messages
    const platformMessages = Object.entries(messages).filter(([key, value]) => 
      (key.includes('_message') || key.includes('_followup')) && 
      !key.startsWith('custom_') && 
      value && typeof value === 'string' && value.trim()
    );
    
    if (platformMessages.length > 0) {
      content += `## Platform-Specific Messages\n\n`;
      platformMessages.forEach(([platform, message]) => {
        if (platform.includes('_message')) {
          const platformName = platform.replace('_message', '').replace(/_/g, ' ');
          content += `### ${platformName} - Initial Message\n${message}\n\n`;
        }
        if (platform.includes('_followup')) {
          const platformName = platform.replace('_followup', '').replace(/_/g, ' ');
          content += `### ${platformName} - Follow-up Message\n${message}\n\n`;
        }
      });
    }

    const networkingResponses = Object.values(networkingStrategy).filter(value => value && typeof value === 'string' && value.trim()).length;
    const totalContent = locations.length + Object.values(customMessages).filter(msg => msg.trim()).length + platformMessages.length + networkingResponses;
    
    if (totalContent === 0) {
      content += `*Complete the Interactive Sales Strategy Builder in Sell Your Offer to generate your personalized sales strategy.*\n\n`;
      content += `Visit **Sell Your Offer > Sales Strategy** to start building your customer connection plan.\n\n`;
    }

    const completeness = Math.min(100, ((locations.length * 10) + (Object.values(customMessages).filter(msg => msg.trim()).length * 20) + (platformMessages.length * 10) + (networkingResponses * 20)));
    return { content, completeness };
  };

  const downloadDoc = (doc: ResourceDocument) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refreshAll = () => {
    buildDocuments();
    refetch();
  };

  const getStatusColor = (completeness: number) => {
    if (completeness >= 80) return 'text-green-600 bg-green-50';
    if (completeness >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-slate-500 bg-slate-50';
  };

  const getStatusIcon = (completeness: number) => {
    if (completeness >= 80) return CheckCircle;
    if (completeness >= 50) return AlertCircle;
    return FileText;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Resources</h1>
            <p className="text-slate-600 mt-2">
              Finalized summaries and documents from your work throughout the program
            </p>
          </div>
          <Button onClick={refreshAll} variant="outline" className="flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Documents</h2>
          
          {documents.map((doc) => {
            const Icon = doc.icon;
            const StatusIcon = getStatusIcon(doc.completeness);
            
            return (
              <Card 
                key={doc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDocument === doc.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDocument(doc.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-slate-900 text-sm">{doc.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">{doc.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`w-4 h-4 ${getStatusColor(doc.completeness).split(' ')[0]}`} />
                      <span className="text-xs text-slate-600">{Math.round(doc.completeness)}% complete</span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadDoc(doc);
                      }}
                      disabled={doc.completeness === 0}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Document Preview */}
        <div className="lg:col-span-2">
          {selectedDocument ? (
            (() => {
              const doc = documents.find(d => d.id === selectedDocument);
              if (!doc) return null;
              
              const Icon = doc.icon;
              
              return (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6 text-blue-600" />
                        <div>
                          <CardTitle>{doc.title}</CardTitle>
                          <p className="text-sm text-slate-500 mt-1">{doc.source}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className={getStatusColor(doc.completeness)}>
                          {Math.round(doc.completeness)}% Complete
                        </Badge>
                        <Button onClick={() => downloadDoc(doc)} disabled={doc.completeness === 0}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                        {doc.content}
                      </pre>
                    </div>
                    
                    {doc.completeness < 100 && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> Complete more sections in the interactive workbooks to generate a more comprehensive document.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Document</h3>
                <p className="text-slate-600">Choose a document from the list to preview and download</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
