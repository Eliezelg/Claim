import { AdminRoute } from "@/components/Admin/AdminRoute";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface ReportData {
  title: string;
  description: string;
  type: 'financial' | 'operational' | 'analytical';
  lastGenerated: string;
  size: string;
  canGenerate: boolean;
}

export default function AdminReports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("all");

  // This page requires super admin privileges
  const availableReports: ReportData[] = [
    {
      title: "Financial Summary Report",
      description: "Comprehensive financial overview including compensation payouts, revenue, and cost analysis",
      type: "financial",
      lastGenerated: "2024-01-15",
      size: "2.3 MB",
      canGenerate: true
    },
    {
      title: "Claims Analytics Report",
      description: "Detailed analytics on claim patterns, success rates, and processing times",
      type: "analytical",
      lastGenerated: "2024-01-14",
      size: "1.8 MB",
      canGenerate: true
    },
    {
      title: "Operational Performance Report",
      description: "Platform performance metrics, user activity, and system utilization statistics",
      type: "operational",
      lastGenerated: "2024-01-13",
      size: "1.2 MB",
      canGenerate: true
    },
    {
      title: "Regulatory Compliance Report",
      description: "Compliance status across different jurisdictions and regulatory requirements",
      type: "operational",
      lastGenerated: "2024-01-10",
      size: "950 KB",
      canGenerate: true
    },
    {
      title: "User Behavior Analytics",
      description: "User engagement patterns, conversion rates, and platform usage analytics",
      type: "analytical",
      lastGenerated: "2024-01-09",
      size: "1.5 MB",
      canGenerate: true
    },
    {
      title: "Airline Performance Report",
      description: "Analysis of airline-specific claim patterns and disruption frequencies",
      type: "analytical",
      lastGenerated: "2024-01-08",
      size: "2.1 MB",
      canGenerate: true
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'operational':
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'analytical':
        return <PieChart className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'operational':
        return 'bg-blue-100 text-blue-800';
      case 'analytical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reportType === "all" 
    ? availableReports 
    : availableReports.filter(report => report.type === reportType);

  return (
    <AdminRoute requireSuperAdmin={true}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Generate and download comprehensive reports and analytics data
              </p>
            </div>
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-refresh-reports"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh All</span>
            </Button>
          </div>

          {/* Report Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date From</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    data-testid="input-date-from"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date To</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    data-testid="input-date-to"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger data-testid="select-report-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="analytical">Analytical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center space-x-2"
                    data-testid="button-apply-filters"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Apply Filters</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Available Reports</p>
                    <p className="text-2xl font-bold" data-testid="text-available-reports">
                      {availableReports.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Financial Reports</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-financial-reports">
                      {availableReports.filter(r => r.type === 'financial').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Operational Reports</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-operational-reports">
                      {availableReports.filter(r => r.type === 'operational').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Analytics Reports</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-analytics-reports">
                      {availableReports.filter(r => r.type === 'analytical').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Available Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReports.map((report, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    data-testid={`card-report-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getTypeIcon(report.type)}
                          <h3 className="font-semibold">{report.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(report.type)}`}>
                            {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {report.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                          </div>
                          <div>Size: {report.size}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm"
                          variant="outline"
                          disabled={!report.canGenerate}
                          data-testid={`button-generate-${index}`}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Generate
                        </Button>
                        <Button 
                          size="sm"
                          data-testid={`button-download-${index}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No reports found matching your criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}