import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { ClaimsList } from "@/components/Dashboard/ClaimsList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus, TrendingUp, Clock, CheckCircle, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Claim } from "@/types/claim";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();

  const { data: claims, isLoading, error } = useQuery<Claim[]>({
    queryKey: ["/api/claims"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load claims. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = {
    totalClaims: claims?.length || 0,
    successful: claims?.filter(c => c.status === 'PAID').length || 0,
    inProgress: claims?.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'NEGOTIATING'].includes(c.status)).length || 0,
    totalReceived: claims?.reduce((sum, c) => {
      if (c.status === 'PAID' && c.finalCompensationAmount) {
        return sum + parseFloat(c.finalCompensationAmount.toString());
      }
      return sum;
    }, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('dashboard.title', language)}
              </h1>
              <p className="text-muted-foreground">
                {t('dashboard.subtitle', language)}
              </p>
            </div>
            <Link href="/claim" data-testid="button-new-claim">
              <Button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                <Plus className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('dashboard.newClaim', language)}
              </Button>
            </Link>
          </div>
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.stats.totalClaims', language)}
                    </p>
                    <p className="text-2xl font-bold text-card-foreground" data-testid="stat-total-claims">
                      {stats.totalClaims}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.stats.successful', language)}
                    </p>
                    <p className="text-2xl font-bold text-green-600" data-testid="stat-successful">
                      {stats.successful}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.stats.inProgress', language)}
                    </p>
                    <p className="text-2xl font-bold text-amber-600" data-testid="stat-in-progress">
                      {stats.inProgress}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.stats.totalReceived', language)}
                    </p>
                    <p className="text-2xl font-bold text-green-600" data-testid="stat-total-received">
                      €{stats.totalReceived.toFixed(0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Claims List */}
          <ClaimsList claims={claims} isLoading={isLoading} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
