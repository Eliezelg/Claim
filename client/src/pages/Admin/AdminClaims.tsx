import { AdminRoute } from "@/components/Admin/AdminRoute";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  FileText,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import type { Claim, ClaimStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminClaim extends Claim {
  passengerName: string;
  airline: string;
  route: string;
  disruptionType: string;
  compensationAmount: number;
}

interface AdminClaimsResponse {
  claims: AdminClaim[];
  total: number;
}

export default function AdminClaims() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { data: response, isLoading, error } = useQuery<AdminClaimsResponse>({
    queryKey: ["/api/admin/claims", {
      search: searchTerm || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize
    }],
  });

  const claims = response?.claims || [];
  const totalClaims = response?.total || 0;
  const totalPages = Math.ceil(totalClaims / pageSize);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const { toast } = useToast();

  const updateClaimStatusMutation = useMutation({
    mutationFn: ({ claimId, status }: { claimId: string; status: ClaimStatus }) =>
      apiRequest('PATCH', `/api/admin/claims/${claimId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/claims" });
      toast({ title: "Success", description: "Claim status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update claim status", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'DOCUMENTING':
        return 'bg-orange-100 text-orange-800';
      case 'NEGOTIATING':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Claims Management</h1>
              <p className="text-muted-foreground mt-2">
                Review, update, and manage passenger compensation claims
              </p>
            </div>
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-export-claims"
            >
              <Download className="w-4 h-4" />
              <span>Export Claims</span>
            </Button>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by claim number, passenger name, or flight..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-claims"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="DOCUMENTING">Documenting</SelectItem>
                      <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claims List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>All Claims</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  Failed to load claims data
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Claims Table Header */}
                  <div className="grid grid-cols-7 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                    <div>Claim #</div>
                    <div>Passenger</div>
                    <div>Flight</div>
                    <div>Route</div>
                    <div>Status</div>
                    <div>Amount</div>
                    <div>Actions</div>
                  </div>

                  {/* Claims Rows */}
                  {claims?.map((claim) => (
                    <div 
                      key={claim.id} 
                      className="grid grid-cols-7 gap-4 py-3 border-b hover:bg-muted/50 transition-colors"
                      data-testid={`row-claim-${claim.id}`}
                    >
                      <div className="font-medium">
                        {claim.claimNumber}
                      </div>
                      <div>
                        <div className="font-medium">{claim.passengerName}</div>
                      </div>
                      <div>
                        <div className="font-medium">{claim.flightNumber}</div>
                        <div className="text-sm text-muted-foreground">{claim.airline}</div>
                      </div>
                      <div className="text-sm">
                        {claim.route}
                      </div>
                      <div>
                        <Badge className={getStatusColor(claim.status || 'DRAFT')}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(claim.status || 'DRAFT')}
                            <span>{claim.status || 'DRAFT'}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="font-medium">
                        €{claim.compensationAmount?.toLocaleString() || '0'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/claims/${claim.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            data-testid={`button-view-claim-${claim.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Select 
                          value={claim.status || 'DRAFT'} 
                          onValueChange={(newStatus: ClaimStatus) => {
                            updateClaimStatusMutation.mutate({ claimId: claim.id, status: newStatus });
                          }}
                          disabled={updateClaimStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUBMITTED">Submitted</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                            <SelectItem value="DOCUMENTING">Documenting</SelectItem>
                            <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}

                  {(!claims || claims.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground">
                      No claims found matching your criteria
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalClaims)} of {totalClaims} claims
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          data-testid="button-prev-page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                                data-testid={`button-page-${pageNum}`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          data-testid="button-next-page"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}