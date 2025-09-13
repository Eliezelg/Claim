import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Claim } from "@/types/claim";

export default function Home() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();

  const { data: claims, isLoading } = useQuery<Claim[]>({
    queryKey: ["/api/claims"],
  });

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
      
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center ${isRTL ? 'rtl' : ''}`}>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome back, {user?.firstName || 'Valued Customer'}!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Track your claims and start new compensation requests
            </p>
            
            <div className={`flex justify-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <Link href="/claim" data-testid="button-new-claim">
                <Button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90">
                  <Plus className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('dashboard.newClaim', language)}
                </Button>
              </Link>
              <Link href="/dashboard" data-testid="button-view-dashboard">
                <Button variant="outline" className="px-8 py-3 rounded-lg font-semibold">
                  {t('dashboard.title', language)}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <TrendingUp className="w-8 h-8 text-primary" />
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
        </div>
      </section>

      {/* Recent Claims */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-2xl font-bold text-foreground">Recent Claims</h2>
            <Link href="/dashboard" data-testid="link-view-all-claims">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-2">{t('common.loading', language)}</p>
            </div>
          ) : claims && claims.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claims.slice(0, 6).map((claim) => (
                <Card key={claim.id} className="claim-card shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <h3 className="font-semibold text-card-foreground">{claim.flightNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        claim.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW' || claim.status === 'NEGOTIATING' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {new Date(claim.flightDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {claim.departureAirport} → {claim.arrivalAirport}
                    </p>
                    {claim.finalCompensationAmount && (
                      <p className="text-lg font-bold text-primary">
                        €{claim.finalCompensationAmount}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground mb-4">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No claims yet</p>
                  <p className="text-sm">Start your first claim to get compensation for delayed flights</p>
                </div>
                <Link href="/claim" data-testid="button-start-first-claim">
                  <Button className="mt-4">
                    <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    Start Your First Claim
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
