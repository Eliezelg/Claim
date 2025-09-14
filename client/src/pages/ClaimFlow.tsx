import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { FlightSearchForm } from "@/components/FlightSearch/FlightSearchForm";
import { CompensationCalculator } from "@/components/Claim/CompensationCalculator";
import { ClaimForm } from "@/components/Claim/ClaimForm";
import { DocumentUpload } from "@/components/Documents/DocumentUpload";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlightSearchResult } from "@/types/flight";
import { ClaimFormData } from "@/types/claim";

type ClaimStep = 'search' | 'compensation' | 'form' | 'documents' | 'complete';

export default function ClaimFlow() {
  const { language, isRTL } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<ClaimStep>('search');
  const [flightResult, setFlightResult] = useState<FlightSearchResult | null>(null);
  const [claimData, setClaimData] = useState<Partial<ClaimFormData>>({});

  const handleFlightSearch = (result: FlightSearchResult) => {
    setFlightResult(result);
    setCurrentStep('compensation');
  };

  const handleStartClaim = () => {
    if (!flightResult) return;
    
    // Check if user is authenticated before starting claim
    if (!isAuthenticated) {
      // Save current URL for redirect after login
      sessionStorage.setItem('returnTo', window.location.pathname + window.location.search);
      // Redirect to login
      window.location.href = '/api/login';
      return;
    }
    
    setClaimData({
      flightNumber: flightResult.flight.flightNumber,
      flightDate: new Date(flightResult.flight.date).toISOString().split('T')[0],
      departureAirport: flightResult.flight.departureAirport.iataCode,
      arrivalAirport: flightResult.flight.arrivalAirport.iataCode,
      jurisdiction: flightResult.compensation.recommended?.jurisdiction,
      finalCompensationAmount: flightResult.compensation.recommended?.amount,
    });
    setCurrentStep('form');
  };

  const handleClaimFormSubmit = (data: ClaimFormData) => {
    setClaimData(data);
    setCurrentStep('documents');
  };

  const handleDocumentsComplete = () => {
    setCurrentStep('complete');
  };

  const renderProgressSteps = () => {
    const steps = [
      { key: 'search', label: 'Flight Search', number: 1 },
      { key: 'compensation', label: 'Compensation', number: 2 },
      { key: 'form', label: 'Personal Info', number: 3 },
      { key: 'documents', label: 'Documents', number: 4 },
    ];

    const currentStepIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className={`flex items-center justify-center space-x-4 mb-8 ${isRTL ? 'space-x-reverse' : ''}`}>
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`progress-step w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              index <= currentStepIndex ? 'active' : 'bg-muted text-muted-foreground'
            }`}>
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 bg-border ${index < currentStepIndex ? 'bg-primary' : ''}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep !== 'search' && renderProgressSteps()}

          {currentStep === 'search' && (
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Check Your Flight Compensation
              </h1>
              <p className="text-lg text-muted-foreground">
                Enter your flight details to see if you're eligible for compensation
              </p>
            </div>
          )}

          {currentStep === 'search' && (
            <Card className="shadow-xl max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-card-foreground mb-6">
                  Flight Details
                </h2>
                <FlightSearchForm onResult={handleFlightSearch} />
              </CardContent>
            </Card>
          )}

          {currentStep === 'compensation' && flightResult && (
            <CompensationCalculator 
              flightData={flightResult.flight}
              compensationData={flightResult.compensation}
              onStartClaim={handleStartClaim}
            />
          )}

          {currentStep === 'form' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t('claim.personalInfo.title', language)}
                </h2>
                <p className="text-muted-foreground">
                  {t('claim.personalInfo.subtitle', language)}
                </p>
              </div>
              <ClaimForm 
                initialData={claimData}
                onSubmit={handleClaimFormSubmit}
                onBack={() => setCurrentStep('compensation')}
              />
            </div>
          )}

          {currentStep === 'documents' && claimData && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t('documents.title', language)}
                </h2>
                <p className="text-muted-foreground">
                  {t('documents.subtitle', language)}
                </p>
              </div>
              <DocumentUpload 
                claimData={claimData as ClaimFormData}
                onComplete={handleDocumentsComplete}
                onBack={() => setCurrentStep('form')}
              />
            </div>
          )}

          {currentStep === 'complete' && (
            <Card className="shadow-xl max-w-2xl mx-auto text-center">
              <CardContent className="p-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Claim Submitted Successfully!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your claim has been submitted and we've assigned it a unique reference number. 
                  You'll receive an email confirmation shortly with next steps.
                </p>
                <div className="space-y-4">
                  <a href="/dashboard" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors" data-testid="button-view-dashboard">
                    View My Claims
                  </a>
                  <div className="text-sm text-muted-foreground">
                    Expected processing time: 2-4 weeks
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
