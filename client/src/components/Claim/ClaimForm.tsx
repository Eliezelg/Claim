import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ClaimFormData } from "@/types/claim";

interface ClaimFormProps {
  initialData?: Partial<ClaimFormData>;
  onSubmit: (data: ClaimFormData) => void;
  onBack: () => void;
}

export function ClaimForm({ initialData = {}, onSubmit, onBack }: ClaimFormProps) {
  const { language, isRTL } = useLanguage();
  const [formData, setFormData] = useState<Partial<ClaimFormData>>({
    passengerFirstName: '',
    passengerLastName: '',
    passengerEmail: '',
    passengerPhone: '',
    passengerCountry: '',
    passengerAddress: '',
    iban: '',
    incidentDescription: '',
    assistanceReceived: false,
    ...initialData,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.passengerFirstName || !formData.passengerLastName || !formData.passengerEmail) {
      return;
    }

    onSubmit(formData as ClaimFormData);
  };

  const handleInputChange = (field: keyof ClaimFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const countries = [
    'United States', 'Israel', 'France', 'Germany', 'Spain', 'Italy', 
    'United Kingdom', 'Netherlands', 'Belgium', 'Austria', 'Switzerland',
    'Canada', 'Australia', 'Other'
  ];

  return (
    <Card className="shadow-sm max-w-4xl mx-auto">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground mb-2">
                {t('claim.firstName.label', language)} *
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={formData.passengerFirstName || ''}
                onChange={(e) => handleInputChange('passengerFirstName', e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-first-name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground mb-2">
                {t('claim.lastName.label', language)} *
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                value={formData.passengerLastName || ''}
                onChange={(e) => handleInputChange('passengerLastName', e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-last-name"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
              {t('claim.email.label', language)} *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.passengerEmail || ''}
              onChange={(e) => handleInputChange('passengerEmail', e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="input-email"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-2">
                {t('claim.phone.label', language)}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.passengerPhone || ''}
                onChange={(e) => handleInputChange('passengerPhone', e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-phone"
              />
            </div>
            
            <div>
              <Label htmlFor="country" className="block text-sm font-medium text-muted-foreground mb-2">
                {t('claim.country.label', language)}
              </Label>
              <Select 
                value={formData.passengerCountry || ''} 
                onValueChange={(value) => handleInputChange('passengerCountry', value)}
              >
                <SelectTrigger className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" data-testid="select-country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country} data-testid={`option-country-${country.toLowerCase().replace(' ', '-')}`}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="address" className="block text-sm font-medium text-muted-foreground mb-2">
              {t('claim.address.label', language)}
            </Label>
            <Textarea
              id="address"
              placeholder="Enter your full address for potential correspondence"
              rows={3}
              value={formData.passengerAddress || ''}
              onChange={(e) => handleInputChange('passengerAddress', e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="textarea-address"
            />
          </div>
          
          {/* IBAN Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">Banking Information</h4>
            <p className="text-sm text-muted-foreground mb-4">Required for compensation payment</p>
            <div>
              <Label htmlFor="iban" className="block text-sm font-medium text-muted-foreground mb-2">
                {t('claim.iban.label', language)}
              </Label>
              <Input
                id="iban"
                type="text"
                placeholder="DE89 3704 0044 0532 0130 00"
                value={formData.iban || ''}
                onChange={(e) => handleInputChange('iban', e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-iban"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">
              Describe what happened during your journey
            </Label>
            <Textarea
              id="description"
              placeholder="Please describe the delay/cancellation, any assistance received, and how it affected you..."
              rows={4}
              value={formData.incidentDescription || ''}
              onChange={(e) => handleInputChange('incidentDescription', e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="textarea-incident-description"
            />
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="assistance"
              checked={formData.assistanceReceived || false}
              onChange={(e) => handleInputChange('assistanceReceived', e.target.checked)}
              className="mt-1"
              data-testid="checkbox-assistance-received"
            />
            <Label htmlFor="assistance" className="text-sm text-muted-foreground">
              I received assistance from the airline (meals, accommodation, etc.)
            </Label>
          </div>
          
          <div className={`flex justify-between pt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button 
              type="button" 
              variant="outline"
              onClick={onBack}
              className="px-6 py-3 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('claim.back', language)}
            </Button>
            
            <Button 
              type="submit"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              data-testid="button-continue"
            >
              {t('claim.continue', language)}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
