import { useLanguage, Language } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

const languageOptions: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'he', label: 'עברית', flag: '🇮🇱' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const currentLanguage = languageOptions.find(option => option.value === language);

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger 
        className="w-auto bg-secondary text-secondary-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        data-testid="select-language"
      >
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span>{currentLanguage?.flag}</span>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languageOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            data-testid={`option-language-${option.value}`}
          >
            <div className="flex items-center space-x-2">
              <span>{option.flag}</span>
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
