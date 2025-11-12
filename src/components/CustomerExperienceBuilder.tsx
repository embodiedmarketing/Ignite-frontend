import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Mail, Calendar, CheckCircle, Target, Users, MessageSquare, Plus, Trash2, Edit, RefreshCw, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { nanoid } from 'nanoid';

interface CustomerExperienceBuilderProps {
  userId: number;
}

interface TodoItem {
  id: string;
  text: string;
  category: 'technical' | 'content' | 'support' | 'quality';
  completed?: boolean;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  details?: string;
  completed?: boolean;
}

interface TodoCategory {
  key: 'technical' | 'content' | 'support' | 'quality';
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function CustomerExperienceBuilder({ userId }: CustomerExperienceBuilderProps) {
  // Email sequence state
  const [expandedEmails, setExpandedEmails] = useState<{ [key: string]: boolean }>({});
  
  // Todo categories
  const todoCategories: TodoCategory[] = [
    { key: 'technical', name: 'Technical Setup', icon: Target, color: 'blue' },
    { key: 'content', name: 'Content Preparation', icon: Target, color: 'orange' },
    { key: 'support', name: 'Support Systems', icon: MessageSquare, color: 'purple' },
    { key: 'quality', name: 'Quality Assurance', icon: CheckCircle, color: 'red' }
  ];

  // Default todo items
  const defaultTodos: TodoItem[] = [
    { id: '1', text: 'Set up immediate access system (login credentials, direct links)', category: 'technical' },
    { id: '2', text: 'Test all access points and delivery mechanisms before launch', category: 'technical' },
    { id: '3', text: 'Prepare confirmation email with clear next steps', category: 'technical' },
    { id: '4', text: 'Organize all course materials in logical, numbered sequence', category: 'content' },
    { id: '5', text: 'Establish support email system with clear response time expectations', category: 'support' },
    { id: '6', text: 'Create FAQ document addressing common technical and program questions', category: 'support' },
    { id: '7', text: 'Schedule first welcome call or live orientation session', category: 'support' },
    { id: '8', text: 'Test complete customer journey from purchase to first week experience', category: 'quality' },
    { id: '9', text: 'Review all communications for clarity and actionable next steps', category: 'quality' }
  ];

  // Default content items
  const defaultContentItems: ContentItem[] = [
    { id: '1', title: 'Module 1 Content', description: 'Create first training module with worksheets and examples', deadline: '' },
    { id: '2', title: 'Resource Library', description: 'Organize bonus materials, templates, and reference documents', deadline: '' }
  ];

  // Todo state management
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('customerExperience_todos');
    return saved ? JSON.parse(saved) : defaultTodos;
  });
  
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState<'technical' | 'content' | 'support' | 'quality'>('technical');

  // Content items state management with cache clearing for outdated items
  const [contentItems, setContentItems] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem('customerExperience_contentItems');
    if (saved) {
      const parsedItems = JSON.parse(saved);
      // Clear outdated items that contain "Welcome Video" or "Quick Start Guide"
      const filteredItems = parsedItems.filter((item: ContentItem) => 
        !item.title.includes('Welcome Video') && 
        !item.title.includes('Quick Start Guide')
      );
      // If we filtered out items, save the cleaned version
      if (filteredItems.length !== parsedItems.length) {
        localStorage.setItem('customerExperience_contentItems', JSON.stringify(filteredItems.length > 0 ? filteredItems : defaultContentItems));
        return filteredItems.length > 0 ? filteredItems : defaultContentItems;
      }
      return parsedItems;
    }
    return defaultContentItems;
  });
  
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentDescription, setNewContentDescription] = useState('');
  const [newContentDeadline, setNewContentDeadline] = useState('');
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState<{ [key: string]: boolean }>({});

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customerExperience_todos', JSON.stringify(todos));
  }, [todos]);

  // Save content items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customerExperience_contentItems', JSON.stringify(contentItems));
  }, [contentItems]);

  // Todo management functions
  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: newTodoText.trim(),
        category: newTodoCategory
      };
      setTodos([...todos, newTodo]);
      setNewTodoText('');
      setIsAddingTodo(false);
    }
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // Content management functions
  const addContent = () => {
    if (newContentTitle.trim()) {
      const newContent: ContentItem = {
        id: Date.now().toString(),
        title: newContentTitle,
        description: newContentDescription,
        deadline: newContentDeadline
      };
      setContentItems(prev => [...prev, newContent]);
      setNewContentTitle('');
      setNewContentDescription('');
      setNewContentDeadline('');
      setIsAddingContent(false);
    }
  };

  const toggleContentCompletion = (id: string) => {
    setContentItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteContent = (id: string) => {
    setContentItems(prev => prev.filter(item => item.id !== id));
  };

  const updateContentDeadline = (id: string, deadline: string) => {
    setContentItems(prev => prev.map(item =>
      item.id === id ? { ...item, deadline } : item
    ));
  };

  const updateContentDetails = (id: string, details: string) => {
    setContentItems(prev => prev.map(item =>
      item.id === id ? { ...item, details } : item
    ));
  };

  const toggleContentExpansion = (id: string) => {
    setExpandedContent(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Access information checklist state
  const [immediateAccessChecked, setImmediateAccessChecked] = useState(false);
  
  // Interactive content stored in localStorage
  const [customerExperienceData, setCustomerExperienceData] = useState({
    onboardingKnowledge: '',
    potentialIssues: '',
    emailSequence: {
      day0: {
        subject: "Welcome to [PROGRAM NAME] - Your Access Details",
        preview: "Everything you need to get started (plus a special bonus inside)",
        copy: `Hi [FIRST NAME],

Welcome to [PROGRAM NAME]! I'm so excited you're here.

You just made one of the best investments in your [BUSINESS/LIFE/SKILL] - and I want to make sure you get incredible results starting TODAY.

🎯 HERE'S HOW TO ACCESS EVERYTHING:

Login Portal: [PORTAL LINK]
Your Username: [USERNAME]
Temporary Password: [PASSWORD] (change this on first login)

📚 START HERE (Your First 24 Hours):
1. Watch the "Welcome & Quick Start" video (15 minutes)
2. Download your [PROGRAM NAME] Action Guide
3. Join our private community: [COMMUNITY LINK]
4. Introduce yourself and share your biggest goal

💡 INSIDER TIP: The most successful students complete Module 1 within 48 hours. It sets the foundation for everything that follows.

🎁 SPECIAL BONUS: I've included my personal [BONUS RESOURCE] in your member area - it's worth $[VALUE] and will help you [SPECIFIC BENEFIT].

IMPORTANT: Save this email! You'll need these details to access your training.

Your transformation starts now. I can't wait to see what you achieve.

Questions? Just reply to this email - I read every single one.

To your success,
[YOUR NAME]

P.S. Check your email tomorrow for your Day 1 action plan. We're going to dive deep into [SPECIFIC TOPIC] that will [SPECIFIC OUTCOME].`
      },
      day1: {
        subject: "Day 1: Your [PROGRAM NAME] Success Roadmap (Action Required)",
        preview: "The 3 steps that separate successful students from everyone else",
        copy: `Hi [FIRST NAME],

How did your first day with [PROGRAM NAME] go? I hope you're feeling excited about what's ahead.

Here's what I've learned after helping [NUMBER] people achieve [SPECIFIC RESULT]: The students who see the fastest results follow a very specific pattern in their first week.

🎯 YOUR SUCCESS ROADMAP (Next 7 Days):

FOUNDATION WEEK PRIORITIES:
1. Complete Module 1: "[MODULE NAME]" (This unlocks everything)
2. Set up your [TOOL/SYSTEM] using the template I provide
3. Post your introduction in our community (seriously, this matters!)

📈 WHAT SUCCESS LOOKS LIKE:
By the end of this week, you should have:
• A clear understanding of [CORE CONCEPT]
• Your [SYSTEM/TOOL] set up and ready to use
• Connected with at least 3 other members
• Started implementing [FIRST STRATEGY]

⚡ THIS WEEK'S CHALLENGE:
I want you to [SPECIFIC CHALLENGE] by Friday. When you complete it, reply to this email with a screenshot or description. I'll personally review it and give you feedback.

💡 SUCCESS SECRET: The difference between students who succeed and those who struggle? The successful ones take imperfect action. Don't wait until you feel "ready" - start messy and refine as you go.

❓ STUCK? Here are the 3 most common questions from Week 1:

Q: "Should I complete everything in order?"
A: Yes for modules, but feel free to jump ahead in the bonus materials.

Q: "How much time should I spend daily?"
A: Start with 30 minutes. Consistency beats intensity.

Q: "What if I fall behind?"
A: Just jump back in where we are. This isn't school - there are no failing grades!

Your action for TODAY: [SPECIFIC DAILY ACTION]

You've got this! I'm rooting for you.

[YOUR NAME]

P.S. Tomorrow I'll share the #1 mistake that derails 80% of people in Week 2 (and how to avoid it). Keep an eye out for that email.`
      },
      day3: {
        subject: "The #1 Mistake 80% Make in Week 2 (avoid this!)",
        preview: "Plus a mid-week motivation boost just for you",
        copy: `Hi [FIRST NAME],

We're 3 days in, and I wanted to check on you personally.

First off - how are you feeling about [PROGRAM NAME]? If you're feeling a little overwhelmed or wondering "am I doing this right?" - that's completely normal.

I've guided [NUMBER] people through this exact journey, and here's what I notice:

🚨 THE #1 MISTAKE (that derails 80% of people):
Trying to be perfect instead of making progress.

I see students spend 3 hours perfecting their first [DELIVERABLE] when they should be moving forward with "good enough" and refining later.

✅ WHAT SUCCESSFUL STUDENTS DO INSTEAD:
• They embrace "messy action"
• They ask questions in the community
• They celebrate small wins daily
• They trust the process (even when it feels uncomfortable)

📊 WHERE YOU SHOULD BE RIGHT NOW:
• Module 1: Complete ✓
• Community intro: Posted ✓
• [TOOL/SYSTEM]: Set up (even if basic) ✓
• First [STRATEGY]: Started (doesn't need to be perfect) ✓

If you haven't checked all these boxes yet - no worries! Just focus on the one that feels most important and tackle it today.

💬 LET'S CONNECT:
Hit reply and tell me:
1. What's your biggest win so far (even if it feels small)?
2. What's your biggest challenge right now?
3. What question do you wish you could ask me?

I read every email and personally reply to each one. Seriously.

🎯 YOUR ASSIGNMENT FOR TODAY:
[SPECIFIC DAILY ACTION]

Remember: You invested in yourself for a reason. That reason is still valid, even on the hard days.

Believing in you,
[YOUR NAME]

P.S. Tomorrow's email reveals the "Week 1 Success Formula" that separates the students who finish strong from those who fade. It's based on data from our most successful graduates.

P.P.S. If you're feeling behind, don't quit - just adjust. Progress beats perfection every single time.`
      },
      day7: {
        subject: "🎉 Week 1 COMPLETE! Your Success Formula + Week 2 Preview",
        preview: "You're in the top 20% who finish Week 1 - here's what comes next",
        copy: `Hi [FIRST NAME],

CONGRATULATIONS! You just completed Week 1 of [PROGRAM NAME]! 

Here's something most people don't realize: Simply finishing Week 1 puts you in the top 20% of all students. Seriously.

🏆 WHAT YOU'VE ACCOMPLISHED (take a moment to appreciate this):
• Mastered [CORE CONCEPT] from Module 1
• Set up your [TOOL/SYSTEM] and started implementing
• Connected with the community (relationship-building = business-building)
• Completed your first [DELIVERABLE/STRATEGY]
• Most importantly: You showed up consistently for 7 days

That last one? That's the real predictor of success.

📊 THE WEEK 1 SUCCESS FORMULA (based on our top performers):
1. Consistency over intensity ✓ (You nailed this)
2. Community over isolation ✓ (You're connected)
3. Progress over perfection ✓ (You're moving forward)
4. Questions over confusion ✓ (You're engaging)

🚀 WEEK 2 PREVIEW: "The Implementation Phase"
This is where things get exciting. You'll be taking everything from Week 1 and putting it into real-world action:

Monday: [SPECIFIC MODULE/TOPIC]
Wednesday: [LIVE TRAINING/CALL] at [TIME]
Friday: [HANDS-ON WORKSHOP/EXERCISE]

🎯 YOUR WEEK 2 FOCUS:
[SPECIFIC PRIORITY] - This is where you'll see your first real breakthrough.

💡 INSIDER PREDICTION:
Based on your Week 1 performance, I predict you'll be ready for [ADVANCED STRATEGY] by Day 10. Most people aren't ready until Week 3, but you're ahead of the curve.

📞 SPECIAL INVITATION:
You've earned access to our "Week 1 Graduates" bonus call this Thursday at [TIME]. I'll be sharing the advanced strategies that aren't in the regular curriculum. Check your member portal for the link.

🎁 SURPRISE BONUS:
Because you finished Week 1, I'm unlocking the "[BONUS RESOURCE]" in your member area. It's valued at $[AMOUNT] and will accelerate your [SPECIFIC OUTCOME].

YOUR ASSIGNMENT FOR MONDAY:
[SPECIFIC WEEK 2 STARTER ACTION]

One more thing - I'm genuinely proud of you. Starting is hard. Staying consistent is harder. You're doing both.

Week 2 is going to be incredible.

[YOUR NAME]

P.S. Keep an eye out for Monday's email - I'm sharing the "Implementation Accelerator" framework that helped [SPECIFIC STUDENT] achieve [SPECIFIC RESULT] in just 2 weeks.

P.P.S. If anyone asks why you're glowing this week, tell them it's because you're finally [TRANSFORMATION THEY'RE WORKING TOWARD]. Because you are.`
      }
    },
    delivery: {
      contentChecklist: 'Complete list of all materials, modules, and resources to create',
      timeline: 'Detailed schedule showing when each piece of content will be delivered',
      platform: 'Technical setup and hosting platform for content delivery'
    },
    communication: {
      cadence: '',
      keyMessages: '',
      methods: '',
      engagementIdeas: ''
    },
    feedback: {
      methods: 'How you will collect feedback throughout the customer journey',
      timing: 'When to ask for feedback for maximum response and value',
      implementation: 'How you will use feedback to improve the customer experience'
    }
  });

  // Load data from localStorage on component mount and merge with enhanced templates
  useEffect(() => {
    const savedData = localStorage.getItem(`customerExperience_${userId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Merge saved data with enhanced email templates
        setCustomerExperienceData(prev => ({
          ...parsedData,
          emailSequence: {
            ...prev.emailSequence, // Use the enhanced templates as defaults
            ...parsedData.emailSequence // Preserve any user customizations
          }
        }));
      } catch (error) {
        console.error('Error loading customer experience data:', error);
      }
    }
  }, [userId]);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(`customerExperience_${userId}`, JSON.stringify(customerExperienceData));
  }, [customerExperienceData, userId]);

  // Initialize todos from localStorage or create defaults
  useEffect(() => {
    const savedTodos = localStorage.getItem(`customerExperienceTodos_${userId}`);
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        setTodos(parsedTodos);
      } catch (error) {
        console.error('Error loading todos:', error);
      }
    } else {
      // Create default todos
      const defaultTodos: TodoItem[] = [
        { id: nanoid(), text: 'Set up immediate access delivery system (login credentials, welcome email)', category: 'technical', completed: false },
        { id: nanoid(), text: 'Test all download links and file accessibility across devices', category: 'technical', completed: false },
        { id: nanoid(), text: 'Configure automated email sequence delivery and scheduling', category: 'technical', completed: false },
        { id: nanoid(), text: 'Record welcome video explaining program navigation and first steps', category: 'content', completed: false },
        { id: nanoid(), text: 'Create downloadable quick-start guide or program roadmap PDF', category: 'content', completed: false },
        { id: nanoid(), text: 'Establish support email system with clear response time expectations', category: 'support', completed: false },
        { id: nanoid(), text: 'Create FAQ document addressing common technical and program questions', category: 'support', completed: false },
        { id: nanoid(), text: 'Schedule first welcome call or live orientation session', category: 'support', completed: false },
        { id: nanoid(), text: 'Test complete customer journey from purchase to first week experience', category: 'quality', completed: false },
        { id: nanoid(), text: 'Have someone else go through onboarding process to identify gaps', category: 'quality', completed: false }
      ];
      setTodos(defaultTodos);
      localStorage.setItem(`customerExperienceTodos_${userId}`, JSON.stringify(defaultTodos));
    }
  }, [userId]);

  // Auto-save todos whenever they change
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem(`customerExperienceTodos_${userId}`, JSON.stringify(todos));
    }
  }, [todos, userId]);

  const toggleEmailExpansion = (emailKey: string) => {
    setExpandedEmails(prev => ({
      ...prev,
      [emailKey]: !prev[emailKey]
    }));
  };



  const updateEmailContent = (emailKey: string, field: string, value: string) => {
    setCustomerExperienceData(prev => ({
      ...prev,
      emailSequence: {
        ...prev.emailSequence,
        [emailKey]: {
          ...prev.emailSequence[emailKey as keyof typeof prev.emailSequence],
          [field]: value
        }
      }
    }));
  };

  const updateSectionContent = (section: string, field: string, value: string) => {
    setCustomerExperienceData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Design Your Customer Experience
          </h1>
        </div>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Design clear next steps and communication that gives customers immediate access and confidence in their purchase
        </p>
      </div>

      <Tabs defaultValue="onboarding" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Delivery
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Your Customer Onboarding
              </CardTitle>
              <p className="text-sm text-slate-600">Deliver immediate access and guide customers through their first steps</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Best Practices Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-900">Best Practices</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                      <p className="text-slate-700 leading-relaxed">
                        <span className="font-semibold text-blue-800">Keep it simple and clear.</span> Your onboarding should guide customers without overwhelming them. The goal is to get them actively using your product immediately while building their confidence in their purchase decision.
                      </p>
                    </div>
                    <div className="bg-blue-100/50 p-4 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm text-blue-800 font-medium italic">
                        Remember: The purpose of onboarding is to clearly communicate next steps and make customers feel they've made the best decision investing in your offer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Design Your Onboarding Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Design Your Onboarding</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Make a list of everything somebody needs to know in order to successfully use your offer after purchasing:
                      </label>
                      <div className="text-xs text-slate-500 italic mb-2">
                        Think about access details, first steps, support info, and program overview
                      </div>
                      <textarea
                        value={customerExperienceData.onboardingKnowledge || ''}
                        onChange={(e) => setCustomerExperienceData(prev => ({
                          ...prev,
                          onboardingKnowledge: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                        placeholder="Start typing here..."
                        spellCheck={true}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Make a list of everywhere you think somebody might get stuck or confused:
                      </label>
                      <div className="text-xs text-slate-500 italic mb-2">
                        Consider login issues, navigation confusion, technical problems, and content overwhelm
                      </div>
                      <textarea
                        value={customerExperienceData.potentialIssues || ''}
                        onChange={(e) => setCustomerExperienceData(prev => ({
                          ...prev,
                          potentialIssues: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                        placeholder="Start typing here..."
                        spellCheck={true}
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Implementation Checklist */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-green-900">Implementation Checklist</h3>
                    </div>
                    <Button
                      onClick={() => setIsAddingTodo(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add To-Do
                    </Button>
                  </div>

                  {/* Add New Todo Form */}
                  {isAddingTodo && (
                    <div className="bg-white p-4 rounded-lg border border-green-200 mb-6">
                      <div className="space-y-3">
                        <Input
                          placeholder="Enter your to-do item..."
                          value={newTodoText}
                          onChange={(e) => setNewTodoText(e.target.value)}
                          className="w-full"
                          spellCheck={true}
                        />
                        <div className="flex items-center gap-3">
                          <Select value={newTodoCategory} onValueChange={(value: 'technical' | 'content' | 'support' | 'quality') => setNewTodoCategory(value)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Choose category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technical">Technical Setup</SelectItem>
                              <SelectItem value="content">Content Preparation</SelectItem>
                              <SelectItem value="support">Support Systems</SelectItem>
                              <SelectItem value="quality">Quality Assurance</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={addTodo} size="sm" className="bg-green-600 hover:bg-green-700">
                            Add
                          </Button>
                          <Button onClick={() => {
                            setIsAddingTodo(false);
                            setNewTodoText('');
                          }} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render todos by category */}
                  {todoCategories.map(category => {
                    const categoryTodos = todos.filter(todo => todo.category === category.key);
                    if (categoryTodos.length === 0) return null;

                    const IconComponent = category.icon;
                    const colorClasses: Record<string, string> = {
                      blue: 'bg-blue-100 text-blue-600',
                      orange: 'bg-orange-100 text-orange-600',
                      purple: 'bg-purple-100 text-purple-600',
                      red: 'bg-red-100 text-red-600'
                    };

                    return (
                      <div key={category.key} className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${colorClasses[category.color] || 'bg-gray-100 text-gray-600'}`}>
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <h4 className="font-semibold text-slate-800 text-sm">{category.name}</h4>
                        </div>
                        
                        {categoryTodos.map(todo => (
                          <div 
                            key={todo.id} 
                            className={`p-3 rounded-lg border transition-all duration-300 ${
                              todo.completed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                checked={todo.completed || false}
                                onCheckedChange={() => toggleTodo(todo.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <label 
                                  className={`block text-sm cursor-pointer transition-all duration-300 ${
                                    todo.completed 
                                      ? 'line-through text-green-700' 
                                      : 'text-slate-700'
                                  }`}
                                  onClick={() => toggleTodo(todo.id)}
                                >
                                  {todo.text}
                                </label>
                              </div>
                              <Button
                                onClick={() => deleteTodo(todo.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {todos.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No to-do items yet. Click "Add To-Do" to get started!</p>
                    </div>
                  )}

                  {/* Email Sequence Templates */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h4 className="text-xl font-bold text-indigo-900">Customize Your Welcome Email Sequence</h4>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400 mb-6">
                      <p className="text-sm text-amber-800 font-medium">
                        💡 <strong>These are professional email templates to help you get started.</strong> Make sure to customize all the placeholders (like [PROGRAM NAME], [FIRST NAME], etc.) with your specific program details and personal voice.
                      </p>
                    </div>
                    
                    {Object.entries(customerExperienceData.emailSequence).map(([emailKey, emailData]) => (
                      <div key={emailKey} className="border border-gray-200 rounded-lg">
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleEmailExpansion(emailKey)}
                        >
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <div>
                              <h5 className="font-medium text-slate-700">
                                {emailKey === 'day0' ? 'Welcome Email (Day 0)' :
                                 emailKey === 'day1' ? 'Day 1 Follow-up' :
                                 emailKey === 'day3' ? 'Day 3 Check-in' :
                                 'Week 1 Celebration'}
                              </h5>
                              <p className="text-sm text-slate-500">{emailData.subject}</p>
                            </div>
                          </div>
                          {expandedEmails[emailKey] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                        
                        {expandedEmails[emailKey] && (
                          <div className="p-4 border-t border-gray-200 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
                              <input
                                type="text"
                                value={emailData.subject}
                                onChange={(e) => updateEmailContent(emailKey, 'subject', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                spellCheck={true}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Preview Text</label>
                              <input
                                type="text"
                                value={emailData.preview}
                                onChange={(e) => updateEmailContent(emailKey, 'preview', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                spellCheck={true}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Email Content</label>
                              <textarea
                                value={emailData.copy}
                                onChange={(e) => updateEmailContent(emailKey, 'copy', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                                spellCheck={true}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          {/* Content Creation Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Content Creation Tracker
              </CardTitle>
              <p className="text-sm text-slate-600">Track all content that needs to be created in order to launch your offer. Assign deadlines as needed</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <p className="text-sm text-green-800 font-medium">
                  📝 <strong>Suggested content includes:</strong> Training modules, worksheets, templates, bonus materials and resources. Make sure to reference your offer outline and the promise you're making with your offer to make sure you account for all needed content.
                </p>
              </div>

              {/* Content Items List */}
              <div className="space-y-3">
                {contentItems.map((item) => (
                  <div key={item.id} className={`border rounded-lg p-4 ${item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => toggleContentCompletion(item.id)}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            item.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {item.title}
                            </h4>
                            <button
                              onClick={() => toggleContentExpansion(item.id)}
                              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 px-2 py-1 rounded-md hover:bg-orange-50 transition-colors"
                            >
                              <span className="text-xs font-medium">
                                {expandedContent[item.id] ? 'Hide Details' : 'Add Details'}
                              </span>
                              {expandedContent[item.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Deadline:</label>
                            <input
                              type="date"
                              value={item.deadline}
                              onChange={(e) => updateContentDeadline(item.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          
                          {/* Expandable Details Section */}
                          {expandedContent[item.id] && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <label className="block text-xs font-medium text-gray-700 mb-2">Detailed Content Plan & Notes</label>
                              <textarea
                                value={item.details || ''}
                                onChange={(e) => updateContentDetails(item.id, e.target.value)}
                                placeholder="Map out your content in detail: outline topics, key points, structure, resources needed, production notes, etc."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm min-h-[100px]"
                                spellCheck={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteContent(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {contentItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No content items yet. Click "Add Content Item" to get started!</p>
                  </div>
                )}
              </div>

              {/* Add Content Form */}
              {isAddingContent ? (
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content Title</label>
                      <input
                        type="text"
                        value={newContentTitle}
                        onChange={(e) => setNewContentTitle(e.target.value)}
                        placeholder="e.g., Welcome Video, Module 1 Training"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        spellCheck={true}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newContentDescription}
                        onChange={(e) => setNewContentDescription(e.target.value)}
                        placeholder="Brief description of what needs to be created"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                        spellCheck={true}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label>
                      <input
                        type="date"
                        value={newContentDeadline}
                        onChange={(e) => setNewContentDeadline(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addContent} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Content
                      </Button>
                      <Button 
                        onClick={() => setIsAddingContent(false)} 
                        variant="outline" 
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddingContent(true)}
                  variant="outline"
                  className="w-full border-dashed border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content Item
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Regular Communication Plan
              </CardTitle>
              <p className="text-sm text-slate-600">Plan your ongoing communication with buyers after they purchase</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Communication Cadence</label>
                  <p className="text-xs text-slate-600 mb-2 italic">How often will you communicate with your buyers? Weekly emails, monthly check-ins, quarterly updates? Be specific about timing and frequency.</p>
                  <textarea
                    value={customerExperienceData.communication.cadence}
                    onChange={(e) => updateSectionContent('communication', 'cadence', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                    placeholder=""
                    spellCheck={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Important Information to Share</label>
                  <p className="text-xs text-slate-600 mb-2 italic">How will you guide customers through your product to ensure they get the promised results? What key information do they need to stay on track, implement successfully, and achieve their transformation?</p>
                  <textarea
                    value={customerExperienceData.communication.keyMessages}
                    onChange={(e) => updateSectionContent('communication', 'keyMessages', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                    placeholder=""
                    spellCheck={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Communication Methods</label>
                  <p className="text-xs text-slate-600 mb-2 italic">How will you deliver these communications? Email newsletters, private Facebook group posts, video updates, live Q&A sessions, etc.</p>
                  <textarea
                    value={customerExperienceData.communication.methods}
                    onChange={(e) => updateSectionContent('communication', 'methods', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[120px]"
                    placeholder=""
                    spellCheck={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Engagement & Implementation Ideas</label>
                  <p className="text-xs text-slate-600 mb-2 italic">Brainstorm 2-3 ideas you can implement to increase engagement and help customers see results. Think about where people typically drop off and get stuck - what creative solutions can you implement to combat that?</p>
                  <textarea
                    value={customerExperienceData.communication.engagementIdeas}
                    onChange={(e) => updateSectionContent('communication', 'engagementIdeas', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[140px]"
                    placeholder=""
                    spellCheck={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Feedback & Improvement
              </CardTitle>
              <p className="text-sm text-slate-600">Continuously improve your customer experience</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Feedback Collection Methods</label>
                  <p className="text-xs text-slate-600 mb-2 italic">How will you collect feedback? Surveys, interviews, community polls, etc.</p>
                  <textarea
                    value={customerExperienceData.feedback.methods}
                    onChange={(e) => updateSectionContent('feedback', 'methods', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                    placeholder=""
                    spellCheck={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Feedback Timing</label>
                  <p className="text-xs text-slate-600 mb-2 italic">When will you ask for feedback to get maximum response and value?</p>
                  <textarea
                    value={customerExperienceData.feedback.timing}
                    onChange={(e) => updateSectionContent('feedback', 'timing', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                    placeholder=""
                    spellCheck={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Implementation Strategy</label>
                  <p className="text-xs text-slate-600 mb-2 italic">How will you use the feedback to improve the customer experience?</p>
                  <textarea
                    value={customerExperienceData.feedback.implementation}
                    onChange={(e) => updateSectionContent('feedback', 'implementation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                    placeholder=""
                    spellCheck={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Auto-save indicator */}
      <div className="text-center py-4">
        <p className="text-sm text-slate-500">
          Your changes are automatically saved as you type
        </p>
      </div>
    </div>
  );
}
