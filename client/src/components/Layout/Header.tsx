import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/Common/LanguageSelector";
import { Plane } from "lucide-react";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { language, isRTL } = useLanguage();
  const [location] = useLocation();

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" data-testid="link-home">
              <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Plane className="text-primary-foreground w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  {t('header.logo', language)}
                </span>
              </div>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className={`hidden md:flex space-x-8 ${isRTL ? 'space-x-reverse' : ''}`}>
            <Link 
              href={`/${language}/how-it-works`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-how-it-works"
            >
              {t('header.nav.howItWorks', language)}
            </Link>
            <Link 
              href={`/${language}/your-rights`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-your-rights"
            >
              {t('header.nav.yourRights', language)}
            </Link>
            <Link 
              href={`/${language}/faq`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-faq"
            >
              {t('header.nav.faq', language)}
            </Link>
            <Link 
              href={`/${language}/contact`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-contact"
            >
              {t('header.nav.contact', language)}
            </Link>
          </nav>
          
          {/* Language selector and Auth */}
          <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <LanguageSelector />
            
            {/* Auth Buttons */}
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" data-testid="link-dashboard">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                      {t('dashboard.title', language)}
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    onClick={() => logout()}
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" data-testid="button-signin">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                      {t('header.auth.signIn', language)}
                    </Button>
                  </Link>
                  <Link href="/claim" data-testid="button-get-started">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {t('header.auth.getStarted', language)}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
