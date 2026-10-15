import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  SunMedium,
  Layers,
  CreditCard,
  Wrench,
  ShoppingCart
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView } = useApp();
  const { isCustomer } = useAuth();

  const buttonClass = (isActive: boolean) =>
    `flex-1 flex flex-col items-center justify-center py-2 px-1 text-[11px] font-semibold transition-colors select-none min-h-[48px] ${
      isActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
    }`;

  if (isCustomer) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 flex items-center justify-around px-2 shadow-lg">
        <button
          onClick={() => setActiveView('customer_portal')}
          className={buttonClass(activeView === 'customer_portal')}
        >
          <SunMedium className="w-5 h-5 mb-0.5" />
          <span>My Project</span>
        </button>
        <button
          onClick={() => setActiveView('customer_control_center')}
          className={buttonClass(activeView === 'customer_control_center')}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setActiveView('service')}
          className={buttonClass(activeView === 'service')}
        >
          <Wrench className="w-5 h-5 mb-0.5" />
          <span>Support</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 flex items-center justify-around px-2 shadow-lg">
      <button
        onClick={() => setActiveView('dashboard')}
        className={buttonClass(activeView === 'dashboard')}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Overview</span>
      </button>

      <button
        onClick={() => setActiveView('crm_leads')}
        className={buttonClass(activeView === 'crm_leads')}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Leads</span>
      </button>

      <button
        onClick={() => setActiveView('sales_purchase')}
        className={buttonClass(activeView.startsWith('sales_') || activeView.startsWith('purchase_') || activeView.startsWith('inventory_') || activeView === 'sales_purchase')}
      >
        <ShoppingCart className="w-5 h-5 mb-0.5" />
        <span>Sales/PO</span>
      </button>

      {/* Prominent Center button for Customer Control Center */}
      <button
        onClick={() => setActiveView('customer_control_center')}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 transition-transform active:scale-95 ${
          activeView === 'customer_control_center' ? 'text-amber-600' : 'text-slate-600'
        }`}
      >
        <div className={`p-2 rounded-xl shadow-xs ${
          activeView === 'customer_control_center' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
        }`}>
          <Layers className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold mt-0.5">Control Hub</span>
      </button>

      <button
        onClick={() => setActiveView('projects_all')}
        className={buttonClass(activeView === 'projects_all')}
      >
        <SunMedium className="w-5 h-5 mb-0.5" />
        <span>Projects</span>
      </button>

      <button
        onClick={() => setActiveView('finance')}
        className={buttonClass(activeView === 'finance')}
      >
        <CreditCard className="w-5 h-5 mb-0.5" />
        <span>Finance</span>
      </button>
    </nav>
  );
};
