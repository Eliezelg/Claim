import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Scale, Clock, Euro, MapPin, AlertCircle, CheckCircle } from "lucide-react";

export default function YourRights() {
  const { language, isRTL } = useLanguage();

  const euAmounts = [
    { distance: "≤ 1,500 km", amount: "250€" },
    { distance: "1,500 - 3,500 km", amount: "400€" },
    { distance: "> 3,500 km", amount: "600€" },
  ];

  const israelAmounts = [
    { delay: "8-12 heures", amount: "500 NIS" },
    { delay: "12-24 heures", amount: "1,000 NIS" },
    { delay: "> 24 heures", amount: "1,500 NIS" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('rights.title')}
            </h1>
            <p className="text-xl md:text-2xl text-green-100">
              {t('rights.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* EU Regulation Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Card className="mb-12">
              <CardHeader className="bg-blue-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-blue-900">
                      {t('rights.eu.title')}
                    </CardTitle>
                    <p className="text-blue-700 mt-2">
                      {t('rights.eu.description')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      {t('rights.eu.conditionsTitle')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p>{t('rights.eu.condition1')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p>{t('rights.eu.condition2')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p>{t('rights.eu.condition3')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p>{t('rights.eu.condition4')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <p>{t('rights.eu.condition5')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Euro className="w-5 h-5 text-green-600" />
                      {t('rights.eu.amountsTitle')}
                    </h3>
                    <div className="space-y-3">
                      {euAmounts.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{item.distance}</span>
                          <Badge variant="secondary" className="text-lg font-bold">
                            {item.amount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Israel Law Section */}
            <Card className="mb-12">
              <CardHeader className="bg-orange-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-orange-900">
                      {t('rights.israel.title')}
                    </CardTitle>
                    <p className="text-orange-700 mt-2">
                      {t('rights.israel.description')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      {t('rights.israel.conditionsTitle')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <p>{t('rights.israel.condition1')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <p>{t('rights.israel.condition2')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                        <p>{t('rights.israel.condition3')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Euro className="w-5 h-5 text-green-600" />
                      {t('rights.israel.amountsTitle')}
                    </h3>
                    <div className="space-y-3">
                      {israelAmounts.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{item.delay}</span>
                          <Badge variant="secondary" className="text-lg font-bold">
                            {item.amount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Section */}
            <Card>
              <CardHeader className="bg-purple-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-purple-900">
                      {t('rights.timeline.title')}
                    </CardTitle>
                    <p className="text-purple-700 mt-2">
                      {t('rights.timeline.description')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-green-600">6</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('rights.timeline.years6')}</h3>
                    <p className="text-gray-600">{t('rights.timeline.years6Desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">2</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('rights.timeline.years2')}</h3>
                    <p className="text-gray-600">{t('rights.timeline.years2Desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-orange-600">1</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('rights.timeline.year1')}</h3>
                    <p className="text-gray-600">{t('rights.timeline.year1Desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-green-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {t('rights.cta.title')}
            </h2>
            <p className="text-xl text-green-100 mb-8">
              {t('rights.cta.description')}
            </p>
            <a
              href="/claim"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors inline-block"
            >
              {t('rights.cta.checkFlight')}
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
