import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlightData, CompensationAnalysis } from "@/types/flight";
import { CheckCircle, XCircle, ThumbsUp, Clock } from "lucide-react";

interface CompensationCalculatorProps {
  flightData: FlightData;
  compensationData: CompensationAnalysis;
  onStartClaim?: () => void;
}

export function CompensationCalculator({ 
  flightData, 
  compensationData, 
  onStartClaim 
}: CompensationCalculatorProps) {
  const { language, isRTL } = useLanguage();

  const formatDelayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (eligible: boolean) => {
    return eligible ? (
      <Badge className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
        {t('calculator.eligible', language)}
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
        {t('calculator.notEligible', language)}
      </Badge>
    );
  };

  return (
    <section className="py-16 bg-muted/30" data-testid="compensation-results">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t('calculator.title', language)}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('calculator.subtitle', language)}
          </p>
        </div>
        
        {/* Flight Information Display */}
        <Card className="shadow-sm mb-8">
          <CardContent className="p-6">
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-lg font-semibold text-card-foreground">
                {flightData.flightNumber} - {new Date(flightData.date).toLocaleDateString()}
              </h3>
              <Badge className={`px-3 py-1 rounded-full text-sm font-medium ${
                flightData.status === 'DELAYED' ? 'bg-red-100 text-red-800' :
                flightData.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800'
              }`}>
                {flightData.status === 'DELAYED' && `Delayed ${formatDelayTime(flightData.delayMinutes)}`}
                {flightData.status === 'CANCELLED' && 'Cancelled'}
                {flightData.status === 'ON_TIME' && 'On Time'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">From:</span>
                <span className="block font-medium" data-testid="flight-departure">
                  {flightData.departureAirport.name} ({flightData.departureAirport.iataCode})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">To:</span>
                <span className="block font-medium" data-testid="flight-arrival">
                  {flightData.arrivalAirport.name} ({flightData.arrivalAirport.iataCode})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Distance:</span>
                <span className="block font-medium" data-testid="flight-distance">
                  {flightData.distance} km
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Compensation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EU Regulation */}
          <Card className={`shadow-sm ${!compensationData.eu.eligible ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h4 className="text-lg font-semibold text-card-foreground">
                  {t('calculator.euRegulation', language)}
                </h4>
                {getStatusBadge(compensationData.eu.eligible)}
              </div>
              <div className={`text-3xl font-bold mb-2 ${
                compensationData.eu.eligible ? 'text-green-600' : 'text-gray-400'
              }`} data-testid="eu-compensation-amount">
                €{compensationData.eu.amount}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {compensationData.eu.reason || compensationData.eu.details.regulation}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {compensationData.eu.eligible ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  EU departure/arrival flight
                </li>
                <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {compensationData.eu.details.delayMinutes >= 180 ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  Delay over 3 hours ({formatDelayTime(compensationData.eu.details.delayMinutes)})
                </li>
                <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  No extraordinary circumstances
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Israeli Law */}
          <Card className={`shadow-sm ${!compensationData.israel.eligible ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h4 className="text-lg font-semibold text-card-foreground">
                  {t('calculator.israelLaw', language)}
                </h4>
                {getStatusBadge(compensationData.israel.eligible)}
              </div>
              <div className={`text-3xl font-bold mb-2 ${
                compensationData.israel.eligible ? 'text-green-600' : 'text-gray-400'
              }`} data-testid="israel-compensation-amount">
                ₪{compensationData.israel.amount}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {compensationData.israel.reason || compensationData.israel.details.regulation}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {compensationData.israel.eligible ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  Israeli departure/arrival
                </li>
                <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {compensationData.israel.details.delayMinutes >= 480 ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  Delay over 8 hours ({formatDelayTime(compensationData.israel.details.delayMinutes)})
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* Recommended Action */}
        {compensationData.recommended && (
          <Card className="bg-green-50 border-green-200 mt-8">
            <CardContent className="p-6">
              <div className={`flex items-start space-x-4 ${isRTL ? 'space-x-reverse flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <ThumbsUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">
                    Great news! You're eligible for {compensationData.recommended.currency === 'EUR' ? '€' : '₪'}{compensationData.recommended.amount}
                  </h4>
                  <p className="text-green-700 mb-4">
                    Your flight qualifies for compensation under {compensationData.recommended.details.regulation}. 
                    We can help you claim this amount with a 98% success rate.
                  </p>
                  {onStartClaim && (
                    <Button 
                      onClick={onStartClaim}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      data-testid="button-start-claim"
                    >
                      {t('calculator.startClaim', language)}
                      <ThumbsUp className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Compensation Available */}
        {!compensationData.recommended && (
          <Card className="bg-gray-50 border-gray-200 mt-8">
            <CardContent className="p-6">
              <div className={`flex items-start space-x-4 ${isRTL ? 'space-x-reverse flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Unfortunately, this flight is not eligible for compensation
                  </h4>
                  <p className="text-gray-700 mb-4">
                    Based on current regulations and flight details, this flight does not qualify for monetary compensation. 
                    However, you may still be entitled to assistance from the airline.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
