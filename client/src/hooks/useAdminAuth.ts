import { useAuth } from "./useAuth";
import type { UserRole, User } from "@shared/schema";

export function useAdminAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Type assertion for user object
  const typedUser = user as User | undefined;

  const isAdmin = isAuthenticated && typedUser?.role && ['ADMIN', 'SUPERADMIN'].includes(typedUser.role);
  const isSuperAdmin = isAuthenticated && typedUser?.role === 'SUPERADMIN';

  // Debug logging
  console.log('useAdminAuth Debug:', {
    isAuthenticated,
    isLoading,
    user: typedUser ? { id: typedUser.id, email: typedUser.email, role: typedUser.role } : null,
    isAdmin,
    isSuperAdmin,
    userRole: typedUser?.role
  });

  return {
    user: typedUser,
    isLoading,
    isAuthenticated,
    isAdmin: !!isAdmin,
    isSuperAdmin: !!isSuperAdmin,
    userRole: typedUser?.role as UserRole | undefined,
  };
}