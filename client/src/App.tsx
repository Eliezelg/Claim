import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
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
import AdminClaimDetail from "./pages/Admin/AdminClaimDetail";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminReports from "./pages/Admin/AdminReports";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import HowItWorks from "./pages/HowItWorks";
import YourRights from "./pages/YourRights";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import { useEffect } from "react";

function RootComponent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin, isSuperAdmin, userRole, isLoading: adminLoading } = useAdminAuth();

  // Debug logging
  console.log('RootComponent Debug:', {
    isAuthenticated,
    isLoading,
    adminLoading,
    user: user ? { id: user.id, email: user.email, role: user.role } : null,
    isAdmin,
    isSuperAdmin,
    userRole
  });

  // Attendre que l'authentification soit complètement chargée
  if (isLoading || adminLoading) {
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
    console.log('Redirecting to admin dashboard');
    return <Redirect to="/admin" />;
  }

  // Sinon, afficher le dashboard utilisateur normal
  console.log('Redirecting to user dashboard');
  return <Home />;
}

function LanguageRouter() {
  const { language, setLanguage } = useLanguage();
  const [location, setLocation] = useLocation();

  // Extract language from URL and set it
  useEffect(() => {
    const pathSegments = location.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    
    if (['en', 'he', 'fr', 'es'].includes(firstSegment)) {
      if (firstSegment !== language) {
        setLanguage(firstSegment as any);
      }
    } else {
      // If no language in URL, redirect to current language
      if (language !== 'en') {
        setLocation(`/${language}${location}`);
      }
    }
  }, [location, language, setLanguage, setLocation]);

  // Get the path without language prefix
  const getPathWithoutLanguage = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    if (['en', 'he', 'fr', 'es'].includes(segments[0])) {
      return '/' + segments.slice(1).join('/');
    }
    return path;
  };

  const currentPath = getPathWithoutLanguage(location);

  return (
    <Switch>
      <Route path="/" component={RootComponent} />
      <Route path="/:lang(en|he|fr|es)" component={RootComponent} />
      <Route path="/login" component={Login} />
      <Route path="/:lang(en|he|fr|es)/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/:lang(en|he|fr|es)/register" component={Register} />
      <Route path="/claim" component={ClaimFlow} />
      <Route path="/:lang(en|he|fr|es)/claim" component={ClaimFlow} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/:lang(en|he|fr|es)/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/:lang(en|he|fr|es)/admin" component={AdminDashboard} />
      <Route path="/admin/claims" component={AdminClaims} />
      <Route path="/:lang(en|he|fr|es)/admin/claims" component={AdminClaims} />
      <Route path="/admin/claims/:id" component={AdminClaimDetail} />
      <Route path="/:lang(en|he|fr|es)/admin/claims/:id" component={AdminClaimDetail} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/:lang(en|he|fr|es)/admin/users" component={AdminUsers} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/:lang(en|he|fr|es)/admin/reports" component={AdminReports} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/:lang(en|he|fr|es)/how-it-works" component={HowItWorks} />
      <Route path="/your-rights" component={YourRights} />
      <Route path="/:lang(en|he|fr|es)/your-rights" component={YourRights} />
      <Route path="/faq" component={FAQ} />
      <Route path="/:lang(en|he|fr|es)/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/:lang(en|he|fr|es)/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return <LanguageRouter />;
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
