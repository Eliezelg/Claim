import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, setAccessToken, refreshAccessToken, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";

export function useAuth() {
  const [initialized, setInitialized] = useState(false);
  
  // Try to refresh token on app start
  useEffect(() => {
    const initAuth = async () => {
      await refreshAccessToken();
      setInitialized(true);
    };
    
    initAuth();
  }, []);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: initialized, // Only run after token initialization
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string;
      preferredLanguage?: string;
    }) => {
      const res = await apiRequest('POST', '/api/auth/register', userData);
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
      setAccessToken(null);
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  return {
    user,
    isLoading: !initialized || isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    logoutLoading: logoutMutation.isPending,
  };
}
