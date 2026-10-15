import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import { ReportCategory, REPORT_CATEGORIES, ReportFilterState } from '../../types/reports';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Receipt,
  ShoppingCart,
  Boxes,
  Users,
  Building2,
  DollarSign,
  Wallet,
  CalendarCheck,
  Target,
  Sun
} from 'lucide-react';

import { SalesReport } from '../reports/SalesReport';
import { PurchaseReport } from '../reports/PurchaseReport';
import { ProductStockReport } from '../reports/ProductStockReport';
import { CustomerLedgerReport } from '../reports/CustomerLedgerReport';
import { VendorLedgerReport } from '../reports/VendorLedgerReport';
import { IncomeSummaryReport } from '../reports/IncomeSummaryReport';
import { ExpenseSummaryReport } from '../reports/ExpenseSummaryReport';
import { PayrollReport } from '../reports/PayrollReport';
import { MonthlyAttendanceReport } from '../reports/MonthlyAttendanceReport';
import { LeadsReport } from '../reports/LeadsReport';
import { ProjectReport } from '../reports/ProjectReport';

export const ReportsView: React.FC = () => {
  const { showToast, refreshTrigger, activeReportCategory, setActiveReportCategory } = useApp();

  // Consistent filter state across reporting center
  const [filters, setFilters] = useState<ReportFilterState>({
    fromDate: '',
    toDate: '',
    name: '',
    status: 'ALL'
  });

  const handleFilterChange = (updated: Partial<ReportFilterState>) => {
    setFilters(prev => ({ ...prev, ...updated }));
  };

  const handleFilterReset = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      name: '',
      status: 'ALL'
    });
    showToast('Filters reset to default', 'info');
  };

  // Change active category and reset status filter to ALL to prevent mismatched filters
  const handleSelectCategory = (cat: ReportCategory) => {
    setActiveReportCategory(cat);
    setFilters(prev => ({ ...prev, status: 'ALL' }));
  };

  // Data fetching from central storageService
  const salesInvoices = useMemo(() => storageService.getSalesInvoices(), [refreshTrigger]);
  const purchaseOrders = useMemo(() => storageService.getPurchaseOrders(), [refreshTrigger]);
  const products = useMemo(() => storageService.getProducts(), [refreshTrigger]);
  const customers = useMemo(() => storageService.getCustomers(), [refreshTrigger]);
  const vendors = useMemo(() => storageService.getVendors(), [refreshTrigger]);
  const payments = useMemo(() => storageService.getPayments(), [refreshTrigger]);
  const expenses = useMemo(() => storageService.getExpenses(), [refreshTrigger]);
  const payslips = useMemo(() => storageService.getPayslips(), [refreshTrigger]);
  const attendance = useMemo(() => storageService.getAttendance(), [refreshTrigger]);
  const employees = useMemo(() => storageService.getEmployees(), [refreshTrigger]);
  const leads = useMemo(() => storageService.getLeads(), [refreshTrigger]);
  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);

  const currentMeta = useMemo(() => {
    return REPORT_CATEGORIES.find(c => c.id === activeReportCategory) || REPORT_CATEGORIES[0];
  }, [activeReportCategory]);

  const getCategoryIcon = (id: ReportCategory) => {
    switch (id) {
      case 'sales':
        return <DollarSign className="w-3.5 h-3.5" />;
      case 'purchase':
        return <ShoppingCart className="w-3.5 h-3.5" />;
      case 'product_stock':
        return <Boxes className="w-3.5 h-3.5" />;
      case 'customer_ledger':
        return <Users className="w-3.5 h-3.5" />;
      case 'vendor_ledger':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'income_summary':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'expense_summary':
        return <Receipt className="w-3.5 h-3.5" />;
      case 'payroll':
        return <Wallet className="w-3.5 h-3.5" />;
      case 'monthly_attendance':
        return <CalendarCheck className="w-3.5 h-3.5" />;
      case 'leads':
        return <Target className="w-3.5 h-3.5" />;
      case 'projects':
        return <Sun className="w-3.5 h-3.5" />;
      default:
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reporting Center</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{currentMeta.label}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            {currentMeta.label}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{currentMeta.description}</p>
        </div>

        {/* Global summary count badges */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Invoices: </span>
            <span className="font-bold text-slate-900">{salesInvoices.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">POs: </span>
            <span className="font-bold text-slate-900">{purchaseOrders.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Clients: </span>
            <span className="font-bold text-slate-900">{customers.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Projects: </span>
            <span className="font-bold text-slate-900">{projects.length}</span>
          </div>
        </div>
      </div>

      {/* 11 Reports Navigation Pill Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {REPORT_CATEGORIES.map(cat => {
            const isActive = activeReportCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Report Component */}
      <div>
        {activeReportCategory === 'sales' && (
          <SalesReport
            invoices={salesInvoices}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'purchase' && (
          <PurchaseReport
            orders={purchaseOrders}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'product_stock' && (
          <ProductStockReport
            products={products}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'customer_ledger' && (
          <CustomerLedgerReport
            customers={customers}
            invoices={salesInvoices}
            payments={payments}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'vendor_ledger' && (
          <VendorLedgerReport
            vendors={vendors}
            purchaseOrders={purchaseOrders}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'income_summary' && (
          <IncomeSummaryReport
            payments={payments}
            customers={customers}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'expense_summary' && (
          <ExpenseSummaryReport
            expenses={expenses}
            projects={projects}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'payroll' && (
          <PayrollReport
            payslips={payslips}
            employees={employees}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'monthly_attendance' && (
          <MonthlyAttendanceReport
            attendance={attendance}
            employees={employees}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'leads' && (
          <LeadsReport
            leads={leads}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}

        {activeReportCategory === 'projects' && (
          <ProjectReport
            projects={projects}
            customers={customers}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            meta={currentMeta}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
};
