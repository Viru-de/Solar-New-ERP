import React, { useMemo } from 'react';
import { SalesInvoice } from '../../types/solar';
import { ReportFilterState, ReportCategoryMeta } from '../../types/reports';
import { exportToCSV } from '../../services/exportImport';
import { ReportFilterBar } from './ReportFilterBar';
import { DollarSign, FileText, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const CHART_COLORS = [
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#e11d48'
];

interface SalesReportProps {
  invoices: SalesInvoice[];
  filters: ReportFilterState;
  onFilterChange: (updated: Partial<ReportFilterState>) => void;
  onFilterReset: () => void;
  meta: ReportCategoryMeta;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SalesReport: React.FC<SalesReportProps> = ({
  invoices,
  filters,
  onFilterChange,
  onFilterReset,
  meta,
  showToast
}) => {
  // Apply filters: fromDate, toDate, name (customer/invoice#/project), status
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Date filter
      if (filters.fromDate && inv.invoiceDate < filters.fromDate) return false;
      if (filters.toDate && inv.invoiceDate > filters.toDate) return false;

      // Name filter
      if (filters.name.trim()) {
        const query = filters.name.toLowerCase();
        const matchesCustomer = inv.customerName.toLowerCase().includes(query);
        const matchesNumber = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesProject = (inv.projectTitle || '').toLowerCase().includes(query);
        if (!matchesCustomer && !matchesNumber && !matchesProject) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (inv.status !== filters.status) return false;
      }

      return true;
    });
  }, [invoices, filters]);

  // Aggregate KPIs
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalSubtotal = filteredInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
  const totalTax = filteredInvoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);
  const paidSales = filteredInvoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const outstandingSales = filteredInvoices
    .filter(inv => inv.status === 'ISSUED' || inv.status === 'DRAFT')
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  // Chart data: Monthly Sales
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; total: number; count: number }> = {};
    filteredInvoices.forEach(inv => {
      const month = inv.invoiceDate.slice(0, 7) || 'Current';
      if (!map[month]) map[month] = { month, total: 0, count: 0 };
      map[month].total += inv.totalAmount || 0;
      map[month].count += 1;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredInvoices]);

  const monthlyRevenueShare = useMemo(() => {
    return monthlyData
      .map(d => ({ name: d.month, value: d.total }))
      .filter(d => d.value > 0);
  }, [monthlyData]);

  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Customer Name',
      'Project Title',
      'Type',
      'Subtotal (INR)',
      'GST Tax (INR)',
      'Total Amount (INR)',
      'Due Date',
      'Status'
    ];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.invoiceDate,
      inv.customerName,
      inv.projectTitle || 'N/A',
      inv.invoiceType,
      inv.subtotal,
      inv.taxAmount,
      inv.totalAmount,
      inv.dueDate,
      inv.status
    ]);
    exportToCSV(`SolarPulse_Sales_Report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('Sales report exported to CSV', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: SalesInvoice['status']) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ISSUED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <ReportFilterBar
        filters={filters}
        onChange={onFilterChange}
        onReset={onFilterReset}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        categoryMeta={meta}
        totalCount={invoices.length}
        filteredCount={filteredInvoices.length}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Sales Invoiced</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalSales.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Across {filteredInvoices.length} billing vouchers
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Paid / Realized</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{paidSales.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {totalSales > 0 ? `${((paidSales / totalSales) * 100).toFixed(1)}% collected` : '0%'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Receivables</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            ₹{outstandingSales.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Issued & awaiting customer clearance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">GST Tax Collected</span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            ₹{totalTax.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Net base: ₹{totalSubtotal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Donut Chart: Monthly Invoiced Revenue Share */}
      {monthlyRevenueShare.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Monthly Invoiced Revenue Share</h3>
          <p className="text-xs text-slate-500 mb-4">Proportional distribution of billing value in INR across months</p>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={monthlyRevenueShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {monthlyRevenueShare.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Invoiced Value']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sales Invoices Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">Complete record of tax and proforma invoices</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {filteredInvoices.length} Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No sales invoices found matching your filters</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try broadening your date range or search keyword</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {inv.invoiceNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">{inv.invoiceType}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{inv.invoiceDate}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {inv.customerName}
                      {inv.customerGst && (
                        <span className="block text-[10px] text-slate-400 font-normal">GST: {inv.customerGst}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[180px]">
                      {inv.projectTitle || 'General EPC Billing'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      ₹{inv.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      ₹{inv.taxAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
