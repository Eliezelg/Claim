import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Plane } from "lucide-react";

export function Footer() {
  const { language, isRTL } = useLanguage();

  return (
    <footer className="bg-muted border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          {/* Company Info */}
          <div>
            <div className={`flex items-center space-x-2 mb-4 ${isRTL ? 'space-x-reverse justify-end' : ''}`}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Plane className="text-primary-foreground w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {t('header.logo', language)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Helping passengers claim compensation for delayed and cancelled flights since 2020.
            </p>
            <div className={`flex space-x-4 ${isRTL ? 'space-x-reverse justify-end' : ''}`}>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-facebook">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-linkedin">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-delay-claims">Flight Delay Claims</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-cancellation-claims">Cancellation Claims</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-overbooking-claims">Overbooking Claims</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-missed-connections">Missed Connections</a></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-eu-regulation">EU Regulation 261/2004</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-israeli-law">Israeli Aviation Law</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-help">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-contact-support">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-faq-support">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-live-chat">Live Chat</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 FlightClaim. All rights reserved. | Licensed by aviation authorities in EU and Israel.
          </p>
        </div>
      </div>
    </footer>
  );
}
