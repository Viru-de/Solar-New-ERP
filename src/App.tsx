import React, { useState, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth, getRoleDefaultPath } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Toast } from './components/common/Toast';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { WhatsAppModal } from './components/common/WhatsAppModal';
import { ImportExportModal } from './components/common/ImportExportModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginView } from './components/auth/LoginView';
import { useWorkforcePresence } from './hooks/useWorkforcePresence';
import { Sun } from 'lucide-react';

// Code-splitting via dynamic imports for optimized Hostinger bundle performance
const DashboardView = React.lazy(() => import('./components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const CustomerControlCenterView = React.lazy(() => import('./components/views/CustomerControlCenterView').then(m => ({ default: m.CustomerControlCenterView })));
const CrmView = React.lazy(() => import('./components/views/CrmView').then(m => ({ default: m.CrmView })));
const ProjectsView = React.lazy(() => import('./components/views/ProjectsView').then(m => ({ default: m.ProjectsView })));
const FinanceView = React.lazy(() => import('./components/views/FinanceView').then(m => ({ default: m.FinanceView })));
const HrmsView = React.lazy(() => import('./components/views/HrmsView').then(m => ({ default: m.HrmsView })));
const ServiceView = React.lazy(() => import('./components/views/ServiceView').then(m => ({ default: m.ServiceView })));
const ReportsView = React.lazy(() => import('./components/views/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = React.lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const CustomerPortalView = React.lazy(() => import('./components/views/CustomerPortalView').then(m => ({ default: m.CustomerPortalView })));
const SalesPurchaseView = React.lazy(() => import('./components/views/SalesPurchaseView').then(m => ({ default: m.SalesPurchaseView })));
const LiveFieldTrackingView = React.lazy(() => import('./components/views/LiveFieldTrackingView').then(m => ({ default: m.LiveFieldTrackingView })));
const UserManagementView = React.lazy(() => import('./components/users/UserManagementView').then(m => ({ default: m.UserManagementView })));

const ViewLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-500">Loading module...</span>
  </div>
);

const MainLayout: React.FC = () => {
  const { activeView } = useApp();
  const { isCustomer, isAdmin, canAccessModule } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    // If the active role is Customer and they are on dashboard or customer portal, show customer view
    if (isCustomer && (activeView === 'dashboard' || activeView === 'customer_portal')) {
      return <CustomerPortalView />;
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'live_tracking':
        if (!isAdmin) return <DashboardView />;
        return <LiveFieldTrackingView />;
      case 'customer_control_center':
        return <CustomerControlCenterView />;
      case 'crm_leads':
        if (!canAccessModule('crm_leads')) return <DashboardView />;
        return <CrmView key="crm_leads" defaultTab="LEADS" />;
      case 'crm_customers':
        if (!canAccessModule('crm_customers')) return <DashboardView />;
        return <CrmView key="crm_customers" defaultTab="CUSTOMERS" />;
      case 'crm_quotations':
        if (!canAccessModule('crm_quotations')) return <DashboardView />;
        return <CrmView key="crm_quotations" defaultTab="QUOTATIONS" />;
      case 'projects_all':
      case 'projects_stage_filtered':
        return <ProjectsView />;
      case 'finance':
        if (!canAccessModule('finance')) return <DashboardView />;
        return <FinanceView />;
      case 'hrms':
        if (!canAccessModule('hrms')) return <DashboardView />;
        return <HrmsView />;
      case 'service':
        return <ServiceView />;
      case 'reports':
        if (!canAccessModule('reports')) return <DashboardView />;
        return <ReportsView />;
      case 'settings':
        if (!isAdmin) return <DashboardView />;
        return <SettingsView />;
      case 'customer_portal':
        return <CustomerPortalView />;
      case 'users':
        if (!isAdmin) return <DashboardView />;
        return <UserManagementView />;
      case 'sales_purchase':
      case 'sales_bom':
      case 'sales_invoices':
      case 'purchase_vendors':
      case 'purchase_orders':
      case 'inventory_products':
      case 'inventory_stock':
      case 'warehouse_management':
        return <SalesPurchaseView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Top Universal App Header */}
      <Header onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Collapsible Navigation Sidebar */}
        <Sidebar isOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />

        {/* Primary Operational Stage Canvas */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 lg:ml-64">
          <div className="w-full">
            <Suspense fallback={<ViewLoader />}>
              {renderActiveView()}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile Responsive Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Application Modals & Notification Toasters */}
      <GlobalSearchModal />
      <WhatsAppModal />
      <ImportExportModal />
      <Toast />
    </div>
  );
};

const ProtectedApp: React.FC = () => {
  const { currentUser, isAuthenticated, loading } = useAuth();

  // Automatic employee presence lifecycle
  useWorkforcePresence(currentUser, isAuthenticated);

  // Route URL Synchronization & Protection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.toLowerCase();

    if (isAuthenticated && currentUser) {
      if (path === '/login' || path.endsWith('/login')) {
        const targetPath = getRoleDefaultPath(currentUser.role);
        window.history.replaceState(null, '', targetPath);
      }
    } else if (!loading && !isAuthenticated) {
      if (path !== '/login' && !path.endsWith('/login')) {
        window.history.replaceState(null, '', '/login');
      }
    }
  }, [isAuthenticated, currentUser, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
          <Sun className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying Rejoy Solar session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginView />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
