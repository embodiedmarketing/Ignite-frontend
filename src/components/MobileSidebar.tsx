import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  Home, 
  Gift, 
  Users, 
  MessageCircle, 
  Network, 
  TrendingUp, 
  BookOpen,
  Flame,
  Settings,
  Target,
  FileText,
  AlertCircle,
  Building,
  UserPlus,
  Magnet,
  Zap,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Video,
  MessageSquare,
  CheckCircle,
  GraduationCap,
  Menu,
  Calendar,
  Send,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import { useAuth } from "@/hooks/useAuth";
import IssueReportDialog from "./IssueReportDialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  subItems?: { name: string; href: string; icon: any }[];
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Onboarding", href: "/onboarding", icon: Flame },
  { 
    name: "Foundation", 
    href: "/foundation", 
    icon: Building,
    subItems: [
      { name: "Strategic Messaging", href: "/step/1", icon: MessageCircle },
      { name: "Irresistible Offer", href: "/step/2", icon: Gift }
    ]
  },
  { name: "Audience Growth", href: "/audience-growth", icon: UserPlus },
  { 
    name: "Lead Generation", 
    href: "/lead-generation", 
    icon: Magnet,
    subItems: [
      { name: "Build Your Strategy", href: "/lead-generation/building-your-strategy", icon: Target },
      { name: "Launch Your Ads", href: "/lead-generation/launch-your-ads", icon: TrendingUp },
      { name: "Track & Optimize", href: "/lead-generation/track-and-optimize", icon: Settings }
    ]
  },
  { 
    name: "Live Launch", 
    href: "/launch-sales", 
    icon: Zap,
    subItems: [
      { name: "Build Your Strategy", href: "/launch-sales/strategy", icon: Target },
      { name: "Launch Your Ads", href: "/launch-sales/launch-your-ads", icon: TrendingUp },
      { name: "Track & Execute", href: "/launch-sales/track-and-optimize", icon: Settings }
    ]
  },
  { 
    name: "Support Center", 
    href: "/support", 
    icon: HelpCircle,
    subItems: [
      { name: "Community Forum", href: "/support/community-forum", icon: MessageSquare },
      { name: "Live Coaching Calls", href: "/support/live-coaching-calls", icon: Video }
    ]
  },
  { 
    name: "Resources", 
    href: "/resources", 
    icon: FileText,
    subItems: [
      { name: "IGNITE Docs", href: "/resources/completed-ignite-docs", icon: CheckCircle },
      { name: "Bonus Trainings", href: "/resources/bonus-trainings", icon: GraduationCap },
      { name: "Planning Resources", href: "/resources/monthly-planning", icon: Calendar },
      { name: "Monthly Ad Request", href: "/resources/monthly-ad-request", icon: Send },
      { name: "GHL Templates", href: "/resources/ghl-templates", icon: Layout }
    ]
  },
];

export default function MobileSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <div className="h-full flex flex-col p-6">
          <nav className="flex flex-col space-y-2 flex-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isSubItemActive = hasSubItems && item.subItems?.some(subItem => location === subItem.href);
              const isExpanded = expandedItems.has(item.name);
              
              return (
                <div key={item.name}>
                  <div className="flex items-center">
                    {hasSubItems ? (
                      <Button
                        variant={isActive || isSubItemActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start min-h-12 text-base",
                          isActive || isSubItemActive
                            ? "bg-primary text-white" 
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                        onClick={() => toggleExpanded(item.name)}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span>{item.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 ml-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </Button>
                    ) : (
                      <Link href={item.href} className="flex-1" onClick={() => setOpen(false)}>
                        <Button
                          variant={isActive || isSubItemActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start min-h-12 text-base",
                            isActive || isSubItemActive
                              ? "bg-primary text-white" 
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          <span>{item.name}</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  {hasSubItems && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = location === subItem.href;
                        
                        return (
                          <Link key={subItem.name} href={subItem.href} onClick={() => setOpen(false)}>
                            <Button
                              variant={isSubActive ? "default" : "ghost"}
                              className={cn(
                                "w-full justify-start min-h-10 text-sm",
                                isSubActive
                                  ? "bg-primary text-white" 
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                              )}
                            >
                              <SubIcon className="w-4 h-4 mr-2" />
                              <span>{subItem.name}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {user && (
              <div className="pt-4 border-t border-slate-200 mt-4">
                <IssueReportDialog 
                  userId={user.id} 
                  userEmail={user.email}
                  trigger={
                    <Button
                      variant="ghost"
                      className="w-full justify-start min-h-12 text-base text-slate-600 hover:bg-slate-100"
                    >
                      <AlertCircle className="w-5 h-5 mr-3" />
                      Report Issue
                    </Button>
                  }
                />
              </div>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
