import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Play, X, CheckCircle, ArrowRight, Rocket, BookOpen, Users, Target, ListChecks, UserCheck, HelpCircle, ChevronDown, ChevronRight, Check } from "lucide-react";
import VimeoEmbed from "@/components/VimeoEmbed";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(true);
  const [watchedVideo, setWatchedVideo] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if user has watched the welcome video
    const hasWatched = localStorage.getItem('welcome-video-watched');
    if (hasWatched) {
      setShowWelcomeVideo(false);
      setWatchedVideo(true);
    }

    // Load checked onboarding steps
    const savedSteps = localStorage.getItem('onboarding-checklist');
    if (savedSteps) {
      setCheckedSteps(new Set(JSON.parse(savedSteps)));
    }
  }, []);

  const handleVideoWatched = () => {
    localStorage.setItem('welcome-video-watched', 'true');
    setWatchedVideo(true);
    setShowWelcomeVideo(false);
  };

  const handleVideoToggle = () => {
    setShowWelcomeVideo(!showWelcomeVideo);
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const toggleStep = (stepId: string) => {
    const newCheckedSteps = new Set(checkedSteps);
    if (newCheckedSteps.has(stepId)) {
      newCheckedSteps.delete(stepId);
    } else {
      newCheckedSteps.add(stepId);
    }
    setCheckedSteps(newCheckedSteps);
    localStorage.setItem('onboarding-checklist', JSON.stringify(Array.from(newCheckedSteps)));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="editorial-header text-4xl text-embodied-navy">Welcome to IGNITE!</h1>
        <p className="editorial-body text-lg text-embodied-navy max-w-3xl mx-auto">
          Your complete step-by-step system to create, build, launch and optimize your entire marketing eco-system!
        </p>
      </div>

      {/* Welcome Video Section */}
      {showWelcomeVideo && (
        <Card className="bg-gradient-to-r from-embodied-cream to-white border-embodied-coral">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="editorial-header flex items-center text-embodied-navy">
                <Video className="w-5 h-5 mr-2 text-embodied-coral" />
                Start Here: Your IGNITE Orientation
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowWelcomeVideo(false)}
                className="text-embodied-navy hover:text-embodied-coral"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              {/* Welcome Video */}
              <div className="max-w-2xl mx-auto">
                <VimeoEmbed 
                  vimeoId="1123902105/e223b2adb0" 
                  title="Welcome to IGNITE!"
                  userId={user?.id || 0}
                  stepNumber={0}
                />
              </div>

              <div className="flex space-x-3 justify-center">
                <Button onClick={handleVideoWatched} className="bg-embodied-blue hover:bg-embodied-navy">
                  <Play className="w-4 h-4 mr-2" />
                  Mark as Watched
                </Button>
                <Button variant="outline" onClick={() => setShowWelcomeVideo(false)} className="border-embodied-coral text-embodied-coral hover:bg-embodied-coral hover:text-white">
                  Skip for Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact welcome for returning users */}
      {!showWelcomeVideo && (
        <Card className="border-embodied-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-embodied-coral" />
                <div>
                  <h3 className="editorial-subheader text-embodied-navy">Welcome Video Completed</h3>
                  <p className="editorial-body text-sm">You're all set to continue your IGNITE journey!</p>
                </div>
              </div>
              {watchedVideo && (
                <Button variant="outline" onClick={handleVideoToggle} size="sm" className="border-embodied-blue text-embodied-blue hover:bg-embodied-blue hover:text-white">
                  <Video className="w-4 h-4 mr-2" />
                  Rewatch Video
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Steps */}
      <Card className="border-embodied-blue/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <ListChecks className="w-5 h-5 mr-2 text-embodied-blue" />
            Onboarding Steps
          </CardTitle>
          <p className="text-sm text-embodied-navy/60 italic mt-1">
            Complete all 8 onboarding steps to get started
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "watch-video",
                title: "Watch the Welcome Video Above!",
                description: "Hear from Emily on exactly how to get started in our IGNITE platform!",
                color: "blue"
              },
              {
                id: "complete-profile",
                title: "Complete Your Profile",
                description: "Set up your profile photo and name",
                color: "coral"
              },
              {
                id: "book-onboarding-call",
                title: "Book Your Onboarding Call",
                description: "Schedule your onboarding session with our team where we'll walk you through the platform and make sure you're fully set up for success!",
                color: "orange"
              },
              {
                id: "join-forum",
                title: "Visit Community Forum",
                description: "Introduce yourself and say hello in the new member welcome thread!",
                color: "navy"
              },
              {
                id: "support-calendar",
                title: "Sync Our Support Call Calendar To Yours",
                description: "Add our support call calendar to your Google Calendar for ease",
                color: "coral"
              },
              {
                id: "intake-form",
                title: "Fill Out Your Intake Form",
                description: "Fill out this intake form before your strategy call so we have all the information needed to build out your custom strategy!",
                color: "blue"
              },
              {
                id: "messaging-strategy",
                title: "Complete Your Messaging Strategy",
                description: "Complete your messaging strategy prior to your strategy call. This is the ONLY part of the platform you must have completed before your call.",
                color: "orange"
              },
              {
                id: "book-strategy-call",
                title: "Book Your Strategy Call",
                description: "Your messaging strategy and intake form MUST be completed before booking.",
                color: "navy"
              }
            ].map((step, index) => {
              const isChecked = checkedSteps.has(step.id);
              const colorClasses = {
                blue: "bg-embodied-blue/5 border-embodied-blue/20",
                coral: "bg-embodied-coral/5 border-embodied-coral/20",
                orange: "bg-embodied-orange/5 border-embodied-orange/20",
                navy: "bg-embodied-navy/5 border-embodied-navy/20"
              };


              return (
                <div
                  key={step.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${colorClasses[step.color as keyof typeof colorClasses]} ${
                    isChecked ? 'opacity-75' : ''
                  } transition-all duration-200`}
                >
                  <Checkbox
                    id={step.id}
                    checked={isChecked}
                    onCheckedChange={() => toggleStep(step.id)}
                    className="mt-1"
                    data-testid={`checkbox-${step.id}`}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={step.id}
                      className={`editorial-subheader text-embodied-navy ${
                        isChecked ? 'line-through text-embodied-navy/60' : ''
                      }`}
                    >
                      {index + 1}. {step.title}
                    </label>
                    <p className={`editorial-body text-sm mt-1 ${
                      isChecked ? 'text-embodied-navy/50' : 'text-embodied-navy/70'
                    }`}>
                      {step.description}
                    </p>
                    {step.id === 'complete-profile' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation('/profile');
                        }}
                        className="mt-3 bg-embodied-coral hover:bg-embodied-coral/90 text-white"
                        size="sm"
                        data-testid="button-complete-profile"
                      >
                        Complete Your Profile
                      </Button>
                    )}
                    {step.id === 'book-onboarding-call' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('https://calendly.com/embodiedmarketing/ignite-onboarding-call', '_blank');
                        }}
                        className="mt-3 bg-embodied-orange hover:bg-embodied-orange/90 text-white"
                        size="sm"
                        data-testid="button-book-call"
                      >
                        Book Your Call Here
                      </Button>
                    )}
                    {step.id === 'join-forum' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation('/support/community-forum');
                        }}
                        className="mt-3 bg-embodied-navy hover:bg-embodied-navy/90 text-white"
                        size="sm"
                        data-testid="button-go-forum"
                      >
                        Go To Forum
                      </Button>
                    )}
                    {step.id === 'support-calendar' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('https://calendar.google.com/calendar/u/0?cid=Y181NWU1NmQ2YmVmZWM5MmY3MTFjOTg5OGIyN2RlMWVkYmVhYWViMzFlOGE0NDY1YWNmODUzM2VkMDI3OWVhY2JmQGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20', '_blank');
                        }}
                        className="mt-3 bg-embodied-coral hover:bg-embodied-coral/90 text-white"
                        size="sm"
                        data-testid="button-add-calendar"
                      >
                        Add Calendar
                      </Button>
                    )}
                    {step.id === 'intake-form' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('https://embodiedmarketing.typeform.com/igniteintake', '_blank');
                        }}
                        className="mt-3 bg-embodied-blue hover:bg-embodied-blue/90 text-white"
                        size="sm"
                        data-testid="button-submit-intake"
                      >
                        Submit Intake
                      </Button>
                    )}
                    {step.id === 'messaging-strategy' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation('/messaging');
                        }}
                        className="mt-3 bg-embodied-orange hover:bg-embodied-orange/90 text-white"
                        size="sm"
                        data-testid="button-complete-strategy"
                      >
                        Complete Strategy
                      </Button>
                    )}
                    {step.id === 'book-strategy-call' && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('https://calendly.com/1lisaolivio/ignite-strategy-call', '_blank');
                        }}
                        className="mt-3 bg-embodied-navy hover:bg-embodied-navy/90 text-white"
                        size="sm"
                        data-testid="button-book-strategy-call"
                      >
                        Book Here
                      </Button>
                    )}
                  </div>
                  {isChecked && (
                    <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Steps Overview */}
      <Card className="border-embodied-coral/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <Rocket className="w-5 h-5 mr-2 text-embodied-coral" />
            Your IGNITE Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-blue flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Your Foundation</h3>
                <p className="editorial-body text-sm">Master your messaging and define your irresistible offers so that the rest of your marketing is easy!</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-coral flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Audience Growth</h3>
                <p className="editorial-body text-sm">Launch your visibility ad and start growing your audience quickly with quality leads!</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-orange flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Lead Generation</h3>
                <p className="editorial-body text-sm">Launch your lead gen funnel, start growing your email list and offsetting your ad cost with your tripwire product</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-embodied-navy flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">4</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Live Launch</h3>
                <p className="editorial-body text-sm">Time to launch your core offer! Capitalize on all the leads you've brought in and host your live launch experience.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="text-center space-y-4 p-4 rounded-lg bg-embodied-cream/50">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold">5</span>
              </div>
              <div>
                <h3 className="editorial-subheader text-embodied-navy">Ongoing Optimization</h3>
                <p className="editorial-body text-sm">Continue to grow your list, host your next live launch and scale your business!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Meet The Team */}
      <Card className="border-embodied-coral/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <UserCheck className="w-5 h-5 mr-2 text-embodied-coral" />
            Meet The Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center space-y-3 p-6 bg-embodied-coral/5 rounded-lg">
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <VimeoEmbed 
                  vimeoId="1121677190/051ad17016" 
                  title="Lisa - Senior Strategist Introduction"
                  userId={1}
                  stepNumber={20}
                />
              </div>
              <div>
                <h4 className="editorial-subheader text-embodied-navy">Lisa - Senior Strategist</h4>
                <p className="editorial-body text-sm text-embodied-navy/80 mt-2">She'll help develop your initial custom strategy</p>
              </div>
            </div>

            <div className="text-center space-y-3 p-6 bg-embodied-blue/5 rounded-lg">
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <VimeoEmbed 
                  vimeoId="1121677183/6654f58fc7" 
                  title="Rena - Marketing Coach Introduction"
                  userId={1}
                  stepNumber={21}
                />
              </div>
              <div>
                <h4 className="editorial-subheader text-embodied-navy">Rena - Marketing Coach</h4>
                <p className="editorial-body text-sm text-embodied-navy/80 mt-2">Hosts our messaging, strategy and accountability calls every week. She's the main coach in Ignite and is here to support you every step of the way!</p>
              </div>
            </div>

            <div className="text-center space-y-3 p-6 bg-embodied-orange/5 rounded-lg">
              <div className="w-full aspect-video rounded-lg overflow-hidden">
                <VimeoEmbed 
                  vimeoId="1121677204/d084daa23a" 
                  title="Chris - Ads Coach Introduction"
                  userId={1}
                  stepNumber={22}
                />
              </div>
              <div>
                <h4 className="editorial-subheader text-embodied-navy">Chris - Ads Coach</h4>
                <p className="editorial-body text-sm text-embodied-navy/80 mt-2">Our lead ads manager who's here to run our ads support calls and help you with anything ads related from targeting to ad optimization!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ's */}
      <Card className="border-embodied-navy/20">
        <CardHeader>
          <CardTitle className="editorial-header flex items-center text-embodied-navy">
            <HelpCircle className="w-5 h-5 mr-2 text-embodied-navy" />
            FAQ's
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                id: "first-steps",
                question: "What should I do first when I join?",
                answer: "Start by watching the welcome video above then complete the onboarding steps. \n\nOnce your onboarding steps are complete, you'll have your initial strategy call and dive into the first phase: Foundation!"
              },
              {
                id: "program-structure",
                question: "How is the program structured?",
                answer: "IGNITE follows a 5-step journey: Foundation (messaging & offer), Audience Growth, Lead Generation, Live Launch, and Ongoing Optimization. Each step builds on the previous one to create your complete marketing system. \n\nEach phase will have training videos and interactive components where our system completes things for you based on questions you fill out. \n\nLeverage our coaching calls to get live support and feedback on all the components of your marketing, making sure everything you create and launch is to the highest standard and set up for success!"
              },
              {
                id: "order-completion",
                question: "Do I need to go through everything in order?",
                answer: "Yes. This system is intended for you to go through it in order. If there is anything custom or specific to you and your business we will highlight that in your strategy call."
              },
              {
                id: "results-timeline",
                question: "How long will it take to start seeing results?",
                answer: "It depends how quickly you implement. Once your lead gen funnel is live (appx 6 weeks from onboarding) you will start generating leads and once you live launch you'll see sales for your core offer.  For most people this is within 90 days and then we spend the next 90 days optimizing and improving results."
              },
              {
                id: "getting-support",
                question: "How do I get support if I'm stuck?",
                answer: "We have many ways to support you! The best one being all of our live coaching options each week. Jump on any live coaching call you need that week to get 1:1 guidance. You can also leverage the community forum where our coaches are ready to support in between calls. \n\nThroughout this platform there is also programmed AI support so that as you're answering questions and working through the content you can get support in real time."
              },
              {
                id: "work-review",
                question: "Will someone review my work or give feedback?",
                answer: "Yes! Bring any copy from funnel copy to emails to our live support calls, screenshare and get real time feedback. You can also screenshare and get feedback on your ads on any of our ad support calls."
              }
            ].map((faq) => (
              <div key={faq.id} className="border border-embodied-navy/10 rounded-lg">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-embodied-navy/5 transition-colors"
                >
                  <span className="editorial-subheader text-embodied-navy">{faq.question}</span>
                  {expandedFaq === faq.id ? (
                    <ChevronDown className="w-5 h-5 text-embodied-navy" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-embodied-navy" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="editorial-body text-embodied-navy/80">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
