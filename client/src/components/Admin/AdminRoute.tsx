import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Shield, User } from "lucide-react";
import { Link } from "wouter";

interface AdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export function AdminRoute({ children, requireSuperAdmin = false }: AdminRouteProps) {
  const { isLoading, isAuthenticated, isAdmin, isSuperAdmin, user } = useAdminAuth();
  const { language, isRTL } = useLanguage();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className={`flex mb-4 gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <User className="h-8 w-8 text-amber-500" />
              <h1 className="text-2xl font-bold text-foreground">Authentication Required</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground mb-6">
              You need to be logged in to access the admin area.
            </p>

            <Button 
              onClick={() => {
                sessionStorage.setItem('returnTo', window.location.pathname);
                window.location.href = '/api/login';
              }}
              className="w-full"
              data-testid="button-login"
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className={`flex mb-4 gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground mb-4">
              You don't have permission to access the admin area.
            </p>
            
            <p className="text-sm text-muted-foreground mb-6">
              Logged in as: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.role || 'USER'})
            </p>

            <Link href="/" data-testid="link-home">
              <Button className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Super admin required but user is only admin
  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className={`flex mb-4 gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Shield className="h-8 w-8 text-amber-500" />
              <h1 className="text-2xl font-bold text-foreground">Super Admin Required</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground mb-4">
              This area requires super administrator privileges.
            </p>
            
            <p className="text-sm text-muted-foreground mb-6">
              Your role: <strong>{user?.role || 'USER'}</strong>
            </p>

            <Link href="/admin" data-testid="link-admin-dashboard">
              <Button className="w-full">
                Back to Admin Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}