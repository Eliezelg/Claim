import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Redirect } from "wouter";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ClaimFlow from "@/pages/ClaimFlow";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminClaims from "./pages/Admin/AdminClaims";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminReports from "./pages/Admin/AdminReports";

function RootComponent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  // Si l'utilisateur est admin, rediriger vers le dashboard admin
  if (isAdmin) {
    return <Redirect to="/admin" />;
  }

  // Sinon, afficher le dashboard utilisateur normal
  return <Home />;
}

function Router() {

  return (
    <Switch>
      <Route path="/" component={RootComponent} />
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
