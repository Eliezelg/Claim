import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  Home,
  Plane,
  Shield
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isSuperAdmin } = useAdminAuth();
  const { logout } = useAuth();
  const { language, isRTL } = useLanguage();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3, testId: 'link-admin-dashboard' },
    { name: 'Claims', href: '/admin/claims', icon: FileText, testId: 'link-admin-claims' },
    { name: 'Users', href: '/admin/users', icon: Users, testId: 'link-admin-users' },
    { name: 'Reports', href: '/admin/reports', icon: Settings, testId: 'link-admin-reports' },
  ];

  const isCurrentPath = (path: string) => {
    if (path === '/admin') {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Logo and Mobile Menu */}
            <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <Link href="/" data-testid="link-home">
                <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Plane className="text-primary-foreground w-4 h-4" />
                  </div>
                  <span className="text-xl font-bold text-foreground">
                    FlightClaim
                  </span>
                  <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Admin
                  </div>
                </div>
              </Link>
            </div>

            {/* User Menu */}
            <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              
              <Link href="/" data-testid="link-main-site">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-64 bg-white border-r border-border fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-30 pt-16`}>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const current = isCurrentPath(item.href);
              
              return (
                <Link key={item.href} href={item.href} data-testid={item.testId}>
                  <div
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      current
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    } ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${isRTL ? 'md:mr-64' : 'md:ml-64'} pt-0`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20" 
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}
    </div>
  );
}