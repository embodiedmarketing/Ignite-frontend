import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "@/services/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePageTracking, useAutoRedirect } from "@/hooks/usePageTracking";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import IssueReportDialog from "@/components/IssueReportDialog";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import SetPassword from "@/pages/SetPassword";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import OfferDevelopment from "@/pages/OfferDevelopment";
import CustomerResearch from "@/pages/CustomerResearch";
import ConversationScripts from "@/pages/ConversationScripts";
import CommunityOutreach from "@/pages/CommunityOutreach";
import ResourceLibrary from "@/pages/ResourceLibrary";
import ContentManager from "@/pages/ContentManager";
import Resources from "@/pages/Resources";
import OfferManagement from "@/pages/OfferManagement";
import BuildYourOffer from "@/pages/BuildYourOffer";
// Removed payment-related imports
import InteractiveStep from "@/components/InteractiveStep";
import NotFound from "@/pages/not-found";
import BonusMaterial from "@/pages/BonusMaterial";
import AudienceGrowth from "@/pages/AudienceGrowth";
import BuildingYourStrategy from "@/pages/BuildingYourStrategy";
import LaunchSellStrategy from "@/pages/LaunchSellStrategy";
import LaunchYourAds from "@/pages/LaunchYourAds";
import LaunchYourAdsLiveLaunch from "@/pages/LaunchYourAdsLiveLaunch";
import TrackAndOptimize from "@/pages/TrackAndOptimize";
import TrackAndOptimizeLiveLaunch from "@/pages/TrackAndOptimizeLiveLaunch";
import Onboarding from "@/pages/Onboarding";
import CommunityForum from "@/pages/CommunityForum";
import CategoryThreads from "@/pages/CategoryThreads";
import ThreadDetail from "@/pages/ThreadDetail";
import WelcomeThread from "@/pages/WelcomeThread";
import LiveCoachingCalls from "@/pages/LiveCoachingCalls";
import CompletedIgniteDocs from "@/pages/CompletedIgniteDocs";
import BonusTrainings from "@/pages/BonusTrainings";
import MonthlyPlanning from "@/pages/MonthlyPlanning";
import MonthlyAdRequest from "@/pages/MonthlyAdRequest";
import GHLTemplates from "@/pages/GHLTemplates";
import BusinessIncubatorMessaging from "@/pages/BusinessIncubatorMessaging";
import BusinessIncubatorCustomerJourney from "@/pages/BusinessIncubatorCustomerJourney";
import MessagingStrategyResults from "@/pages/MessagingStrategyResults";
import Profile from "@/pages/Profile";
import { lazy, Suspense } from "react";
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
import AdminLogin from "@/pages/AdminLogin";
import AdminUserManagement from "@/pages/AdminUserManagement";
import AdminUserDetail from "@/pages/AdminUserDetail";
import AccountDeactivated from "@/pages/AccountDeactivated";

function AppRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  // Track page visits for "continue where you left off"
  usePageTracking();

  // Auto-redirect to last visited page on app load
  useAutoRedirect();

  useEffect(() => {
    if (!isLoading && user && (user as any).isActive === false && location !== "/account-deactivated") {
      setLocation("/account-deactivated");
    }else{
      setLocation("/");
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f7f3ef]">
        <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/set-password" component={SetPassword} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/account-deactivated" component={AccountDeactivated} />

      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/users/:id" component={AdminUserDetail} />
      <Route path="/admin/users" component={AdminUserManagement} />

      {/* Authenticated routes */}
      <Route path="/dashboard">
        {isAuthenticated ? (
          <Layout>
            <Dashboard />
          </Layout>
        ) : isLoading ? (
          <div className="h-screen flex items-center justify-center bg-[#f7f3ef]">
            <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
          </div>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/onboarding">
        {isAuthenticated ? (
          <Layout>
            <Onboarding />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/messaging">
        {isAuthenticated ? (
          <Layout>
            <InteractiveStep
              stepNumber={1}
              userId={user?.id?.toString() || ""}
            />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/create-offer">
        {isAuthenticated ? (
          <Layout>
            <InteractiveStep
              stepNumber={2}
              userId={user?.id?.toString() || ""}
            />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/build-offer">
        {isAuthenticated ? (
          <Layout>
            <BuildYourOffer userId={user?.id?.toString() || ""} />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/sell-offer">
        {isAuthenticated ? (
          <Layout>
            <InteractiveStep
              stepNumber={4}
              userId={user?.id?.toString() || ""}
            />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources">
        {isAuthenticated ? (
          <Layout>
            <Resources />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/bonus">
        {isAuthenticated ? (
          <Layout>
            <BonusMaterial />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/support/community-forum">
        {isAuthenticated ? (
          <Layout>
            <CommunityForum />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/community-forum">
        {isAuthenticated ? (
          <Layout>
            <CommunityForum />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/forum/:slug">
        {isAuthenticated ? (
          <Layout>
            <CategoryThreads />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/forum/thread/:id">
        {isAuthenticated ? (
          <Layout>
            <ThreadDetail />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/forum/welcome">
        {isAuthenticated ? (
          <Layout>
            <WelcomeThread />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/support/live-coaching-calls">
        {isAuthenticated ? (
          <Layout>
            <LiveCoachingCalls />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources/completed-ignite-docs">
        {isAuthenticated ? (
          <Layout>
            <CompletedIgniteDocs />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources/bonus-trainings">
        {isAuthenticated ? (
          <Layout>
            <BonusTrainings />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources/monthly-planning">
        {isAuthenticated ? (
          <Layout>
            <MonthlyPlanning />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources/monthly-ad-request">
        {isAuthenticated ? (
          <Layout>
            <MonthlyAdRequest />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources/ghl-templates">
        {isAuthenticated ? (
          <Layout>
            <GHLTemplates />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources/business-incubator-messaging">
        {isAuthenticated ? (
          <Layout>
            <BusinessIncubatorMessaging />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/resources/business-incubator-customer-journey">
        {isAuthenticated ? (
          <Layout>
            <BusinessIncubatorCustomerJourney />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/audience-growth">
        {isAuthenticated ? (
          <Layout>
            <AudienceGrowth />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/lead-generation/building-your-strategy">
        {isAuthenticated ? (
          <Layout>
            <BuildingYourStrategy />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/lead-generation/launch-your-ads">
        {isAuthenticated ? (
          <Layout>
            <LaunchYourAds />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/lead-generation/track-and-optimize">
        {isAuthenticated ? (
          <Layout>
            <TrackAndOptimize />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/launch-sales/strategy">
        {isAuthenticated ? (
          <Layout>
            <LaunchSellStrategy />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/launch-sales/launch-your-ads">
        {isAuthenticated ? (
          <Layout>
            <LaunchYourAdsLiveLaunch />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/launch-sales/track-and-optimize">
        {isAuthenticated ? (
          <Layout>
            <TrackAndOptimizeLiveLaunch />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/step/1/strategy-results">
        {isAuthenticated ? (
          <Layout>
            <MessagingStrategyResults />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/step/:stepNumber">
        {(params) => {
          const stepNumber = Number(params.stepNumber) || 1;
          return isAuthenticated ? (
            <Layout>
              {stepNumber === 3 ? (
                <BuildYourOffer userId={user?.id?.toString() || ""} />
              ) : (
                <InteractiveStep
                  stepNumber={stepNumber}
                  userId={user?.id?.toString() || ""}
                />
              )}
            </Layout>
          ) : (
            <Login />
          );
        }}
      </Route>

      <Route path="/profile">
        {isAuthenticated ? (
          <Layout>
            <Profile />
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      {/* Root route */}
      <Route path="/">
        {isAuthenticated ? (
          <Layout>
            <Dashboard />
          </Layout>
        ) : isLoading ? (
          <div className="h-screen flex items-center justify-center bg-[#f7f3ef]">
            <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
          </div>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/admin">
        {isAuthenticated ? (
          <Layout>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-[#4593ed] border-t-transparent rounded-full" />
                </div>
              }
            >
              <AdminDashboard />
            </Suspense>
          </Layout>
        ) : (
          <Login />
        )}
      </Route>

      <Route path="/offers">
        {isAuthenticated ? <OfferManagement user={user} /> : <Login />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
        <FloatingIssueButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Component for floating issue button
function FloatingIssueButton() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user || !user.id) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <IssueReportDialog
        userId={user.id}
        userEmail={user.email}
        trigger={
          <Button
            size="sm"
            className="bg-embodied-coral hover:bg-embodied-orange text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
        }
      />
    </div>
  );
}

export default App;
