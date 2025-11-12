import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingSimple from "@/pages/LandingSimple";
import SubscribeMinimal from "@/pages/SubscribeMinimal";
import NotFoundSimple from "@/pages/NotFoundSimple";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingSimple} />
      <Route path="/subscribe" component={SubscribeMinimal} />
      <Route component={NotFoundSimple} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
