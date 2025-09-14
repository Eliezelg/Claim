import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ClaimFlow from "@/pages/ClaimFlow";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminClaims from "./pages/Admin/AdminClaims";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminReports from "./pages/Admin/AdminReports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show either landing or home based on authentication for root path
  const HomeComponent = isLoading || !isAuthenticated ? Landing : Home;

  return (
    <Switch>
      <Route path="/" component={HomeComponent} />
      <Route path="/claim" component={ClaimFlow} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/claims" component={AdminClaims} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
