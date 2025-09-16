import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { CheckCircle, Search, Calculator, FileText, CreditCard, Clock, Shield, Languages, Zap } from "lucide-react";

export default function HowItWorks() {
  const { language, isRTL } = useLanguage();

  const steps = [
    {
      icon: Search,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      icon: Calculator,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      icon: FileText,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
    {
      icon: CreditCard,
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: t('howItWorks.benefits.fast'),
    },
    {
      icon: Shield,
      title: t('howItWorks.benefits.legal'),
    },
    {
      icon: CheckCircle,
      title: t('howItWorks.benefits.noWin'),
    },
    {
      icon: Languages,
      title: t('howItWorks.benefits.multilingual'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('howItWorks.title')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              {t('howItWorks.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {index + 1}
                    </Badge>
                  </div>
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <step.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('howItWorks.benefits.title')}
            </h2>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                    <benefit.icon className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Prêt à réclamer votre compensation ?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Commencez dès maintenant et récupérez l'argent qui vous est dû
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/claim"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
              >
                Vérifier mon vol
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
