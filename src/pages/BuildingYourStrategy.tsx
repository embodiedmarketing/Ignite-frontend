import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Video, 
  Target, 
  Eye, 
  Play, 
  FileText, 
  TrendingUp,
  Lightbulb,
  MessageCircle,
  Share2,
  Calendar,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Magnet,
  Edit,
  Download,
  Save,
  X,
  FileDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import VimeoEmbed from "@/components/VimeoEmbed";
import { useAuth } from "@/hooks/useAuth";
import { useMarkSectionComplete, useUnmarkSectionComplete, useSectionCompletions } from "@/hooks/useSectionCompletions";
import { useWorkbookResponses, useMessagingStrategy } from "@/hooks/useDatabasePersistence";
import { apiRequest, queryClient } from "@/services/queryClient";
import { validateAndNotify } from "@/utils/prerequisite-validator";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export default function BuildingYourStrategy() {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const markSectionComplete = useMarkSectionComplete();
  const unmarkSectionComplete = useUnmarkSectionComplete();
  const { toast } = useToast();
  
  // Initialize workbook responses hook for Lead Generation (Step 4)
  const { responses, saveResponse } = useWorkbookResponses(userId, 4, 1);
  
  // Get user's messaging strategy for voice/tone
  const { activeStrategy, refetch: refetchMessagingStrategy } = useMessagingStrategy(userId);
  
  // Fetch section completions from database
  const { data: sectionCompletionsData } = useSectionCompletions(userId);
  
  // Fetch Tripwire Offer Outline to auto-populate fields
  const { data: offerOutlines } = useQuery({
    queryKey: ['/api/user-offer-outlines/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user-offer-outlines/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch offer outlines');
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Fetch saved funnel copy from database
  const { data: savedFunnelCopy } = useQuery({
    queryKey: ['/api/funnel-copy/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/funnel-copy/user/${userId}?offerNumber=1`);
      if (!response.ok) {
        if (response.status === 404) return null; // No funnel copy saved yet
        throw new Error('Failed to fetch funnel copy');
      }
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Fetch saved IGNITE docs to load email sequences
  const { data: igniteDocuments } = useQuery({
    queryKey: ['/api/ignite-docs/user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/ignite-docs/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch IGNITE documents');
      return response.json();
    },
    enabled: !!userId,
  });
  
  const [activeTab, setActiveTab] = useState("overview");
  
  // State for lead generation sections
  const [completedSections, setCompletedSections] = useState({
    leadMagnet: false,
    landingPage: false,
    automation: false,
    launch: false,
    testing: false
  });
  
  // State for Lead Magnet input fields
  const [leadMagnetTitle, setLeadMagnetTitle] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [transformation, setTransformation] = useState("");
  const [problemSolved, setProblemSolved] = useState("");
  const [urgency, setUrgency] = useState("");
  const [uniqueness, setUniqueness] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [quickWin, setQuickWin] = useState("");
  const [objections, setObjections] = useState("");
  const [bulletPoints, setBulletPoints] = useState("");
  const [socialProof, setSocialProof] = useState("");
  
  // State for Tripwire input fields
  const [tripwireTitle, setTripwireTitle] = useState("");
  const [tripwireType, setTripwireType] = useState("");
  const [tripwireOutcome, setTripwireOutcome] = useState("");
  const [tripwireConnection, setTripwireConnection] = useState("");
  const [tripwirePrice, setTripwirePrice] = useState("");
  const [noBrainer, setNoBrainer] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [tripwireProblem, setTripwireProblem] = useState("");
  const [tripwireDifferent, setTripwireDifferent] = useState("");
  const [tripwireWins, setTripwireWins] = useState("");
  const [tripwireObjections, setTripwireObjections] = useState("");
  const [overcomingObjections, setOvercomingObjections] = useState("");
  const [riskRemoval, setRiskRemoval] = useState("");
  const [testimonials, setTestimonials] = useState("");
  const [authority, setAuthority] = useState("");
  
  // Auto-populate Tripwire fields from Tripwire Offer Outline
  useEffect(() => {
    if (offerOutlines && offerOutlines.length > 0) {
      const tripwireOutline = offerOutlines.find((outline: any) => 
        outline.title?.toLowerCase().includes('tripwire')
      );
      
      if (tripwireOutline && tripwireOutline.content) {
        const content = tripwireOutline.content;
        
        // Helper function to extract content between markers
        const extractField = (content: string, pattern: RegExp): string => {
          const match = content.match(pattern);
          return match ? match[1].trim() : "";
        };
        
        // Extract Offer Name (title)
        const offerName = extractField(content, /\*\*Offer Name:\*\*\s*([^\n]+)/);
        if (offerName && !responses["leadgen-tripwireTitle"]) {
          setTripwireTitle(offerName);
        }
        
        // Extract Format (type)
        const format = extractField(content, /\*\*Format \+ Duration:\*\*\s*"?Delivered as\s*([^"]+?)(?:\s*over|\.|")/);
        if (format && !responses["leadgen-tripwireType"]) {
          setTripwireType(format);
        }
        
        // Extract Core Transformation (outcome)
        const coreTransformation = extractField(content, /\*\*Core Transformation \(Main Promise\):\*\*\s*([^\n]+)/);
        if (coreTransformation && !responses["leadgen-tripwireOutcome"]) {
          setTripwireOutcome(coreTransformation);
        }
        
        // Extract Investment (price)
        const investment = extractField(content, /\*\*Investment:\*\*\s*\$?([^\s\n(]+)/);
        if (investment && !responses["leadgen-tripwirePrice"]) {
          setTripwirePrice(investment);
        }
        
        // Extract Value Framing (no-brainer)
        const valueFraming = extractField(content, /\*\*Value Framing:\*\*\s*"([^"]+)"/);
        if (valueFraming && !responses["leadgen-noBrainer"]) {
          setNoBrainer(valueFraming);
        }
        
        // Extract Regular Price
        const regularPriceMatch = extractField(content, /\(Normally\s*\$?([^)]+)\)/);
        if (regularPriceMatch && !responses["leadgen-regularPrice"]) {
          setRegularPrice(regularPriceMatch);
        }
        
        // Extract Problem This Solves
        const problemSolves = extractField(content, /\*\*Problem This Solves:\*\*\s*([^\n*]+)/);
        if (problemSolves && !responses["leadgen-tripwireProblem"]) {
          setTripwireProblem(problemSolves);
        }
        
        // Extract What Makes It Different
        const different = extractField(content, /\*\*What Makes It Different:\*\*\s*([^\n*]+)/);
        if (different && !responses["leadgen-tripwireDifferent"]) {
          setTripwireDifferent(different);
        }
        
        // Extract Ultimate Emotional Benefit (quick wins)
        const emotionalBenefit = extractField(content, /\*\*Ultimate Emotional Benefit:\*\*\s*"([^"]+)"/);
        if (emotionalBenefit && !responses["leadgen-tripwireWins"]) {
          setTripwireWins(emotionalBenefit);
        }
        
        // Extract False Beliefs / Objections
        const falseBeliefs = extractField(content, /\*\*False Beliefs \/ Objections \(and Reframes\):\*\*\s*([^\n*]+)/);
        if (falseBeliefs && !responses["leadgen-tripwireObjections"]) {
          setTripwireObjections(falseBeliefs);
        }
        
        // Extract Guarantee / Risk Reversal
        const guarantee = extractField(content, /\*\*Guarantee \/ Risk Reversal:\*\*\s*"([^"]+)"/);
        if (guarantee && !responses["leadgen-riskRemoval"]) {
          setRiskRemoval(guarantee);
        }
        
        // Extract Testimonials
        const testimonialsText = extractField(content, /\*\*Testimonials \/ Social Proof:\*\*\s*([^\n#]+)/);
        if (testimonialsText && !responses["leadgen-testimonials"]) {
          setTestimonials(testimonialsText);
        }
        
        // Extract Expertise / Credentials (authority)
        const expertise = extractField(content, /\*\*Expertise \/ Credentials:\*\*\s*([^\n*]+)/);
        if (expertise && !responses["leadgen-authority"]) {
          setAuthority(expertise);
        }
      }
    }
  }, [offerOutlines, responses]);
  
  // Auto-populate fields from Messaging Strategy Foundation
  useEffect(() => {
    if (activeStrategy && activeStrategy.content) {
      const content = activeStrategy.content;
      
      // Helper function to extract content between markers
      const extractSection = (content: string, sectionTitle: string): string => {
        const regex = new RegExp(`##\\s*\\d*\\.?\\s*${sectionTitle}[\\s\\S]*?(?=##|$)`, 'i');
        const match = content.match(regex);
        return match ? match[0] : "";
      };
      
      const extractField = (section: string, pattern: RegExp): string => {
        const match = section.match(pattern);
        return match ? match[1].trim() : "";
      };
      
      // Extract from UNIQUE POSITIONING FOUNDATION
      const positioningSection = extractSection(content, "UNIQUE POSITIONING FOUNDATION");
      if (positioningSection) {
        // Extract "What Makes You Uniquely Qualified" for authority
        const uniqueQualified = extractField(positioningSection, /\*\*What Makes You Uniquely Qualified:\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (uniqueQualified && !responses["leadgen-authority"]) {
          setAuthority(uniqueQualified);
        }
        
        // Extract "The Transformation You Create" for transformation
        const transformationText = extractField(positioningSection, /\*\*The Transformation You Create:\*\*\s*([^*]+?)(?=\*\*|---|\n\n##|$)/s);
        if (transformationText && !responses["leadgen-transformation"]) {
          setTransformation(transformationText);
        }
        
        // Extract "Your Distinctive Approach" for uniqueness
        const distinctiveApproach = extractField(positioningSection, /\*\*Your Distinctive Approach:\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (distinctiveApproach && !responses["leadgen-uniqueness"]) {
          setUniqueness(distinctiveApproach);
        }
      }
      
      // Extract from CUSTOMER AVATAR DEEP DIVE
      const avatarSection = extractSection(content, "CUSTOMER AVATAR DEEP DIVE");
      if (avatarSection) {
        // Extract pain points/challenges
        const painPointsText = extractField(avatarSection, /\*\*(?:Deepest Fears|Main Pain Points|Current Challenges):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (painPointsText && !responses["leadgen-painPoints"]) {
          setPainPoints(painPointsText);
        }
        
        // Extract desires/outcomes for quick win
        const desiresText = extractField(avatarSection, /\*\*(?:Deepest Desires|What They Want Most|Ultimate Goal):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (desiresText && !responses["leadgen-quickWin"]) {
          setQuickWin(desiresText);
        }
      }
      
      // Extract from CORE OFFER TRANSFORMATION
      const offerSection = extractSection(content, "CORE OFFER TRANSFORMATION");
      if (offerSection) {
        // Extract main promise/outcome for tripwire outcome
        const mainPromise = extractField(offerSection, /\*\*(?:Main Promise|Core Transformation|Primary Outcome):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (mainPromise && !responses["leadgen-tripwireOutcome"]) {
          setTripwireOutcome(mainPromise);
        }
        
        // Extract problem solved
        const problemText = extractField(offerSection, /\*\*(?:Problem This Solves|Core Problem Addressed):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (problemText && !responses["leadgen-problemSolved"]) {
          setProblemSolved(problemText);
        }
        if (problemText && !responses["leadgen-tripwireProblem"]) {
          setTripwireProblem(problemText);
        }
      }
      
      // Extract from OFFER PRESENTATION
      const presentationSection = extractSection(content, "OFFER PRESENTATION");
      if (presentationSection) {
        // Extract objections
        const objectionsText = extractField(presentationSection, /\*\*(?:Common Objections|Addressing Objections|Overcoming Resistance):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (objectionsText && !responses["leadgen-objections"]) {
          setObjections(objectionsText);
        }
        if (objectionsText && !responses["leadgen-tripwireObjections"]) {
          setTripwireObjections(objectionsText);
        }
        
        // Extract social proof/testimonials
        const socialProofText = extractField(presentationSection, /\*\*(?:Social Proof|Testimonials|Results):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (socialProofText && !responses["leadgen-socialProof"]) {
          setSocialProof(socialProofText);
        }
        if (socialProofText && !responses["leadgen-testimonials"]) {
          setTestimonials(socialProofText);
        }
        
        // Extract urgency
        const urgencyText = extractField(presentationSection, /\*\*(?:Creating Urgency|Why Now|Urgency Drivers):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (urgencyText && !responses["leadgen-urgency"]) {
          setUrgency(urgencyText);
        }
      }
      
      // Extract from PRICING STRATEGY
      const pricingSection = extractSection(content, "PRICING STRATEGY");
      if (pricingSection) {
        // Extract investment/price
        const investmentText = extractField(pricingSection, /\*\*(?:Investment|Pricing|Price Point):\*\*\s*\$?([^*\n]+?)(?=\*\*|\n|$)/s);
        if (investmentText && !responses["leadgen-tripwirePrice"]) {
          setTripwirePrice(investmentText.replace(/[^\d.]/g, ''));
        }
        
        // Extract value positioning
        const valueText = extractField(pricingSection, /\*\*(?:Value Positioning|Why This Price|Value Justification):\*\*\s*([^*]+?)(?=\*\*|$)/s);
        if (valueText && !responses["leadgen-noBrainer"]) {
          setNoBrainer(valueText);
        }
      }
    }
  }, [activeStrategy, responses]);
  
  // State for Email Sequence input fields
  const [coreBeliefShift, setCoreBeliefShift] = useState("");
  const [objectionsDoubts, setObjectionsDoubts] = useState("");
  const [storiesExamples, setStoriesExamples] = useState("");
  const [contentHighlight, setContentHighlight] = useState("");
  const [contentOrder, setContentOrder] = useState("");
  
  // State for generated email sequence
  const [generatedEmailSequence, setGeneratedEmailSequence] = useState<Array<{
    emailNumber: number;
    subject: string;
    body: string;
  }> | null>(null);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);
  
  // State for editing entire email sequence
  const [isEditingEmailSequence, setIsEditingEmailSequence] = useState(false);
  const [editedEmailSequence, setEditedEmailSequence] = useState<Array<{
    emailNumber: number;
    subject: string;
    body: string;
  }> | null>(null);
  
  // State for generated funnel copy
  const [generatedCopy, setGeneratedCopy] = useState<{
    optInPage: string;
    tripwirePage: string;
    checkoutPage: string;
    confirmationPage: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for editing generated copy
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<{
    optInPage: string;
    tripwirePage: string;
    checkoutPage: string;
    confirmationPage: string;
  }>({
    optInPage: "",
    tripwirePage: "",
    checkoutPage: "",
    confirmationPage: ""
  });
  
  const [expandedSections, setExpandedSections] = useState({
    leadMagnet: false,
    landingPage: false,
    automation: false,
    launch: false,
    testing: false
  });
  
  // Load saved funnel copy from database when available
  useEffect(() => {
    if (savedFunnelCopy && !generatedCopy) {
      console.log('[COPY GENERATOR] Loading saved funnel copy from database');
      setGeneratedCopy(savedFunnelCopy);
    }
  }, [savedFunnelCopy]);
  
  // Load saved email sequence from IGNITE Docs
  useEffect(() => {
    if (igniteDocuments && !generatedEmailSequence) {
      // Filter for email_sequence documents
      const emailSequenceDocs = igniteDocuments.filter((doc: any) => doc.docType === 'email_sequence');
      
      if (emailSequenceDocs.length > 0) {
        // Get the most recent one (they're already sorted by createdAt in the backend)
        const latestEmailDoc = emailSequenceDocs[0];
        console.log('[EMAIL SEQUENCE] Loading saved email sequence from IGNITE Docs');
        
        // Parse the markdown content to extract emails
        const markdown = latestEmailDoc.contentMarkdown || '';
        const emails: Array<{
          emailNumber: number;
          subject: string;
          body: string;
        }> = [];
        
        // Extract each email from markdown using regex
        const emailPattern = /## Email (\d+) of 5\s*\n*\s*\*\*Subject:\*\*\s*([^\n]+)\s*\n+([\s\S]*?)(?=---|\n## Email|$)/g;
        let match;
        
        while ((match = emailPattern.exec(markdown)) !== null) {
          emails.push({
            emailNumber: parseInt(match[1]),
            subject: match[2].trim(),
            body: match[3].trim()
          });
        }
        
        if (emails.length > 0) {
          setGeneratedEmailSequence(emails);
          console.log('[EMAIL SEQUENCE] Loaded', emails.length, 'emails from saved document');
        }
      }
    }
  }, [igniteDocuments, generatedEmailSequence]);
  
  // Load saved Implementation Steps completion states from database
  useEffect(() => {
    if (sectionCompletionsData && sectionCompletionsData.length > 0) {
      console.log('[IMPLEMENTATION STEPS] Loading saved completion states from database');
      
      // Map section titles to section keys
      const sectionTitleMap: Record<string, keyof typeof completedSections> = {
        "Create Your Lead Gen Funnel Copy": "leadMagnet",
        "Write Your Email Copy": "landingPage",
        "Build Your Funnel": "automation",
        "Set Up Your Tech": "launch",
        "Test Your Funnel": "testing"
      };
      
      const newCompletedSections = { ...completedSections };
      
      // Filter completions for step 4 (Lead Generation)
      const step4Completions = sectionCompletionsData.filter(c => c.stepNumber === 4);
      
      step4Completions.forEach(completion => {
        const sectionKey = sectionTitleMap[completion.sectionTitle];
        if (sectionKey) {
          newCompletedSections[sectionKey] = true;
        }
      });
      
      setCompletedSections(newCompletedSections);
    }
  }, [sectionCompletionsData]);
  
  // Load saved responses from database - using ref to track previous responses
  const prevResponsesRef = useRef<Record<string, string>>({});
  
  useEffect(() => {
    if (responses && Object.keys(responses).length > 0) {
      // Check if responses actually changed by comparing JSON strings
      const responsesJSON = JSON.stringify(responses);
      const prevResponsesJSON = JSON.stringify(prevResponsesRef.current);
      
      if (responsesJSON !== prevResponsesJSON) {
        prevResponsesRef.current = responses;
        console.log('[COPY GENERATOR] Loading database responses into state');
        
        // Lead Magnet fields
        setLeadMagnetTitle(responses["leadgen-leadMagnetTitle"] || "");
        setResourceType(responses["leadgen-resourceType"] || "");
        setTransformation(responses["leadgen-transformation"] || "");
        setProblemSolved(responses["leadgen-problemSolved"] || "");
        setUrgency(responses["leadgen-urgency"] || "");
        setUniqueness(responses["leadgen-uniqueness"] || "");
        setPainPoints(responses["leadgen-painPoints"] || "");
        setQuickWin(responses["leadgen-quickWin"] || "");
        setObjections(responses["leadgen-objections"] || "");
        setBulletPoints(responses["leadgen-bulletPoints"] || "");
        setSocialProof(responses["leadgen-socialProof"] || "");
        
        // Tripwire fields
        setTripwireTitle(responses["leadgen-tripwireTitle"] || "");
        setTripwireType(responses["leadgen-tripwireType"] || "");
        setTripwireOutcome(responses["leadgen-tripwireOutcome"] || "");
        setTripwireConnection(responses["leadgen-tripwireConnection"] || "");
        setTripwirePrice(responses["leadgen-tripwirePrice"] || "");
        setNoBrainer(responses["leadgen-noBrainer"] || "");
        setRegularPrice(responses["leadgen-regularPrice"] || "");
        setTripwireProblem(responses["leadgen-tripwireProblem"] || "");
        setTripwireDifferent(responses["leadgen-tripwireDifferent"] || "");
        setTripwireWins(responses["leadgen-tripwireWins"] || "");
        setTripwireObjections(responses["leadgen-tripwireObjections"] || "");
        setOvercomingObjections(responses["leadgen-overcomingObjections"] || "");
        setRiskRemoval(responses["leadgen-riskRemoval"] || "");
        setTestimonials(responses["leadgen-testimonials"] || "");
        setAuthority(responses["leadgen-authority"] || "");
        
        // Email Sequence fields
        setCoreBeliefShift(responses["leadgen-coreBeliefShift"] || "");
        setObjectionsDoubts(responses["leadgen-objectionsDoubts"] || "");
        setStoriesExamples(responses["leadgen-storiesExamples"] || "");
        setContentHighlight(responses["leadgen-contentHighlight"] || "");
        setContentOrder(responses["leadgen-contentOrder"] || "");
      }
    }
  }, [responses]);
  
  // Handler to save responses to database
  const handleSaveResponse = (questionKey: string, value: string) => {
    saveResponse.mutate({
      questionKey,
      responseText: value,
      sectionTitle: "Copy Generator"
    });
  };
  
  // Helper function to convert HTML funnel copy to markdown for IGNITE Docs
  const convertFunnelCopyToMarkdown = (funnelCopy: any): string => {
    let markdown = "# Lead Generation\n\n";
    
    // Convert HTML to plain text for markdown
    const htmlToText = (html: string): string => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      // Replace specific emojis with text labels
      let text = temp.innerHTML
        .replace(/🧩/g, '[PART]')
        .replace(/🎯/g, '[Goal]')
        .replace(/🧱/g, '[Structure]')
        .replace(/○/g, '• ')
        .replace(/■/g, '• ');
      
      // Create a new element with cleaned text
      temp.innerHTML = text;
      
      // Process the DOM to extract formatted text
      const processNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          let result = '';
          
          if (element.tagName === 'H2') {
            result = `\n## ${element.textContent}\n`;
          } else if (element.tagName === 'P') {
            Array.from(element.childNodes).forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                result += child.textContent;
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childEl = child as Element;
                if (childEl.tagName === 'STRONG') {
                  result += `**${childEl.textContent}**`;
                } else if (childEl.tagName === 'EM') {
                  result += `*${childEl.textContent}*`;
                } else if (childEl.tagName === 'BR') {
                  result += '\n';
                } else {
                  result += childEl.textContent;
                }
              }
            });
            result += '\n\n';
          } else if (element.tagName === 'UL' || element.tagName === 'OL') {
            const isOrdered = element.tagName === 'OL';
            Array.from(element.children).forEach((li, index) => {
              if (li.tagName === 'LI') {
                const prefix = isOrdered ? `${index + 1}. ` : '• ';
                result += prefix + li.textContent + '\n';
              }
            });
            result += '\n';
          } else if (element.tagName === 'LI') {
            result = '• ' + element.textContent + '\n';
          } else if (element.tagName === 'BR') {
            result = '\n';
          } else {
            Array.from(element.childNodes).forEach(child => {
              result += processNode(child);
            });
          }
          
          return result;
        }
        
        return '';
      };
      
      return Array.from(temp.childNodes).map(processNode).join('').trim();
    };
    
    // Add each part with proper headings
    markdown += "## PART 1 — OPT-IN PAGE COPY\n\n";
    markdown += htmlToText(funnelCopy.optInPage) + "\n\n";
    markdown += "---\n\n";
    
    markdown += "## PART 2 — TRIPWIRE PAGE COPY\n\n";
    markdown += htmlToText(funnelCopy.tripwirePage) + "\n\n";
    markdown += "---\n\n";
    
    markdown += "## PART 3 — CHECKOUT PAGE COPY\n\n";
    markdown += htmlToText(funnelCopy.checkoutPage) + "\n\n";
    markdown += "---\n\n";
    
    markdown += "## PART 4 — CONFIRMATION PAGE COPY\n\n";
    markdown += htmlToText(funnelCopy.confirmationPage) + "\n\n";
    
    return markdown;
  };

  // Function to generate funnel copy
  const handleGenerateFunnelCopy = async () => {
    // Before validation, refetch the latest data
    const { data: latestMessagingStrategy } = await refetchMessagingStrategy();
    
    // Validate prerequisites before generation
    const isValid = validateAndNotify(
      { messagingStrategy: true },
      { messagingStrategy: latestMessagingStrategy?.content }
    );
    
    if (!isValid) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const answers = {
        // Lead Magnet
        leadMagnetTitle,
        resourceType,
        transformation,
        problemSolved,
        urgency,
        uniqueness,
        painPoints,
        quickWin,
        objections,
        bulletPoints,
        socialProof,
        
        // Tripwire
        tripwireTitle,
        tripwireType,
        tripwireOutcome,
        tripwireConnection,
        tripwirePrice,
        noBrainer,
        regularPrice,
        tripwireProblem,
        tripwireDifferent,
        tripwireWins,
        tripwireObjections,
        overcomingObjections,
        riskRemoval,
        testimonials,
        authority,
        
        // Email Sequence
        coreBeliefShift,
        objectionsDoubts,
        storiesExamples,
        contentHighlight,
        contentOrder,
      };
      
      const messagingStrategyVoice = latestMessagingStrategy?.content || "Professional and conversion-focused";
      
      const response = await apiRequest("POST", "/api/generate-funnel-copy", {
        userId,
        answers,
        messagingStrategyVoice
      });
      
      const result = await response.json();
      setGeneratedCopy(result);
      
      // Scroll to generated copy section after state update
      setTimeout(() => {
        const element = document.getElementById('generated-funnel-copy');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      // Save to IGNITE Docs
      let savedToIgnite = false;
      try {
        const markdown = convertFunnelCopyToMarkdown(result);
        
        const saveResponse = await apiRequest("POST", "/api/ignite-docs", {
          userId,
          docType: "lead_generation",
          title: "Copy Generator",
          contentMarkdown: markdown,
          sourcePayload: {
            answers,
            messagingStrategyVoice,
            generatedAt: new Date().toISOString()
          }
        });
        
        if (saveResponse.ok) {
          savedToIgnite = true;
          console.log("Funnel copy saved to IGNITE Docs successfully");
        } else {
          throw new Error("Failed to save to IGNITE Docs");
        }
      } catch (saveError) {
        console.error("Error saving to IGNITE Docs:", saveError);
      }
      
      // Show appropriate success message
      if (savedToIgnite) {
        toast({
          title: "Funnel Copy Generated!",
          description: "Your funnel copy has been successfully generated and saved to IGNITE Docs.",
        });
      } else {
        toast({
          title: "Funnel Copy Generated!",
          description: "Your funnel copy has been generated. Note: Failed to auto-save to IGNITE Docs.",
        });
      }
    } catch (error) {
      console.error("Error generating funnel copy:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate funnel copy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to generate email sequence
  const handleGenerateEmailSequence = async () => {
    setIsGeneratingEmails(true);
    
    try {
      // Extract messaging strategy and ideal customer profile
      const messagingStrategyContent = activeStrategy?.content || "";
      
      // Extract ideal customer profile section from messaging strategy
      const extractSection = (content: string, sectionTitle: string): string => {
        const regex = new RegExp(`##\\s*\\d*\\.?\\s*${sectionTitle}[\\s\\S]*?(?=##|$)`, 'i');
        const match = content.match(regex);
        return match ? match[0] : "";
      };
      
      const idealCustomerProfile = extractSection(messagingStrategyContent, "CUSTOMER AVATAR DEEP DIVE") || 
                                   extractSection(messagingStrategyContent, "IDEAL CUSTOMER PROFILE") ||
                                   "Not available";
      
      const response = await apiRequest("POST", "/api/generate-email-sequence", {
        leadMagnetTitle,
        transformation,
        problemSolved,
        tripwireTitle,
        tripwireType,
        tripwireOutcome,
        tripwirePrice,
        coreBeliefShift,
        objectionsDoubts,
        storiesExamples,
        contentHighlight,
        contentOrder,
        messagingStrategy: messagingStrategyContent,
        idealCustomerProfile
      });
      
      const result = await response.json();
      setGeneratedEmailSequence(result.emails);
      
      // Scroll to generated email sequence section after state update
      setTimeout(() => {
        const element = document.getElementById('generated-email-sequence');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      // Automatically save to IGNITE Docs
      let savedToIgnite = false;
      try {
        // Format the email sequence as markdown
        let contentMarkdown = `# SEQUENCE (5 EMAILS)\n\n`;
        contentMarkdown += `**Lead Magnet:** ${leadMagnetTitle}\n\n`;
        contentMarkdown += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
        contentMarkdown += `---\n\n`;
        
        result.emails.forEach((email: any) => {
          contentMarkdown += `## Email ${email.emailNumber} of 5\n\n`;
          contentMarkdown += `**Subject:** ${email.subject}\n\n`;
          contentMarkdown += `${email.body}\n\n`;
          contentMarkdown += `---\n\n`;
        });
        
        // Save to IGNITE Docs
        await apiRequest("POST", "/api/ignite-docs", {
          userId: user?.id,
          docType: "email_sequence",
          title: "Copy Generator",
          contentMarkdown,
          sourcePayload: {
            leadMagnetTitle,
            transformation,
            problemSolved,
            tripwireTitle,
            tripwireType,
            tripwireOutcome,
            tripwirePrice,
            coreBeliefShift,
            objectionsDoubts,
            storiesExamples,
            contentHighlight,
            contentOrder,
            generatedAt: new Date().toISOString()
          }
        });
        savedToIgnite = true;
      } catch (saveError) {
        console.error("Error saving to IGNITE Docs:", saveError);
        toast({
          title: "Note",
          description: "Email sequence generated but could not be saved to IGNITE Docs. You can still export it below.",
          variant: "default",
        });
      }
      
      toast({
        title: "Email Sequence Generated!",
        description: savedToIgnite 
          ? "Your email sequence has been generated and saved to IGNITE Docs."
          : "Your email sequence has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating email sequence:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate email sequence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmails(false);
    }
  };

  // Function to export email sequence as PDF
  const handleExportEmailSequencePDF = () => {
    if (!generatedEmailSequence) return;
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPos = margin;
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SEQUENCE (5 EMAILS)', margin, yPos);
      yPos += 15;
      
      generatedEmailSequence.forEach((email, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }
        
        // Email number and subject
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Email ${email.emailNumber} of 5`, margin, yPos);
        yPos += 8;
        
        doc.setFontSize(12);
        doc.text(`Subject: ${email.subject}`, margin, yPos);
        yPos += 10;
        
        // Email body
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // Split body into paragraphs and wrap text
        const paragraphs = email.body.split('\n\n');
        paragraphs.forEach((paragraph, pIndex) => {
          if (!paragraph.trim()) return;
          
          const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
          lines.forEach((line: string) => {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = margin;
            }
            doc.text(line, margin, yPos);
            yPos += 6;
          });
          // More space between paragraphs for better readability
          yPos += pIndex < paragraphs.length - 1 ? 8 : 4;
        });
        
        // Separator between emails with more spacing
        if (index < generatedEmailSequence.length - 1) {
          yPos += 8;
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
          }
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 12;
        }
      });
      
      doc.save('email-sequence.pdf');
      
      toast({
        title: "PDF Downloaded",
        description: "Your email sequence has been exported as PDF.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to export email sequence as DOCX
  const handleExportEmailSequenceDOCX = async () => {
    if (!generatedEmailSequence) return;
    
    try {
      const sections: Paragraph[] = [];
      
      // Title
      sections.push(
        new Paragraph({
          text: 'SEQUENCE (5 EMAILS)',
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        })
      );
      
      generatedEmailSequence.forEach((email, index) => {
        // Email number
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Email ${email.emailNumber} of 5`,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        
        // Subject line
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Subject: ',
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: email.subject,
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          })
        );
        
        // Email body paragraphs
        const paragraphs = email.body.split('\n\n');
        paragraphs.forEach((paragraph, pIndex) => {
          if (!paragraph.trim()) return;
          
          sections.push(
            new Paragraph({
              text: paragraph.trim(),
              spacing: { 
                after: pIndex < paragraphs.length - 1 ? 240 : 200 
              },
            })
          );
        });
        
        // Add extra spacing and separator between emails
        if (index < generatedEmailSequence.length - 1) {
          sections.push(
            new Paragraph({
              text: '',
              spacing: { after: 100 },
            })
          );
          sections.push(
            new Paragraph({
              text: '━'.repeat(80),
              spacing: { before: 100, after: 300 },
            })
          );
          sections.push(
            new Paragraph({
              text: '',
              spacing: { after: 100 },
            })
          );
        }
      });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: sections,
        }],
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'email-sequence.docx');
      
      toast({
        title: "DOCX Downloaded",
        description: "Your email sequence has been exported as DOCX.",
      });
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export DOCX. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to start editing entire email sequence
  const handleEditEmailSequence = () => {
    if (!generatedEmailSequence) return;
    
    // Create a deep copy of the email sequence for editing
    setEditedEmailSequence(generatedEmailSequence.map(email => ({ ...email })));
    setIsEditingEmailSequence(true);
  };

  // Function to update an email in the edited sequence
  const handleUpdateEmailInSequence = (index: number, field: 'subject' | 'body', value: string) => {
    if (!editedEmailSequence) return;
    
    const updatedSequence = [...editedEmailSequence];
    updatedSequence[index] = {
      ...updatedSequence[index],
      [field]: value,
    };
    setEditedEmailSequence(updatedSequence);
  };

  // Function to save edited email sequence
  const handleSaveEmailSequence = () => {
    if (!editedEmailSequence) return;
    
    setGeneratedEmailSequence(editedEmailSequence);
    setIsEditingEmailSequence(false);
    setEditedEmailSequence(null);
    
    toast({
      title: "Email Sequence Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  // Function to cancel editing email sequence
  const handleCancelEmailSequenceEdit = () => {
    setIsEditingEmailSequence(false);
    setEditedEmailSequence(null);
  };

  // Function to handle edit mode
  const handleEditPage = (pageKey: string) => {
    if (!generatedCopy) return;
    
    setEditingPage(pageKey);
    setEditedContent({
      ...editedContent,
      [pageKey]: generatedCopy[pageKey as keyof typeof generatedCopy]
    });
  };

  // Function to save edited content
  const handleSaveEdit = async () => {
    if (!editingPage || !generatedCopy) return;
    
    const updatedCopy = {
      ...generatedCopy,
      [editingPage]: editedContent[editingPage as keyof typeof editedContent]
    };
    
    setGeneratedCopy(updatedCopy);
    setEditingPage(null);
    
    // Save updated copy to database
    try {
      await apiRequest('PUT', `/api/funnel-copy/user/${userId}`, {
        ...updatedCopy,
        offerNumber: 1
      });
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/funnel-copy/user', userId] });
      
      toast({
        title: "Changes Saved",
        description: "Your edits have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving funnel copy:', error);
      toast({
        title: "Error Saving Changes",
        description: "Failed to save your edits. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingPage(null);
  };

  // Function to export as PDF with formatting
  const handleExportPDF = async (pageKey: string, pageTitle: string) => {
    if (!generatedCopy) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const content = generatedCopy[pageKey as keyof typeof generatedCopy];
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      let yPos = 20;
      const pageWidth = 180;
      const lineHeight = 7;
      
      // Helper function to convert text-only emojis to readable text
      const cleanText = (text: string): string => {
        return text
          .replace(/🧩/g, '[PART]')
          .replace(/🎯/g, '[Goal]')
          .replace(/🧱/g, '[Structure]')
          .replace(/○/g, '• ')
          .replace(/■/g, '• ')
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove other emojis
          .trim();
      };
      
      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const rawText = node.textContent || '';
          const text = cleanText(rawText);
          if (text) {
            const lines = doc.splitTextToSize(text, pageWidth);
            lines.forEach((line: string) => {
              if (yPos > 280) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(line, 15, yPos);
              yPos += lineHeight;
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          if (element.tagName === 'H2') {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const rawText = element.textContent || '';
            const text = cleanText(rawText);
            const lines = doc.splitTextToSize(text, pageWidth);
            lines.forEach((line: string) => {
              if (yPos > 280) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(line, 15, yPos);
              yPos += lineHeight + 3;
            });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            yPos += 3;
          } else if (element.tagName === 'P') {
            Array.from(element.childNodes).forEach(processNode);
            yPos += 3;
          } else if (element.tagName === 'STRONG') {
            doc.setFont('helvetica', 'bold');
            Array.from(element.childNodes).forEach(processNode);
            doc.setFont('helvetica', 'normal');
          } else if (element.tagName === 'EM') {
            doc.setFont('helvetica', 'italic');
            Array.from(element.childNodes).forEach(processNode);
            doc.setFont('helvetica', 'normal');
          } else if (element.tagName === 'BR') {
            yPos += lineHeight;
          } else {
            Array.from(element.childNodes).forEach(processNode);
          }
        }
      };
      
      Array.from(tempDiv.childNodes).forEach(processNode);
      
      doc.save(`${pageTitle.replace(/\s+/g, '_')}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `${pageTitle} has been downloaded as PDF.`,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export as PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to export as DOCX with formatting
  const handleExportDOCX = async (pageKey: string, pageTitle: string) => {
    if (!generatedCopy) return;
    
    try {
      const { Document, Paragraph, TextRun, Packer, HeadingLevel } = await import('docx');
      const { saveAs } = await import('file-saver');
      
      const content = generatedCopy[pageKey as keyof typeof generatedCopy];
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      const paragraphs: any[] = [];
      
      // Helper function to convert emojis to readable text
      const cleanText = (text: string): string => {
        return text
          .replace(/🧩/g, '[PART]')
          .replace(/🎯/g, '[Goal]')
          .replace(/🧱/g, '[Structure]')
          .replace(/○/g, '• ')
          .replace(/■/g, '• ')
          .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove other emojis
          .trim();
      };
      
      const processNode = (node: Node): any[] => {
        const runs: any[] = [];
        
        if (node.nodeType === Node.TEXT_NODE) {
          const text = cleanText(node.textContent || '');
          if (text.trim()) {
            runs.push(new TextRun({ text }));
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          if (element.tagName === 'STRONG') {
            const text = cleanText(element.textContent || '');
            runs.push(new TextRun({ text, bold: true }));
          } else if (element.tagName === 'EM') {
            const text = cleanText(element.textContent || '');
            runs.push(new TextRun({ text, italics: true }));
          } else if (element.tagName === 'BR') {
            runs.push(new TextRun({ text: '', break: 1 }));
          } else {
            Array.from(element.childNodes).forEach(child => {
              runs.push(...processNode(child));
            });
          }
        }
        
        return runs;
      };
      
      Array.from(tempDiv.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          if (element.tagName === 'H2') {
            paragraphs.push(
              new Paragraph({
                text: cleanText(element.textContent || ''),
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 }
              })
            );
          } else if (element.tagName === 'P') {
            const runs = processNode(element);
            if (runs.length > 0) {
              paragraphs.push(
                new Paragraph({
                  children: runs,
                  spacing: { after: 120 }
                })
              );
            }
          }
        }
      });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${pageTitle.replace(/\s+/g, '_')}.docx`);
      
      toast({
        title: "DOCX Downloaded",
        description: `${pageTitle} has been downloaded as DOCX.`,
      });
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export as DOCX. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSectionComplete = async (section: keyof typeof completedSections) => {
    const isCurrentlyComplete = completedSections[section];
    
    // Update local state
    setCompletedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Map section keys to section titles
    const sectionKeyToTitle: Record<keyof typeof completedSections, string> = {
      leadMagnet: "Create Your Lead Gen Funnel Copy",
      landingPage: "Write Your Email Copy",
      automation: "Build Your Funnel",
      launch: "Set Up Your Tech",
      testing: "Test Your Funnel"
    };
    
    // Save to database for all sections
    if (userId) {
      try {
        const sectionTitle = sectionKeyToTitle[section];
        
        if (!isCurrentlyComplete) {
          await markSectionComplete.mutateAsync({
            userId,
            stepNumber: 4, // Lead Generation is step 4
            sectionTitle
          });
        } else {
          await unmarkSectionComplete.mutateAsync({
            userId,
            stepNumber: 4,
            sectionTitle
          });
        }
      } catch (error) {
        console.error('Failed to save section completion:', error);
      }
    }
  };

  const handleSectionExpand = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Build Your Strategy</h2>
          <p className="text-lg text-slate-600">Build your lead generation funnel so it's ready for ads!</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Training Videos
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Copy Generator
          </TabsTrigger>
          <TabsTrigger value="implementation" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Implementation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Overview Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overview Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <CardTitle>Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4">
                  <p>
                    We're going to start building your lead gen funnel! In this first step we're building out the funnel and the assets based on the strategy we developed. You'll build your funnel pages using our tools and templates, write your lead gen email sequence using our tool and connect all the tech so everything runs on autopilot.
                  </p>
                  <p>
                    By the end, you'll have a simple, complete funnel designed to attract new leads and drive them to your tripwire offer and eventually your core offer!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Time Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <CardTitle>Estimated Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 mb-2">7–21 Days</p>
                  <p className="text-sm text-slate-600">
                    Depending on your pace, setting up your funnel pages, writing emails, and connecting tech may take a little time.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* To-Do List Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle>To-Do List</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-slate-700">Watch the training videos</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-slate-700">Generate your funnel copy (opt-in page, tripwire page, confirmation page) using the Copy Generator</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-slate-700">Plug your copy into our Go High Level funnel templates</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <p className="text-slate-700">Generate your lead gen email sequence using the Copy Generator</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      5
                    </div>
                    <p className="text-slate-700">Load emails into Go High Level (or other CRM) and connect automations</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      6
                    </div>
                    <p className="text-slate-700">Set up your tech (forms, tags, payment links, automations)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                      7
                    </div>
                    <p className="text-slate-700">Test your funnel + emails to confirm everything works</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Tips Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <CardTitle>Success Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Leverage the resources</strong>
                      <span className="text-slate-600"> → Use our trainings, checklists, and Go High Level templates so you're never starting from scratch.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Show up messy</strong>
                      <span className="text-slate-600"> → Join coaching calls when you're stuck or overwhelmed—screenshare, ask questions, get unstuck live.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Start with generators (70%)</strong>
                      <span className="text-slate-600"> → Use the Copy Generator as your first draft, then refine headlines, benefits, proof, and CTAs.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Reference your Messaging Strategy</strong>
                      <span className="text-slate-600"> → Ensure every promise and CTA aligns with your core message and what your audience actually wants. Read every word as if they are saying it and make sure it makes sense.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Go deep on the messaging</strong>
                      <span className="text-slate-600"> → Make the opt-in a clear, specific win and the tripwire a true "no-brainer" aligned to your core offer.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Be intentional with the journey</strong>
                      <span className="text-slate-600"> → Remember you're creating an experience for the leads to go from your ad to your opt in to your tripwire offer and into your email sequence. It's all one experience.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Build step by step</strong>
                      <span className="text-slate-600"> → One page at a time. Don't worry about advanced automations until the basics are live.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Test end-to-end</strong>
                      <span className="text-slate-600"> → Forms, tags, triggers, payment links, mobile views, and email deliverability before you launch.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Don't chase perfection</strong>
                      <span className="text-slate-600"> → Publish, collect data (opt-in rate, tripwire take rate, opens/clicks), then iterate.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">→</span>
                    <div>
                      <strong className="text-slate-900">Remember</strong>
                      <span className="text-slate-600"> → You can't mess this up—as long as you launch, you win.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Training Videos Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                <CardTitle>Lead Gen Funnel Training</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-700 mb-4">
                Watch these training videos for a complete breakdown of lead gen funnel strategies and technical setup
              </p>
              
              {/* Nested Video Training Tabs */}
              <Tabs defaultValue="strategy" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 gap-1">
                  <TabsTrigger value="strategy" className="text-xs md:text-sm px-2 md:px-4">Lead Gen Funnel Strategy</TabsTrigger>
                  <TabsTrigger value="tech-setup" className="text-xs md:text-sm px-2 md:px-4">Lead Gen Funnel Tech Set Up</TabsTrigger>
                </TabsList>

                <TabsContent value="strategy" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900">Lead Gen Funnel Strategy</h3>
                    
                    <VimeoEmbed 
                      vimeoId="1122322754/53fefcc640" 
                      title="Lead Gen Funnel Strategy"
                      userId={1}
                      stepNumber={101}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tech-setup" className="space-y-6">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-900">Lead Gen Funnel Tech Set Up</h3>
                    
                    {/* Video 1 */}
                    <div className="space-y-3">
                      <VimeoEmbed 
                        vimeoId="1122957674/350a64b6bc" 
                        title="Lead Gen Funnel Tech Setup - Video 1"
                        userId={1}
                        stepNumber={101}
                      />
                    </div>
                    
                    {/* Video 2 */}
                    <div className="space-y-3">
                      <VimeoEmbed 
                        vimeoId="1122957651/50492ca3a4" 
                        title="Lead Gen Funnel Tech Setup - Video 2"
                        userId={1}
                        stepNumber={101}
                      />
                    </div>
                    
                    {/* Video 3 */}
                    <div className="space-y-3">
                      <VimeoEmbed 
                        vimeoId="1122957740/b5832426cb" 
                        title="Lead Gen Funnel Tech Setup - Video 3"
                        userId={1}
                        stepNumber={101}
                      />
                    </div>
                    
                    {/* Video 4 */}
                    <div className="space-y-3">
                      <VimeoEmbed 
                        vimeoId="1122957759/a7afdb5d5f" 
                        title="Lead Gen Funnel Tech Setup - Video 4"
                        userId={1}
                        stepNumber={101}
                      />
                    </div>
                    
                    {/* Video 5 */}
                    <div className="space-y-3">
                      <VimeoEmbed 
                        vimeoId="1122957786/9e7b988b7f" 
                        title="Lead Gen Funnel Tech Setup - Video 5"
                        userId={1}
                        stepNumber={101}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Copy Generator Tab */}
        <TabsContent value="strategy" className="space-y-6">
          {/* Placeholder for lead strategy component */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <CardTitle>Copy Generator</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 mb-4">
                Use this tool to generate your funnel copy and email copy. Remember this is meant to get you 70% of the way there and you will finish the last 30%!
              </p>
              
              {/* Nested Copy Generator Tabs */}
              <Tabs defaultValue="funnel-copy" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 gap-1">
                  <TabsTrigger value="funnel-copy" className="text-xs md:text-sm px-2 md:px-4">Funnel Copy</TabsTrigger>
                  <TabsTrigger value="email-copy" className="text-xs md:text-sm px-2 md:px-4">Email Copy</TabsTrigger>
                </TabsList>

                <TabsContent value="funnel-copy" className="space-y-6">
                  <div className="space-y-8">
                    {/* Generated Copy Display */}
                    {generatedCopy && (
                      <div id="generated-funnel-copy" className="mt-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-7 h-7 text-green-600" />
                            <h3 className="text-2xl font-bold text-slate-900">Your Generated Funnel Copy</h3>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setGeneratedCopy(null)}>
                            Clear
                          </Button>
                        </div>
                        
                        <Tabs defaultValue="opt-in" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="opt-in">Opt-In Page</TabsTrigger>
                            <TabsTrigger value="tripwire">Tripwire Page</TabsTrigger>
                            <TabsTrigger value="checkout">Checkout Page</TabsTrigger>
                            <TabsTrigger value="confirmation">Confirmation Page</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="opt-in" className="mt-4">
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle>Opt-In Page Copy</CardTitle>
                                  <div className="flex gap-2">
                                    {editingPage === 'optInPage' ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={handleCancelEdit}
                                          data-testid="button-cancel-edit-opt-in"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleSaveEdit}
                                          data-testid="button-save-edit-opt-in"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Save className="w-4 h-4 mr-1" />
                                          Save
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleEditPage('optInPage')}
                                          data-testid="button-edit-opt-in"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Edit className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const menu = document.getElementById('export-menu-opt-in');
                                            if (menu) menu.classList.toggle('hidden');
                                          }}
                                          data-testid="button-export-opt-in"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Download className="w-4 h-4 mr-1" />
                                          Export Document
                                        </Button>
                                        <div id="export-menu-opt-in" className="hidden absolute right-0 mt-10 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportPDF('optInPage', 'Opt_In_Page');
                                              document.getElementById('export-menu-opt-in')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as PDF
                                          </button>
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportDOCX('optInPage', 'Opt_In_Page');
                                              document.getElementById('export-menu-opt-in')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as DOCX
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div 
                                  className="text-base leading-relaxed text-slate-800 bg-slate-50 p-6 rounded-lg"
                                  style={{ 
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    fontSize: '16px',
                                    lineHeight: '1.8',
                                    whiteSpace: 'pre-wrap',
                                    overflowX: 'auto'
                                  }}
                                  contentEditable={editingPage === 'optInPage'}
                                  onBlur={(e) => {
                                    if (editingPage === 'optInPage') {
                                      setEditedContent({ ...editedContent, optInPage: e.currentTarget.innerHTML });
                                    }
                                  }}
                                  dangerouslySetInnerHTML={{ __html: editingPage === 'optInPage' ? editedContent.optInPage : generatedCopy.optInPage }}
                                  data-testid="copy-opt-in-page"
                                />
                              </CardContent>
                            </Card>
                          </TabsContent>
                          
                          <TabsContent value="tripwire" className="mt-4">
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle>Tripwire Page Copy</CardTitle>
                                  <div className="flex gap-2">
                                    {editingPage === 'tripwirePage' ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={handleCancelEdit}
                                          data-testid="button-cancel-edit-tripwire"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleSaveEdit}
                                          data-testid="button-save-edit-tripwire"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Save className="w-4 h-4 mr-1" />
                                          Save
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleEditPage('tripwirePage')}
                                          data-testid="button-edit-tripwire"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Edit className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const menu = document.getElementById('export-menu-tripwire');
                                            if (menu) menu.classList.toggle('hidden');
                                          }}
                                          data-testid="button-export-tripwire"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Download className="w-4 h-4 mr-1" />
                                          Export Document
                                        </Button>
                                        <div id="export-menu-tripwire" className="hidden absolute right-0 mt-10 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportPDF('tripwirePage', 'Tripwire_Page');
                                              document.getElementById('export-menu-tripwire')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as PDF
                                          </button>
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportDOCX('tripwirePage', 'Tripwire_Page');
                                              document.getElementById('export-menu-tripwire')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as DOCX
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div 
                                  className="text-base leading-relaxed text-slate-800 bg-slate-50 p-6 rounded-lg"
                                  style={{ 
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    fontSize: '16px',
                                    lineHeight: '1.8',
                                    whiteSpace: 'pre-wrap',
                                    overflowX: 'auto'
                                  }}
                                  contentEditable={editingPage === 'tripwirePage'}
                                  onBlur={(e) => {
                                    if (editingPage === 'tripwirePage') {
                                      setEditedContent({ ...editedContent, tripwirePage: e.currentTarget.innerHTML });
                                    }
                                  }}
                                  dangerouslySetInnerHTML={{ __html: editingPage === 'tripwirePage' ? editedContent.tripwirePage : generatedCopy.tripwirePage }}
                                  data-testid="copy-tripwire-page"
                                />
                              </CardContent>
                            </Card>
                          </TabsContent>
                          
                          <TabsContent value="checkout" className="mt-4">
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle>Checkout Page Copy</CardTitle>
                                  <div className="flex gap-2">
                                    {editingPage === 'checkoutPage' ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={handleCancelEdit}
                                          data-testid="button-cancel-edit-checkout"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleSaveEdit}
                                          data-testid="button-save-edit-checkout"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Save className="w-4 h-4 mr-1" />
                                          Save
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleEditPage('checkoutPage')}
                                          data-testid="button-edit-checkout"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Edit className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const menu = document.getElementById('export-menu-checkout');
                                            if (menu) menu.classList.toggle('hidden');
                                          }}
                                          data-testid="button-export-checkout"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Download className="w-4 h-4 mr-1" />
                                          Export Document
                                        </Button>
                                        <div id="export-menu-checkout" className="hidden absolute right-0 mt-10 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportPDF('checkoutPage', 'Checkout_Page');
                                              document.getElementById('export-menu-checkout')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as PDF
                                          </button>
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportDOCX('checkoutPage', 'Checkout_Page');
                                              document.getElementById('export-menu-checkout')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as DOCX
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div 
                                  className="text-base leading-relaxed text-slate-800 bg-slate-50 p-6 rounded-lg"
                                  style={{ 
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    fontSize: '16px',
                                    lineHeight: '1.8',
                                    whiteSpace: 'pre-wrap',
                                    overflowX: 'auto'
                                  }}
                                  contentEditable={editingPage === 'checkoutPage'}
                                  onBlur={(e) => {
                                    if (editingPage === 'checkoutPage') {
                                      setEditedContent({ ...editedContent, checkoutPage: e.currentTarget.innerHTML });
                                    }
                                  }}
                                  dangerouslySetInnerHTML={{ __html: editingPage === 'checkoutPage' ? editedContent.checkoutPage : generatedCopy.checkoutPage }}
                                  data-testid="copy-checkout-page"
                                />
                              </CardContent>
                            </Card>
                          </TabsContent>
                          
                          <TabsContent value="confirmation" className="mt-4">
                            <Card>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle>Confirmation Page Copy</CardTitle>
                                  <div className="flex gap-2">
                                    {editingPage === 'confirmationPage' ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={handleCancelEdit}
                                          data-testid="button-cancel-edit-confirmation"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={handleSaveEdit}
                                          data-testid="button-save-edit-confirmation"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Save className="w-4 h-4 mr-1" />
                                          Save
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleEditPage('confirmationPage')}
                                          data-testid="button-edit-confirmation"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Edit className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const menu = document.getElementById('export-menu-confirmation');
                                            if (menu) menu.classList.toggle('hidden');
                                          }}
                                          data-testid="button-export-confirmation"
                                          style={{ backgroundColor: '#f5a89f', color: 'white' }}
                                          className="hover:opacity-90"
                                        >
                                          <Download className="w-4 h-4 mr-1" />
                                          Export Document
                                        </Button>
                                        <div id="export-menu-confirmation" className="hidden absolute right-0 mt-10 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportPDF('confirmationPage', 'Confirmation_Page');
                                              document.getElementById('export-menu-confirmation')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as PDF
                                          </button>
                                          <button
                                            className="block w-full text-left px-4 py-2 hover:bg-slate-50"
                                            onClick={() => {
                                              handleExportDOCX('confirmationPage', 'Confirmation_Page');
                                              document.getElementById('export-menu-confirmation')?.classList.add('hidden');
                                            }}
                                          >
                                            Download as DOCX
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div 
                                  className="text-base leading-relaxed text-slate-800 bg-slate-50 p-6 rounded-lg"
                                  style={{ 
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    fontSize: '16px',
                                    lineHeight: '1.8',
                                    whiteSpace: 'pre-wrap',
                                    overflowX: 'auto'
                                  }}
                                  contentEditable={editingPage === 'confirmationPage'}
                                  onBlur={(e) => {
                                    if (editingPage === 'confirmationPage') {
                                      setEditedContent({ ...editedContent, confirmationPage: e.currentTarget.innerHTML });
                                    }
                                  }}
                                  dangerouslySetInnerHTML={{ __html: editingPage === 'confirmationPage' ? editedContent.confirmationPage : generatedCopy.confirmationPage }}
                                  data-testid="copy-confirmation-page"
                                />
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}

                    {/* Lead Magnet Section */}
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-slate-900">Lead Magnet</h2>
                      
                      {/* About the Lead Magnet Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>🎯</span>
                            About the Lead Magnet / Opt-In
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="leadMagnetTitle">1. What is the title or name of your lead magnet?</Label>
                            <Input 
                              id="leadMagnetTitle" 
                              placeholder="Enter your lead magnet title..." 
                              value={leadMagnetTitle}
                              onChange={(e) => setLeadMagnetTitle(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-leadMagnetTitle", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="resourceType">2. What type of resource is it? (e.g. PDF guide, quiz, checklist, template, video training, etc.)</Label>
                            <Input 
                              id="resourceType" 
                              placeholder="Enter the type of resource..." 
                              value={resourceType}
                              onChange={(e) => setResourceType(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-resourceType", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="transformation">3. In one sentence, what result or transformation will someone get from it? The main outcome and use your ICA's language!</Label>
                            <Textarea 
                              id="transformation" 
                              placeholder="Describe the transformation or result..." 
                              rows={3}
                              value={transformation}
                              onChange={(e) => setTransformation(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-transformation", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="problemSolved">4. What specific problem does it solve for your ideal customer right now?</Label>
                            <Textarea 
                              id="problemSolved" 
                              placeholder="Describe the specific problem..." 
                              rows={3}
                              value={problemSolved}
                              onChange={(e) => setProblemSolved(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-problemSolved", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="urgency">5. Why is this problem urgent or important to solve?</Label>
                            <Textarea 
                              id="urgency" 
                              placeholder="Explain the urgency..." 
                              rows={3}
                              value={urgency}
                              onChange={(e) => setUrgency(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-urgency", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="uniqueness">6. What's unique about your lead magnet? Think about the outcome and how you help them achieve that outcome, why is that better than alternative pieces of content?</Label>
                            <Textarea 
                              id="uniqueness" 
                              placeholder="Describe what makes it unique..." 
                              rows={3}
                              value={uniqueness}
                              onChange={(e) => setUniqueness(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-uniqueness", e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Lead Magnet Value & Positioning Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>💡</span>
                            Value & Positioning
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="painPoints">1. What's the main pain points, frustrations, or challenges this resource addresses for them? List multiple and be specific.</Label>
                            <Textarea 
                              id="painPoints" 
                              placeholder="List the pain points, frustrations, and challenges..." 
                              rows={4}
                              value={painPoints}
                              onChange={(e) => setPainPoints(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-painPoints", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="quickWin">2. What's the quick win they'll walk away with after opting in?</Label>
                            <Textarea 
                              id="quickWin" 
                              placeholder="Describe the quick win..." 
                              rows={3}
                              value={quickWin}
                              onChange={(e) => setQuickWin(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-quickWin", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="objections">3. What objections might someone have before opting in? (e.g. "I don't have time," "I've already tried this," "I don't want spam.")</Label>
                            <Textarea 
                              id="objections" 
                              placeholder="List potential objections..." 
                              rows={3}
                              value={objections}
                              onChange={(e) => setObjections(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-objections", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="bulletPoints">4. If your lead magnet had 3 bullet points to sell it, what would they be?</Label>
                            <Textarea 
                              id="bulletPoints" 
                              placeholder="Enter 3 compelling bullet points..." 
                              rows={4}
                              value={bulletPoints}
                              onChange={(e) => setBulletPoints(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-bulletPoints", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="socialProof">5. Do you have any results or social proof that you'd use to showcase how great this lead gen offer is?</Label>
                            <Textarea 
                              id="socialProof" 
                              placeholder="Describe any results or social proof..." 
                              rows={3}
                              value={socialProof}
                              onChange={(e) => setSocialProof(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-socialProof", e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tripwire Section */}
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-slate-900">Tripwire</h2>
                      
                      {/* About the Tripwire Offer Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>🎯</span>
                            About the Tripwire Offer
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="tripwireTitle">1. What is the title or name of your tripwire offer?</Label>
                            <Input 
                              id="tripwireTitle" 
                              placeholder="Enter your tripwire offer title..."
                              value={tripwireTitle}
                              onChange={(e) => setTripwireTitle(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireTitle", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="tripwireType">2. What type of product is it? (e.g. mini-course, template pack, workshop, audit, starter kit, script library, etc.)</Label>
                            <Input 
                              id="tripwireType" 
                              placeholder="Enter the type of product..."
                              value={tripwireType}
                              onChange={(e) => setTripwireType(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireType", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="tripwireOutcome">3. In one sentence, what's the core outcome/result someone gets from this tripwire? Use your ICA's language.</Label>
                            <Textarea 
                              id="tripwireOutcome" 
                              placeholder="Describe the core outcome/result..." 
                              rows={3}
                              value={tripwireOutcome}
                              onChange={(e) => setTripwireOutcome(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireOutcome", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="tripwireConnection">4. How does this tripwire directly connect to the lead magnet they just opted into? Why is it the next step?</Label>
                            <Textarea 
                              id="tripwireConnection" 
                              placeholder="Explain the connection to the lead magnet..." 
                              rows={3}
                              value={tripwireConnection}
                              onChange={(e) => setTripwireConnection(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireConnection", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="tripwirePrice">5. What's the price point of the tripwire?</Label>
                            <Input 
                              id="tripwirePrice" 
                              placeholder="Enter the price point..."
                              value={tripwirePrice}
                              onChange={(e) => setTripwirePrice(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwirePrice", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="noBrainer">6. Why is this offer a "no-brainer" at that price?</Label>
                            <Textarea 
                              id="noBrainer" 
                              placeholder="Explain why it's a no-brainer..." 
                              rows={3}
                              value={noBrainer}
                              onChange={(e) => setNoBrainer(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-noBrainer", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="regularPrice">7. What would you regularly charge for this product?</Label>
                            <Input 
                              id="regularPrice" 
                              placeholder="Enter the regular price..."
                              value={regularPrice}
                              onChange={(e) => setRegularPrice(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-regularPrice", e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tripwire Value & Positioning Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>💡</span>
                            Value & Positioning
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="tripwireProblem">7. What specific problem or pain point does this tripwire solve that your ideal customer feels right now?</Label>
                            <Textarea 
                              id="tripwireProblem" 
                              placeholder="Describe the specific problem..." 
                              rows={3}
                              value={tripwireProblem}
                              onChange={(e) => setTripwireProblem(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireProblem", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="tripwireDifferent">8. What makes this tripwire different or better than alternatives? (Think: speed, simplicity, format, effectiveness, uniqueness.)</Label>
                            <Textarea 
                              id="tripwireDifferent" 
                              placeholder="Explain what makes it different..." 
                              rows={3}
                              value={tripwireDifferent}
                              onChange={(e) => setTripwireDifferent(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireDifferent", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="tripwireWins">9. What quick win(s) will they walk away with immediately after purchasing?</Label>
                            <Textarea 
                              id="tripwireWins" 
                              placeholder="Describe the quick wins..." 
                              rows={3}
                              value={tripwireWins}
                              onChange={(e) => setTripwireWins(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireWins", e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Objections & Hesitations Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>🚫</span>
                            Objections & Hesitations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="tripwireObjections">11. What objections might someone have before buying?</Label>
                            <Textarea 
                              id="tripwireObjections" 
                              placeholder="List potential objections..." 
                              rows={3}
                              value={tripwireObjections}
                              onChange={(e) => setTripwireObjections(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-tripwireObjections", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="overcomingObjections">12. How would you answer or overcome those objections?</Label>
                            <Textarea 
                              id="overcomingObjections" 
                              placeholder="Explain how to overcome objections..." 
                              rows={3}
                              value={overcomingObjections}
                              onChange={(e) => setOvercomingObjections(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-overcomingObjections", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="riskRemoval">13. What risks are you removing for them? (e.g. money-back guarantee, instant access, done-for-you templates.)</Label>
                            <Textarea 
                              id="riskRemoval" 
                              placeholder="Describe risk removal strategies..." 
                              rows={3}
                              value={riskRemoval}
                              onChange={(e) => setRiskRemoval(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-riskRemoval", e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Proof & Credibility Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <span>📝</span>
                            Proof & Credibility
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="testimonials">14. Do you have any testimonials, screenshots, or results you can include to show this works? It's okay if they are not for this exact product.</Label>
                            <Textarea 
                              id="testimonials" 
                              placeholder="Share testimonials or results..." 
                              rows={4}
                              value={testimonials}
                              onChange={(e) => setTestimonials(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-testimonials", e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="authority">15. Do you have any authority, experience, or credentials that increase trust in this offer and should be mentioned?</Label>
                            <Textarea 
                              id="authority" 
                              placeholder="Describe your authority and credentials..." 
                              rows={3}
                              value={authority}
                              onChange={(e) => setAuthority(e.target.value)}
                              onBlur={(e) => handleSaveResponse("leadgen-authority", e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Generate Button */}
                    <div className="flex flex-col items-center gap-4">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                        onClick={handleGenerateFunnelCopy}
                        disabled={isGenerating}
                        data-testid="button-generate-funnel-copy"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5 mr-2" />
                            Generate Funnel Copy
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-slate-600">Generate all 4 pages: Opt-in, Tripwire, Checkout & Confirmation</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email-copy" className="space-y-4">
                  <div className="space-y-6">
                    {/* Generated Email Sequence Display */}
                    {generatedEmailSequence && (
                      <div id="generated-email-sequence" className="space-y-6 mt-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-slate-900">SEQUENCE (5 EMAILS)</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleEditEmailSequence}
                              className="bg-embodied-coral hover:bg-embodied-orange text-white"
                              data-testid="button-edit-email-sequence"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                  data-testid="button-export-email-sequence"
                                >
                                  <FileDown className="w-4 h-4 mr-2" />
                                  Export Document
                                  <ChevronDown className="w-4 h-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={handleExportEmailSequencePDF}
                                  data-testid="button-export-pdf"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Download as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={handleExportEmailSequenceDOCX}
                                  data-testid="button-export-docx"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Download as DOCX
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <Card className="border-2 border-slate-200">
                          <CardContent className="p-8">
                            {generatedEmailSequence.map((email, index) => (
                              <div key={email.emailNumber}>
                                <div className="space-y-4">
                                  {/* Email Header */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold flex items-center justify-center">
                                      {email.emailNumber}
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-500 font-medium">
                                        Email {email.emailNumber} of 5
                                      </div>
                                      <div className="text-lg font-bold text-slate-900">
                                        {email.subject}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Email Body */}
                                  <div className="pl-[52px]">
                                    <div 
                                      className="text-slate-700 space-y-4"
                                      style={{ 
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        fontSize: '16px',
                                        lineHeight: '1.8'
                                      }}
                                      data-testid={`email-body-${email.emailNumber}`}
                                    >
                                      {email.body.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx} className="mb-4 last:mb-0">
                                          {paragraph.trim()}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Separator between emails */}
                                {index < generatedEmailSequence.length - 1 && (
                                  <div className="my-8 border-t-2 border-slate-200"></div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                        
                        {/* Edit Email Sequence Dialog */}
                        <Dialog open={isEditingEmailSequence} onOpenChange={(open) => !open && handleCancelEmailSequenceEdit()}>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Email Sequence</DialogTitle>
                              <DialogDescription>
                                Make changes to your email sequence. Edit subject lines and body content for each email.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6 py-4">
                              {editedEmailSequence?.map((email, index) => (
                                <Card key={email.emailNumber} className="border-2 border-slate-200">
                                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                        {email.emailNumber}
                                      </div>
                                      <span className="text-sm font-semibold text-slate-700">
                                        Email {email.emailNumber} of 5
                                      </span>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-4 space-y-3">
                                    <div className="space-y-2">
                                      <Label htmlFor={`subject-${email.emailNumber}`} className="text-sm font-medium">
                                        Subject Line
                                      </Label>
                                      <Input
                                        id={`subject-${email.emailNumber}`}
                                        value={email.subject}
                                        onChange={(e) => handleUpdateEmailInSequence(index, 'subject', e.target.value)}
                                        placeholder="Enter email subject line..."
                                        data-testid={`input-edit-subject-${email.emailNumber}`}
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label htmlFor={`body-${email.emailNumber}`} className="text-sm font-medium">
                                        Email Body
                                      </Label>
                                      <Textarea
                                        id={`body-${email.emailNumber}`}
                                        value={email.body}
                                        onChange={(e) => handleUpdateEmailInSequence(index, 'body', e.target.value)}
                                        placeholder="Enter email body content..."
                                        rows={12}
                                        className="font-mono text-sm"
                                        data-testid={`textarea-edit-body-${email.emailNumber}`}
                                      />
                                      <p className="text-xs text-slate-500">
                                        Tip: Use double line breaks (press Enter twice) to create new paragraphs.
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            
                            <DialogFooter className="gap-2">
                              <Button
                                variant="default"
                                onClick={handleCancelEmailSequenceEdit}
                                className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                data-testid="button-cancel-edit-sequence"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSaveEmailSequence}
                                className="bg-embodied-coral hover:bg-embodied-orange text-white"
                                data-testid="button-save-edit-sequence"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    
                    <h2 className="text-2xl font-bold text-slate-900">Email Sequence</h2>
                    
                    {/* Audience Connection Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>💡</span>
                          Audience Connection
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <Label htmlFor="coreBeliefShift">1. What's one core belief, mindset shift, or "aha moment" you want your audience to have while reading this sequence?</Label>
                          <Textarea 
                            id="coreBeliefShift" 
                            placeholder="Describe the core belief or mindset shift..." 
                            rows={4}
                            value={coreBeliefShift}
                            onChange={(e) => setCoreBeliefShift(e.target.value)}
                            onBlur={(e) => handleSaveResponse("leadgen-coreBeliefShift", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="objectionsDoubts">2. What common objections, doubts, or limiting beliefs do you want to gently overcome in these emails?</Label>
                          <Textarea 
                            id="objectionsDoubts" 
                            placeholder="List common objections and limiting beliefs..." 
                            rows={4}
                            value={objectionsDoubts}
                            onChange={(e) => setObjectionsDoubts(e.target.value)}
                            onBlur={(e) => handleSaveResponse("leadgen-objectionsDoubts", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="storiesExamples">3. What stories, personal experiences, or client examples could help you build connection and trust in an organic way?</Label>
                          <Textarea 
                            id="storiesExamples" 
                            placeholder="Share stories and examples that build connection..." 
                            rows={4}
                            value={storiesExamples}
                            onChange={(e) => setStoriesExamples(e.target.value)}
                            onBlur={(e) => handleSaveResponse("leadgen-storiesExamples", e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Content & Nurture Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>📩</span>
                          Content & Nurture
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <Label htmlFor="contentHighlight">4. What other pieces of content do you want to highlight in this sequence? (e.g. podcast episodes, social media channels, blog posts, YouTube videos — include links.)</Label>
                          <Textarea 
                            id="contentHighlight" 
                            placeholder="List content with links..." 
                            rows={4}
                            value={contentHighlight}
                            onChange={(e) => setContentHighlight(e.target.value)}
                            onBlur={(e) => handleSaveResponse("leadgen-contentHighlight", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="contentOrder">5. Is there a specific order in which you'd like subscribers to see this content (or should AI decide the flow)?</Label>
                          <Textarea 
                            id="contentOrder" 
                            placeholder="Describe the content order or let AI decide..." 
                            rows={3}
                            value={contentOrder}
                            onChange={(e) => setContentOrder(e.target.value)}
                            onBlur={(e) => handleSaveResponse("leadgen-contentOrder", e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Generate Email Sequence Button */}
                    <div className="flex justify-center pt-6">
                      <Button
                        onClick={handleGenerateEmailSequence}
                        disabled={isGeneratingEmails}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
                        data-testid="button-generate-email-sequence"
                      >
                        {isGeneratingEmails ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Generating Email Sequence...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">✨</span>
                            Generate Email Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Tab */}
        <TabsContent value="implementation" className="space-y-6">
          {/* Implementation Steps Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <CardTitle>Implementation Steps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700">
                Follow these steps to complete your funnel and have it fully ready to launch ads to!
              </p>

              {/* Step-by-step sections */}
              <div className="grid gap-4">
                {/* Create Lead Magnet */}
                <Collapsible open={expandedSections.leadMagnet} onOpenChange={() => handleSectionExpand('leadMagnet')}>
                  <Card className={`border-2 transition-colors ${completedSections.leadMagnet ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.leadMagnet}
                              onCheckedChange={() => handleSectionComplete('leadMagnet')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-lead-magnet"
                            />
                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              1
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Create Your Lead Gen Funnel Copy</h3>
                          </div>
                          {expandedSections.leadMagnet ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600">
                          Answer the Copy Generator questions in as much detail as you can to generate your copy! Take that copy and finalize it. It's meant to get you 70% of the way there and you finish the last 30%!
                          
                          By the end of this process you will have finalized opt in page, tripwire page and a purchase confirmation page copy read to build your funnel with.
                          
                          If you get stuck with the questions or are missing depth, come to our Messaging Strategy Call and workshop it!
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Build Landing Page */}
                <Collapsible open={expandedSections.landingPage} onOpenChange={() => handleSectionExpand('landingPage')}>
                  <Card className={`border-2 transition-colors ${completedSections.landingPage ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.landingPage}
                              onCheckedChange={() => handleSectionComplete('landingPage')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-landing-page"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              2
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Write Your Email Copy</h3>
                          </div>
                          {expandedSections.landingPage ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600">
                          Use the copy generator to create draft email sequence copy for your funnel. Create the draft and then edit it so you have fully complete email copy ready to load into your CRM.
                          
                          If you get stuck, leverage our Messaging Support Call!
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Set Up Automation */}
                <Collapsible open={expandedSections.automation} onOpenChange={() => handleSectionExpand('automation')}>
                  <Card className={`border-2 transition-colors ${completedSections.automation ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.automation}
                              onCheckedChange={() => handleSectionComplete('automation')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-automation"
                            />
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              3
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Build Your Funnel</h3>
                          </div>
                          {expandedSections.automation ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600 mb-4">
                          Take your finalized copy and create your funnel using our easy templates
                        </p>
                        <div className="text-center space-y-3">
                          <a 
                            href="https://affiliates.gohighlevel.com/?fp_ref=embodied-marketing59&funnel_share=68d3738ff51fc6cab35b4cb9" 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                              Access the GHL Templates Here
                            </Button>
                          </a>
                          <div className="flex gap-3 justify-center">
                            <a 
                              href="https://get.embodiedmarketing.com/opt-in" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                                View Our Opt In Page Sample Here
                              </Button>
                            </a>
                            <a 
                              href="https://get.embodiedmarketing.com/tripwire-page" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                                View Our Tripwire Page Sample Here
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Launch Campaign */}
                <Collapsible open={expandedSections.launch} onOpenChange={() => handleSectionExpand('launch')}>
                  <Card className={`border-2 transition-colors ${completedSections.launch ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.launch}
                              onCheckedChange={() => handleSectionComplete('launch')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-launch"
                            />
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              4
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Set Up Your Tech</h3>
                          </div>
                          {expandedSections.launch ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600">
                          Load your emails into your CRM or GHL platform and connect your funnel so everything is working. Check all the links in the emails, buttons on the page and make sure it's all set up.
                          
                          If you get stuck come to our tech support call for support!
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Test Your Funnel */}
                <Collapsible open={expandedSections.testing} onOpenChange={() => handleSectionExpand('testing')}>
                  <Card className={`border-2 transition-colors ${completedSections.testing ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover:bg-slate-50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={completedSections.testing}
                              onCheckedChange={() => handleSectionComplete('testing')}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="checkbox-testing"
                            />
                            <div className="w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-medium flex items-center justify-center flex-shrink-0">
                              5
                            </div>
                            <h3 className="font-semibold text-slate-900 text-left">Test Your Funnel</h3>
                          </div>
                          {expandedSections.testing ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-slate-600">
                          Test your funnel as a new lead and make sure everything is working correctly. Test every button, make sure you got the email correctly and place a test purchase of the product. Make sure to check your pages on both desktop and mobile.
                          
                          Your funnel should be fully functioning and ready for ads at this point!
                          
                          If something with your tech is not working come to our tech support call.
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
