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
  Calendar,
  Shield,
  Send,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import { useAuth } from "@/hooks/useAuth";
import IssueReportDialog from "./IssueReportDialog";

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

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
    <aside className="w-48 sm:w-56 lg:w-64 bg-white shadow-lg border-r border-slate-200 h-screen sticky top-0 flex-shrink-0">
      <div className="p-6 h-full flex flex-col">
        <nav className="flex flex-col space-y-2 flex-1">
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
                    // For items with subItems, make the main button toggle the dropdown
                    <Button
                      variant={isActive || isSubItemActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive || isSubItemActive
                          ? "bg-primary text-white" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                      size="sm"
                      onClick={() => toggleExpanded(item.name)}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span>{item.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 ml-auto" />
                      ) : (
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      )}
                    </Button>
                  ) : (
                    // For items without subItems, keep the Link wrapper
                    <Link href={item.href} className="flex-1">
                      <Button
                        variant={isActive || isSubItemActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive || isSubItemActive
                            ? "bg-primary text-white" 
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                        size="sm"
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  )}
                </div>
                
                {/* Sub-items */}
                {hasSubItems && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 transition-all duration-200">
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = location === subItem.href;
                      
                      return (
                        <Link key={subItem.name} href={subItem.href}>
                          <Button
                            variant={isSubActive ? "default" : "ghost"}
                            className={cn(
                              "w-full justify-start text-sm",
                              isSubActive
                                ? "bg-primary text-white" 
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            )}
                            size="sm"
                          >
                            <SubIcon className="w-3 h-3 mr-2" />
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
          
          <div className="mt-auto pt-4 border-t border-slate-200 space-y-2">
            {/* Admin Dashboard Link - Only visible to admins */}
            {user?.isAdmin && (
              <Link href="/admin">
                <Button
                  variant={location === "/admin" ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    location === "/admin"
                      ? "bg-embodied-coral text-white hover:bg-embodied-coral/90" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  size="sm"
                  data-testid="link-admin-dashboard"
                >
                  <Shield className="w-4 h-4 mr-3" />
                  <span>Admin Dashboard</span>
                </Button>
              </Link>
            )}

            {/* Issue Report Button */}
            {user && (
              <IssueReportDialog 
                userId={user.id || 0} 
                userEmail={user.email}
                userName={user.firstName + " " + user.lastName}
                trigger={
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-600 hover:bg-slate-100"
                    size="sm"
                    data-testid="button-report-issue"
                  >
                    <AlertCircle className="w-4 h-4 mr-3" />
                    Report Issue
                  </Button>
                }
              />
            )}
          </div>
        </nav>

      </div>
    </aside>
  );
}
