import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { ChevronDown, HelpCircle, FileText, Scale, Clock } from "lucide-react";

export default function FAQ() {
  const { language, isRTL } = useLanguage();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const faqSections = [
    {
      id: 'general',
      title: t('faq.general.title'),
      icon: HelpCircle,
      questions: [
        {
          id: 'general-1',
          question: t('faq.general.q1'),
          answer: t('faq.general.a1'),
        },
        {
          id: 'general-2',
          question: t('faq.general.q2'),
          answer: t('faq.general.a2'),
        },
        {
          id: 'general-3',
          question: t('faq.general.q3'),
          answer: t('faq.general.a3'),
        },
      ],
    },
    {
      id: 'eligibility',
      title: t('faq.eligibility.title'),
      icon: Scale,
      questions: [
        {
          id: 'eligibility-1',
          question: t('faq.eligibility.q1'),
          answer: t('faq.eligibility.a1'),
        },
        {
          id: 'eligibility-2',
          question: t('faq.eligibility.q2'),
          answer: t('faq.eligibility.a2'),
        },
      ],
    },
    {
      id: 'process',
      title: t('faq.process.title'),
      icon: FileText,
      questions: [
        {
          id: 'process-1',
          question: t('faq.process.q1'),
          answer: t('faq.process.a1'),
        },
        {
          id: 'process-2',
          question: t('faq.process.q2'),
          answer: t('faq.process.a2'),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('faq.title')}
            </h1>
            <p className="text-xl md:text-2xl text-purple-100">
              {t('faq.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {faqSections.map((section) => (
              <Card key={section.id} className="mb-8">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <section.icon className="w-6 h-6 text-purple-600" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {section.questions.map((faq) => (
                      <Collapsible
                        key={faq.id}
                        open={openItems.includes(faq.id)}
                        onOpenChange={() => toggleItem(faq.id)}
                      >
                        <CollapsibleTrigger className="w-full p-6 text-left hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 pr-4">
                              {faq.question}
                            </h3>
                            <ChevronDown 
                              className={`w-5 h-5 text-gray-500 transition-transform ${
                                openItems.includes(faq.id) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-6 pb-6">
                          <div className="pt-2">
                            <p className="text-gray-600 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Help Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {t('faq.help.title')}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t('faq.help.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
              >
                {t('faq.help.contactUs')}
              </a>
              <a
                href="/claim"
                className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-600 hover:text-white transition-colors"
              >
                {t('faq.help.checkFlight')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="py-20 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">24h</h3>
                <p className="text-gray-600">{t('faq.stats.responseTime')}</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">98%</h3>
                <p className="text-gray-600">{t('faq.stats.successRate')}</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">100%</h3>
                <p className="text-gray-600">{t('faq.stats.freeSupport')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
