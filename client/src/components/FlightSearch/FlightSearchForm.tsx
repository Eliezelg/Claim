import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Search, Calendar } from "lucide-react";
import { FlightSearchResult } from "@/types/flight";
import { apiRequest } from "@/lib/queryClient";

interface FlightSearchFormProps {
  onResult: (result: FlightSearchResult) => void;
}

export function FlightSearchForm({ onResult }: FlightSearchFormProps) {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: '',
    flightDate: '',
    departureAirport: '',
    arrivalAirport: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.flightNumber || !formData.flightDate) {
      toast({
        title: "Missing Information",
        description: "Please provide flight number and date",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Sending flight search request:', {
        flight_number: formData.flightNumber.toUpperCase(),
        date: formData.flightDate,
      });
      
      const response = await apiRequest('POST', '/api/compensation/calculate', {
        flight_number: formData.flightNumber.toUpperCase(),
        date: formData.flightDate,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Flight search result:', result);
      
      // Vérifier la structure de la réponse
      if (!result || !result.flight) {
        console.error('Invalid response structure:', result);
        throw new Error('Invalid response format from server');
      }
      
      onResult(result);
      
      toast({
        title: "Flight Found",
        description: "Compensation calculation completed",
      });
    } catch (error) {
      console.error('Flight search error:', error);
      
      // Logs plus détaillés pour l'erreur
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      toast({
        title: "Flight Not Found",
        description: error instanceof Error ? error.message : "Please check your flight number and date and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get max date (3 years ago for EU, 4 years for Israel)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 3);
  const maxDateString = maxDate.toISOString().split('T')[0];

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="flightNumber" className="block text-sm font-medium text-muted-foreground mb-2">
            {t('form.flightNumber.label', language)}
          </Label>
          <div className="relative">
            <Input
              id="flightNumber"
              type="text"
              placeholder={t('form.flightNumber.placeholder', language)}
              value={formData.flightNumber}
              onChange={(e) => handleInputChange('flightNumber', e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              data-testid="input-flight-number"
              required
            />
            <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'}`}>
              <Plane className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="flightDate" className="block text-sm font-medium text-muted-foreground mb-2">
            {t('form.flightDate.label', language)}
          </Label>
          <div className="relative">
            <Input
              id="flightDate"
              type="date"
              value={formData.flightDate}
              onChange={(e) => handleInputChange('flightDate', e.target.value)}
              max={today}
              min={maxDateString}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              data-testid="input-flight-date"
              required
            />
            <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'}`}>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="departureAirport" className="block text-sm font-medium text-muted-foreground mb-2">
            {t('form.departure.label', language)}
          </Label>
          <div className="relative">
            <Input
              id="departureAirport"
              type="text"
              placeholder={t('form.departure.placeholder', language)}
              value={formData.departureAirport}
              onChange={(e) => handleInputChange('departureAirport', e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              data-testid="input-departure-airport"
            />
            <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'}`}>
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="arrivalAirport" className="block text-sm font-medium text-muted-foreground mb-2">
            {t('form.arrival.label', language)}
          </Label>
          <div className="relative">
            <Input
              id="arrivalAirport"
              type="text"
              placeholder={t('form.arrival.placeholder', language)}
              value={formData.arrivalAirport}
              onChange={(e) => handleInputChange('arrivalAirport', e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              data-testid="input-arrival-airport"
            />
            <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'}`}>
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        data-testid="button-search-flight"
      >
        {isLoading ? (
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            {t('common.loading', language)}
          </div>
        ) : (
          <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            {t('form.submit.checkFlight', language)}
            <Search className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
          </div>
        )}
      </Button>
    </form>
  );
}
