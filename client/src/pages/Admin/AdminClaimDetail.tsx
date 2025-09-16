import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  User, 
  Plane, 
  Calendar, 
  MapPin, 
  Clock, 
  Euro, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Download,
  Eye
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AdminRoute } from "@/components/Admin/AdminRoute";

interface Claim {
  id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  flight: {
    id: string;
    flightNumber: string;
    departureAirport: {
      name: string;
      city: string;
      country: string;
      iataCode: string;
    };
    arrivalAirport: {
      name: string;
      city: string;
      country: string;
      iataCode: string;
    };
    airline: {
      name: string;
      iataCode: string;
    };
    scheduledDeparture: string;
    actualDeparture?: string;
    scheduledArrival: string;
    actualArrival?: string;
    flightDate: string;
  };
  compensation: {
    amount: number;
    currency: string;
    reason: string;
    regulation: 'EU' | 'ISRAEL';
  };
  documents: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }>;
  timeline: Array<{
    id: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
}

const statusConfig = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
  SUBMITTED: { label: 'Soumis', color: 'bg-blue-100 text-blue-800', icon: Clock },
  IN_REVIEW: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  APPROVED: { label: 'Approuvé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800', icon: XCircle },
  PAID: { label: 'Payé', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
};

export default function AdminClaimDetail() {
  const { language, isRTL } = useLanguage();
  const params = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const claimId = params.id;

  const { data: claim, isLoading, error } = useQuery<Claim>({
    queryKey: ['admin-claim', claimId],
    queryFn: () => apiRequest('GET', `/api/admin/claims/${claimId}`),
    enabled: !!claimId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return apiRequest('PATCH', `/api/admin/claims/${claimId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-claim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['admin-claims'] });
    },
  });

  const handleStatusUpdate = (newStatus: string) => {
    updateStatusMutation.mutate({ status: newStatus });
  };

  if (isLoading) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-64 bg-gray-200 rounded"></div>
                  <div className="h-48 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-48 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminRoute>
    );
  }

  if (error || !claim) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erreur lors du chargement de la réclamation. Veuillez réessayer.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AdminRoute>
    );
  }

  const StatusIcon = statusConfig[claim.status].icon;

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin/claims')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Réclamation #{claim.id.slice(-8)}
                </h1>
                <p className="text-gray-600">
                  Créée le {new Date(claim.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <Badge className={`${statusConfig[claim.status].color} px-3 py-1`}>
              <StatusIcon className="w-4 h-4 mr-2" />
              {statusConfig[claim.status].label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Informations du vol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vol</label>
                      <p className="text-lg font-semibold">{claim.flight.flightNumber}</p>
                      <p className="text-sm text-gray-600">{claim.flight.airline.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-lg font-semibold">
                        {new Date(claim.flight.flightDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Départ</label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-semibold">{claim.flight.departureAirport.name}</p>
                          <p className="text-sm text-gray-600">
                            {claim.flight.departureAirport.city}, {claim.flight.departureAirport.country}
                          </p>
                          <p className="text-xs text-gray-500">
                            {claim.flight.departureAirport.iataCode}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Prévu: {new Date(claim.flight.scheduledDeparture).toLocaleString('fr-FR')}
                        </p>
                        {claim.flight.actualDeparture && (
                          <p className="text-sm text-gray-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Réel: {new Date(claim.flight.actualDeparture).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Arrivée</label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-semibold">{claim.flight.arrivalAirport.name}</p>
                          <p className="text-sm text-gray-600">
                            {claim.flight.arrivalAirport.city}, {claim.flight.arrivalAirport.country}
                          </p>
                          <p className="text-xs text-gray-500">
                            {claim.flight.arrivalAirport.iataCode}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Prévu: {new Date(claim.flight.scheduledArrival).toLocaleString('fr-FR')}
                        </p>
                        {claim.flight.actualArrival && (
                          <p className="text-sm text-gray-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Réel: {new Date(claim.flight.actualArrival).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compensation Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="w-5 h-5" />
                    Compensation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Montant</label>
                      <p className="text-2xl font-bold text-green-600">
                        {claim.compensation.amount} {claim.compensation.currency}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Réglementation</label>
                      <p className="text-lg font-semibold">
                        {claim.compensation.regulation === 'EU' ? 'Réglementation UE' : 'Droit israélien'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Raison</label>
                    <p className="text-gray-700">{claim.compensation.reason}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents ({claim.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {claim.documents.length > 0 ? (
                    <div className="space-y-2">
                      {claim.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{doc.originalName}</p>
                              <p className="text-sm text-gray-500">
                                {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Télécharger
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucun document téléchargé</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Passager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nom</label>
                      <p className="font-semibold">
                        {claim.user.firstName} {claim.user.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{claim.user.email}</p>
                    </div>
                    {claim.user.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Téléphone</label>
                        <p className="text-sm">{claim.user.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Status Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {claim.status === 'SUBMITTED' && (
                    <Button
                      onClick={() => handleStatusUpdate('IN_REVIEW')}
                      className="w-full"
                      disabled={updateStatusMutation.isPending}
                    >
                      Marquer en cours
                    </Button>
                  )}
                  {claim.status === 'IN_REVIEW' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate('APPROVED')}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={updateStatusMutation.isPending}
                      >
                        Approuver
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate('REJECTED')}
                        variant="destructive"
                        className="w-full"
                        disabled={updateStatusMutation.isPending}
                      >
                        Rejeter
                      </Button>
                    </>
                  )}
                  {claim.status === 'APPROVED' && (
                    <Button
                      onClick={() => handleStatusUpdate('PAID')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={updateStatusMutation.isPending}
                    >
                      Marquer comme payé
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Historique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {claim.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
