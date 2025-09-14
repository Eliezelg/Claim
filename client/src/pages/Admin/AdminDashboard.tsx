import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { AdminRoute } from "@/components/Admin/AdminRoute";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface AdminStats {
  totalClaims: number;
  claimsByStatus: Record<string, number>;
  claimsByJurisdiction: Record<string, number>;
  totalCompensation: number;
  avgProcessingTime: number;
  recentActivity: Array<{
    id: string;
    claimId: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const { language, isRTL } = useLanguage();

  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  if (error) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                  <span>Failed to load dashboard statistics</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  const statusStats = stats?.claimsByStatus || {};
  const jurisdictionStats = stats?.claimsByJurisdiction || {};

  return (
    <AdminRoute>
      <AdminLayout>
        <div className={`space-y-6 ${isRTL ? 'rtl' : ''}`}>
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.firstName}! Here's your platform overview.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card data-testid="card-total-claims">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-claims">
                  {stats?.totalClaims || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All platform claims
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-successful-claims">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Claims</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-successful-claims">
                  {statusStats['PAID'] || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Claims paid out
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-compensation">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Compensation</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-compensation">
                  €{stats?.totalCompensation?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Paid to passengers
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-avg-processing">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-processing">
                  {Math.round(stats?.avgProcessingTime || 0)} days
                </div>
                <p className="text-xs text-muted-foreground">
                  From submission to payment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Claims by Status */}
            <Card data-testid="card-status-breakdown">
              <CardHeader>
                <CardTitle>Claims by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statusStats).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {status.toLowerCase().replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-16 h-2 bg-muted rounded-full overflow-hidden"
                          data-testid={`status-bar-${status}`}
                        >
                          <div 
                            className="h-full bg-primary"
                            style={{ 
                              width: `${Math.max(((count as number) / (stats?.totalClaims || 1)) * 100, 2)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Claims by Jurisdiction */}
            <Card data-testid="card-jurisdiction-breakdown">
              <CardHeader>
                <CardTitle>Claims by Jurisdiction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(jurisdictionStats).map(([jurisdiction, count]) => (
                    <div key={jurisdiction} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {jurisdiction === 'EU_261' ? 'EU Regulation 261/2004' : 
                         jurisdiction === 'ISRAEL_ASL' ? 'Israeli Aviation Services Law' : 
                         jurisdiction}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-16 h-2 bg-muted rounded-full overflow-hidden"
                          data-testid={`jurisdiction-bar-${jurisdiction}`}
                        >
                          <div 
                            className="h-full bg-green-500"
                            style={{ 
                              width: `${Math.max(((count as number) / (stats?.totalClaims || 1)) * 100, 2)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <Link href="/admin/claims" data-testid="link-view-all-claims">
                <Button variant="outline" size="sm">
                  View All Claims
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} className="flex items-center space-x-3 pb-3 border-b border-border last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">Claim {activity.claimId}</span>
                        {' - '}{activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString()} at {' '}
                        {new Date(activity.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${{
                      'PAID': 'bg-green-100 text-green-800',
                      'APPROVED': 'bg-blue-100 text-blue-800',
                      'REJECTED': 'bg-red-100 text-red-800',
                      'SUBMITTED': 'bg-yellow-100 text-yellow-800',
                    }[activity.status] || 'bg-gray-100 text-gray-800'}`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
                
                {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity to display
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/claims" data-testid="link-manage-claims">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Manage Claims</h3>
                      <p className="text-sm text-muted-foreground">Review and update claim statuses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users" data-testid="link-manage-users">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Manage Users</h3>
                      <p className="text-sm text-muted-foreground">View users and assign roles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/reports" data-testid="link-generate-reports">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Generate Reports</h3>
                      <p className="text-sm text-muted-foreground">Export data and analytics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}