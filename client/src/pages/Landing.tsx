import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { FlightSearchForm } from "@/components/FlightSearch/FlightSearchForm";
import { CompensationCalculator } from "@/components/Claim/CompensationCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check, Shield, Plane } from "lucide-react";
import { FlightSearchResult } from "@/types/flight";

export default function Landing() {
  const { language, isRTL } = useLanguage();
  const [searchResult, setSearchResult] = useState<FlightSearchResult | null>(null);

  const handleFlightSearch = (result: FlightSearchResult) => {
    setSearchResult(result);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                {t('hero.title', language)}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t('hero.subtitle', language)}
              </p>
              
              {/* Trust Indicators */}
              <div className={`flex items-center space-x-6 mb-8 ${isRTL ? 'space-x-reverse justify-end' : ''}`}>
                <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="text-white w-3 h-3" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t('hero.trustIndicators.successfulClaims', language)}
                  </span>
                </div>
                <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="text-white w-3 h-3" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t('hero.trustIndicators.successRate', language)}
                  </span>
                </div>
              </div>
              
              <Button 
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
                onClick={() => document.getElementById('flight-search')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-check-flight-hero"
              >
                {t('hero.cta.checkFlight', language)}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </div>
            
            {/* Quick Calculator Card */}
            <Card className="shadow-xl" id="flight-search">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-card-foreground mb-6">
                  Quick Compensation Check
                </h2>
                <FlightSearchForm onResult={handleFlightSearch} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Compensation Results */}
      {searchResult && (
        <CompensationCalculator 
          flightData={searchResult.flight}
          compensationData={searchResult.compensation}
        />
      )}

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('header.nav.howItWorks', language)}
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple steps to get your compensation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: <Plane className="w-8 h-8" />,
                title: "Check Your Flight",
                description: "Enter your flight details to see if you're eligible for compensation"
              },
              {
                step: "2", 
                icon: <Check className="w-8 h-8" />,
                title: "Submit Your Claim",
                description: "Provide your details and upload necessary documents"
              },
              {
                step: "3",
                icon: <Shield className="w-8 h-8" />,
                title: "Get Paid",
                description: "We handle the airline and get your compensation"
              }
            ].map((item, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {item.icon}
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">{item.step}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
