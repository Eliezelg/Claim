import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, ExternalLink, Upload, MessageCircle, Download, Star, Plus } from "lucide-react";
import { Claim } from "@/types/claim";
import { Link } from "wouter";

interface ClaimsListProps {
  claims?: Claim[];
  isLoading: boolean;
}

export function ClaimsList({ claims, isLoading }: ClaimsListProps) {
  const { language, isRTL } = useLanguage();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Completed</Badge>;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'NEGOTIATING':
        return <Badge className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">In Progress</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">{status}</Badge>;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 25;
      case 'UNDER_REVIEW': return 50;
      case 'NEGOTIATING': return 75;
      case 'APPROVED': return 90;
      case 'PAID': return 100;
      case 'REJECTED': return 100;
      default: return 10;
    }
  };

  const getTimelineSteps = (claim: Claim) => {
    const steps = [
      { key: 'submitted', label: 'Claim submitted', completed: !!claim.submittedAt },
      { key: 'review', label: 'Documents verified', completed: claim.status !== 'SUBMITTED' },
      { key: 'negotiating', label: 'Negotiating with airline', completed: ['APPROVED', 'PAID'].includes(claim.status), active: claim.status === 'NEGOTIATING' },
      { key: 'payment', label: 'Payment processing', completed: claim.status === 'PAID' },
    ];
    
    return steps;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground mt-2">{t('common.loading', language)}</p>
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-muted-foreground mb-4">
            <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
    );
  }

  return (
    <div className="space-y-4" data-testid="claims-list">
      {claims.map((claim) => (
        <Card key={claim.id} className="claim-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="font-semibold text-card-foreground" data-testid={`claim-title-${claim.id}`}>
                    {claim.flightNumber} - {claim.departureAirport} to {claim.arrivalAirport}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(claim.flightDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={isRTL ? 'text-left' : 'text-right'}>
                {getStatusBadge(claim.status)}
                {claim.finalCompensationAmount && (
                  <p className="text-lg font-bold text-card-foreground mt-1" data-testid={`claim-amount-${claim.id}`}>
                    €{claim.finalCompensationAmount}
                  </p>
                )}
              </div>
            </div>
            
            {/* Progress Bar for In Progress Claims */}
            {['SUBMITTED', 'UNDER_REVIEW', 'NEGOTIATING', 'APPROVED'].includes(claim.status) && (
              <div className="mb-4">
                <div className={`flex justify-between text-sm text-muted-foreground mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>Claim Progress</span>
                  <span data-testid={`claim-progress-${claim.id}`}>{getProgressPercentage(claim.status)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${getProgressPercentage(claim.status)}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Timeline for Active Claims */}
            {claim.status !== 'PAID' && claim.status !== 'REJECTED' && (
              <div className="space-y-3 mb-6">
                {getTimelineSteps(claim).map((step, index) => (
                  <div key={step.key} className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <div className={`w-3 h-3 rounded-full ${
                      step.completed ? 'bg-green-500' : 
                      step.active ? 'bg-primary animate-pulse' : 
                      'bg-muted'
                    }`}></div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.completed ? 'text-card-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                      {step.active && (
                        <p className="text-xs text-muted-foreground">Current step</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Success Message for Completed Claims */}
            {claim.status === 'PAID' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-sm text-green-800 font-medium">
                    Payment received on {claim.completedAt ? new Date(claim.completedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
            
            <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button className="text-primary hover:text-primary/80 text-sm font-medium" data-testid={`button-view-details-${claim.id}`}>
                View Details
                <ExternalLink className={`w-4 h-4 ${isRTL ? 'mr-1' : 'ml-1'} inline`} />
              </button>
              
              <div className={`flex space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                {claim.status === 'PAID' ? (
                  <>
                    <Button variant="outline" size="sm" data-testid={`button-download-receipt-${claim.id}`}>
                      <Download className="w-4 h-4 mr-1" />
                      Download Receipt
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-rate-experience-${claim.id}`}>
                      <Star className="w-4 h-4 mr-1" />
                      Rate Experience
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" data-testid={`button-upload-documents-${claim.id}`}>
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Documents
                    </Button>
                    <Button size="sm" data-testid={`button-contact-support-${claim.id}`}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Contact Support
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
