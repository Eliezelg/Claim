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
  Users,
  Download,
  MoreHorizontal,
  Shield,
  User,
  Crown,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { User as UserType, UserRole } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminUser extends UserType {
  totalClaims: number;
  successfulClaims: number;
  totalCompensation: number;
  joinedAt: string;
  lastLogin: string;
  isActive: boolean;
}

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { data: response, isLoading, error } = useQuery<AdminUsersResponse>({
    queryKey: ["/api/admin/users", {
      search: searchTerm || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize
    }],
  });

  const users = response?.users || [];
  const totalUsers = response?.total || 0;
  const totalPages = Math.ceil(totalUsers / pageSize);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const { toast } = useToast();

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "/api/admin/users" });
      toast({ title: "Success", description: "User role updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SUPERADMIN':
        return <Crown className="w-4 h-4 text-purple-500" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
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
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                className="flex items-center space-x-2"
                data-testid="button-export-users"
              >
                <Download className="w-4 h-4" />
                <span>Export Users</span>
              </Button>
              <Button 
                className="flex items-center space-x-2"
                data-testid="button-invite-user"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite User</span>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48" data-testid="select-role-filter">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="USER">Users</SelectItem>
                      <SelectItem value="ADMIN">Admins</SelectItem>
                      <SelectItem value="SUPERADMIN">Super Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold" data-testid="text-total-users">
                      {totalUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-admin-count">
                      {users?.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Regular Users</p>
                    <p className="text-2xl font-bold" data-testid="text-user-count">
                      {users?.filter(u => u.role === 'USER').length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-active-users">
                      {users?.filter(u => u.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>All Users</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-500">
                  Failed to load users data
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Users Table Header */}
                  <div className="grid grid-cols-7 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Claims</div>
                    <div>Compensation</div>
                    <div>Last Login</div>
                    <div>Actions</div>
                  </div>

                  {/* Users Rows */}
                  {users?.map((user) => (
                    <div 
                      key={user.id} 
                      className="grid grid-cols-7 gap-4 py-3 border-b hover:bg-muted/50 transition-colors"
                      data-testid={`row-user-${user.id}`}
                    >
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className={`text-xs ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="text-sm">{user.email}</div>
                      <div>
                        <Badge className={getRoleColor(user.role || 'USER')}>
                          <div className="flex items-center space-x-1">
                            {getRoleIcon(user.role || 'USER')}
                            <span>{user.role || 'USER'}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <div>{user.totalClaims} total</div>
                        <div className="text-green-600">{user.successfulClaims} successful</div>
                      </div>
                      <div className="font-medium">
                        €{user.totalCompensation?.toLocaleString() || '0'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Toggle role between USER and ADMIN (only super admins can create other super admins)
                            const newRole: UserRole = user.role === 'USER' ? 'ADMIN' : 'USER';
                            updateUserRoleMutation.mutate({ userId: user.id, role: newRole });
                          }}
                          disabled={updateUserRoleMutation.isPending}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          {updateUserRoleMutation.isPending ? 'Updating...' : 'Toggle Role'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-more-user-${user.id}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {(!users || users.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground">
                      No users found matching your criteria
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
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