import React, { useState, useEffect } from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  SunMedium,
  Layers,
  CreditCard,
  UserSquare2,
  Wrench,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  ShoppingCart,
  ShieldCheck,
  Navigation
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const {
    activeView,
    setActiveView,
    setStageFilterKey,
    activeReportCategory,
    openReport,
    activeSettingsTab,
    openSettingsTab
  } = useApp();
  const { currentUser, isCustomer, isAdmin, isFieldStaff, canAccessModule, currentRole } = useAuth();

  const [crmOpen, setCrmOpen] = useState(true);
  const [salesPurchaseOpen, setSalesPurchaseOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const isCrmActive = ['crm_leads', 'crm_customers', 'crm_quotations'].includes(activeView);

  // Keep CRM menu open if any of its children is active
  useEffect(() => {
    if (isCrmActive) {
      setCrmOpen(true);
    }
  }, [isCrmActive, activeView]);

  const navigateTo = (view: AppView, stageKey?: string) => {
    if (stageKey) {
      setStageFilterKey(stageKey);
      setActiveView('projects_stage_filtered');
    } else {
      setActiveView(view);
    }
    onCloseMobile();
  };

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none ${
      isActive
        ? 'bg-amber-500 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors select-none ${
      isActive
        ? 'bg-amber-500 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const parentNavItemClass = (isExactActive: boolean, _isChildActive: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${
      isExactActive
        ? 'bg-amber-500 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 overflow-y-auto transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3.5 space-y-5">
          {/* If customer role, only show Customer Portal options */}
          {isCustomer ? (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Client Portal Access
              </div>
              <button
                onClick={() => navigateTo('customer_portal')}
                className={navItemClass(activeView === 'customer_portal')}
              >
                <SunMedium className="w-4 h-4" />
                <span>My Solar Project</span>
              </button>
              <button
                onClick={() => navigateTo('customer_control_center')}
                className={navItemClass(activeView === 'customer_control_center')}
              >
                <Layers className="w-4 h-4" />
                <span>Project Timeline & Docs</span>
              </button>
              <button
                onClick={() => navigateTo('service')}
                className={navItemClass(activeView === 'service')}
              >
                <Wrench className="w-4 h-4" />
                <span>Service & Support</span>
              </button>
            </div>
          ) : (
            <>
              {/* Primary Section */}
              <div className="space-y-1">
                <button
                  onClick={() => navigateTo('dashboard')}
                  className={navItemClass(activeView === 'dashboard')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                {/* Heart of the System: Customer Control Center */}
                {(isAdmin || currentRole === 'Project Manager' || currentRole === 'Service Manager') && (
                  <button
                    onClick={() => navigateTo('customer_control_center')}
                    className={navItemClass(activeView === 'customer_control_center')}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Control Center</span>
                  </button>
                )}
              </div>

              {/* CRM Section */}
              {canAccessModule('crm') && (
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      navigateTo('crm_leads');
                      setCrmOpen(true);
                    }}
                    className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors select-none"
                  >
                    <span className={isCrmActive ? 'text-amber-600 font-bold' : ''}>CRM & Leads</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCrmOpen(prev => !prev);
                      }}
                      className="p-0.5 rounded text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label="Toggle CRM menu"
                    >
                      {crmOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>

                  {crmOpen && (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('crm_leads');
                        }}
                        className={`${subNavItemClass(activeView === 'crm_leads')} cursor-pointer`}
                      >
                        <span>Leads Pipeline</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('crm_customers');
                        }}
                        className={`${subNavItemClass(activeView === 'crm_customers')} cursor-pointer`}
                      >
                        <span>Customer Directory</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('crm_quotations');
                        }}
                        className={`${subNavItemClass(activeView === 'crm_quotations')} cursor-pointer`}
                      >
                        <span>Quotations & Proposals</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sales & Purchase Section */}
              {canAccessModule('sales_purchase') && (
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      navigateTo('sales_purchase');
                      setSalesPurchaseOpen(true);
                    }}
                    className={parentNavItemClass(
                      activeView === 'sales_purchase',
                      [
                        'sales_bom',
                        'sales_invoices',
                        'purchase_vendors',
                        'purchase_orders',
                        'inventory_products',
                        'inventory_stock',
                        'warehouse_management'
                      ].includes(activeView)
                    )}
                  >
           
                      <div className="flex items-center justify-between py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors select-none">
                        <span>Sales & Purchase</span>
                     
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSalesPurchaseOpen(!salesPurchaseOpen);
                      }}
                      className="p-0.5 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
                      aria-label="Toggle Sales & Purchase menu"
                    >
                      {salesPurchaseOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {salesPurchaseOpen && (
                    <div className="space-y-0.5">
                      <button
                        onClick={() => navigateTo('sales_purchase')}
                        className={subNavItemClass(activeView === 'sales_purchase')}
                      >
                        <span>Hub & Synchronization</span>
                      </button>
                      <button
                        onClick={() => navigateTo('sales_bom')}
                        className={subNavItemClass(activeView === 'sales_bom')}
                      >
                        <span>Bill of Materials (BOM)</span>
                      </button>
                      <button
                        onClick={() => navigateTo('sales_invoices')}
                        className={subNavItemClass(activeView === 'sales_invoices')}
                      >
                        <span>Invoice Creation</span>
                      </button>
                      <button
                        onClick={() => navigateTo('purchase_vendors')}
                        className={subNavItemClass(activeView === 'purchase_vendors')}
                      >
                        <span>Vendor Management</span>
                      </button>
                      <button
                        onClick={() => navigateTo('purchase_orders')}
                        className={subNavItemClass(activeView === 'purchase_orders')}
                      >
                        <span>Purchase Entry</span>
                      </button>
                      <button
                        onClick={() => navigateTo('inventory_products')}
                        className={subNavItemClass(activeView === 'inventory_products')}
                      >
                        <span>Purchased Products</span>
                      </button>
                      <button
                        onClick={() => navigateTo('inventory_stock')}
                        className={subNavItemClass(activeView === 'inventory_stock')}
                      >
                        <span>Inventory & Stock</span>
                      </button>
                      <button
                        onClick={() => navigateTo('warehouse_management')}
                        className={subNavItemClass(activeView === 'warehouse_management')}
                      >
                        <span>Warehouse Management</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Projects & Workflows Section */}
              {canAccessModule('projects') && (
                <div className="space-y-1">
                  <div
                    onClick={() => setProjectsOpen(!projectsOpen)}
                    className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors select-none"
                  >
                    <span>{isFieldStaff ? 'My Field Tasks' : 'Project Operations'}</span>
                    {projectsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </div>

                  {projectsOpen && (
                    <div className="space-y-0.5">
                      <button
                        onClick={() => navigateTo('projects_all')}
                        className={subNavItemClass(activeView === 'projects_all')}
                      >
                        <span>{isFieldStaff ? 'Assigned Projects' : 'All Projects'}</span>
                      </button>
                      <button
                        onClick={() => navigateTo('projects_stage_filtered', 'site_survey')}
                        className={subNavItemClass(activeView === 'projects_stage_filtered')}
                      >
                        <span>{isFieldStaff ? 'Site Checklists & Workflows' : 'Stage Workflows'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Field Workforce Live Tracking */}
              {canAccessModule('live_tracking') && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Field Dispatch</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <button
                    onClick={() => navigateTo('live_tracking')}
                    className={navItemClass(activeView === 'live_tracking')}
                  >
                    <Navigation className="w-4 h-4 text-amber-500" />
                    <span className="flex-1 text-left">Live Field Tracking</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      LIVE
                    </span>
                  </button>
                </div>
              )}

              {/* Accounting & Finance */}
              {canAccessModule('finance') && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Finance & Accounts
                  </div>
                  <button
                    onClick={() => navigateTo('finance')}
                    className={navItemClass(activeView === 'finance')}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Invoices & Tally Sync</span>
                  </button>
                </div>
              )}

              {/* HRMS */}
              {canAccessModule('hrms') && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Human Resources
                  </div>
                  <button
                    onClick={() => navigateTo('hrms')}
                    className={navItemClass(activeView === 'hrms')}
                  >
                    <UserSquare2 className="w-4 h-4" />
                    <span>Team, Attendance & GPS</span>
                  </button>
                </div>
              )}

              {/* Service & AMC */}
              {canAccessModule('service') && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Post-Commissioning
                  </div>
                  <button
                    onClick={() => navigateTo('service')}
                    className={navItemClass(activeView === 'service')}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Service & AMC Tickets</span>
                  </button>
                </div>
              )}

              {/* Reports */}
              {canAccessModule('reports') && (
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      if (!reportsOpen) setReportsOpen(true);
                      openReport(activeReportCategory || 'sales');
                    }}
                    className={parentNavItemClass(
                      activeView === 'reports',
                      false
                    )}
                  >
                    
                      <div className="flex items-center justify-between py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors select-none">
                      <span>Reports</span>
                      </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportsOpen(!reportsOpen);
                      }}
                      className="p-0.5 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
                      aria-label="Toggle Reports menu"
                    >
                      {reportsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {reportsOpen && (
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          openReport('sales');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'sales')}
                      >
                        <span>Sales Report</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('purchase');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'purchase')}
                      >
                        <span>Purchase Report</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('product_stock');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'product_stock')}
                      >
                        <span>Product Stock Report</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('customer_ledger');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'customer_ledger')}
                      >
                        <span>Customer Ledger</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('vendor_ledger');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'vendor_ledger')}
                      >
                        <span>Vendor Ledger</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('income_summary');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'income_summary')}
                      >
                        <span>Income Summary</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('expense_summary');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'expense_summary')}
                      >
                        <span>Expense Summary</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('payroll');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'payroll')}
                      >
                        <span>Payroll Report</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('monthly_attendance');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'monthly_attendance')}
                      >
                        <span>Monthly Attendance</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('leads');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'leads')}
                      >
                        <span>Leads Report</span>
                      </button>
                      <button
                        onClick={() => {
                          openReport('projects');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'reports' && activeReportCategory === 'projects')}
                      >
                        <span>Project Report</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* System Settings & Tally */}
              {canAccessModule('settings') && (
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      openSettingsTab(activeSettingsTab || 'general');
                      onCloseMobile();
                    }}
                    className={`cursor-pointer flex items-center justify-between ${navItemClass(activeView === 'settings')}`}
                  >
                    
                      <div className="flex items-center justify-between py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors select-none">
                      <span>System Settings & Tally</span>
                   
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsOpen(!settingsOpen);
                      }}
                      className="p-0.5 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
                      aria-label="Toggle Settings menu"
                    >
                      {settingsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {settingsOpen && (
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          openSettingsTab('general');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'settings' && activeSettingsTab === 'general')}
                      >
                        <span>General & EPC Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          openSettingsTab('tally');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'settings' && activeSettingsTab === 'tally')}
                      >
                        <span>Tally Prime Integration</span>
                      </button>
                      <button
                        onClick={() => {
                          openSettingsTab('whatsapp');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'settings' && activeSettingsTab === 'whatsapp')}
                      >
                        <span>WhatsApp Cloud API</span>
                      </button>
                      <button
                        onClick={() => {
                          openSettingsTab('acl');
                          onCloseMobile();
                        }}
                        className={subNavItemClass(activeView === 'settings' && activeSettingsTab === 'acl')}
                      >
                        <span>Role-Based Access Control</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User Management (Admin Only) */}
              {isAdmin && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Administration
                  </div>
                  <button
                    onClick={() => navigateTo('users')}
                    className={navItemClass(activeView === 'users')}
                  >
                    <Users className="w-4 h-4" />
                    <span>User Management</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Quick Info card at bottom of sidebar */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Firebase Auth</span>
              <span className="text-[10px] text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded font-medium">Active</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Session is secured with Firebase Auth. Operational permissions are enforced across all modules.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
