import React, { useMemo } from 'react';
import { ExpenseRecord, SolarProject } from '../../types/solar';
import { ReportFilterState, ReportCategoryMeta } from '../../types/reports';
import { exportToCSV } from '../../services/exportImport';
import { ReportFilterBar } from './ReportFilterBar';
import { Receipt, PieChart as PieIcon, Layers, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const CHART_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6'
];

interface ExpenseSummaryReportProps {
  expenses: ExpenseRecord[];
  projects: SolarProject[];
  filters: ReportFilterState;
  onFilterChange: (updated: Partial<ReportFilterState>) => void;
  onFilterReset: () => void;
  meta: ReportCategoryMeta;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ExpenseSummaryReport: React.FC<ExpenseSummaryReportProps> = ({
  expenses,
  projects,
  filters,
  onFilterChange,
  onFilterReset,
  meta,
  showToast
}) => {
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach(p => map.set(p.id, p.title));
    return map;
  }, [projects]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Date filter
      if (filters.fromDate && exp.date < filters.fromDate) return false;
      if (filters.toDate && exp.date > filters.toDate) return false;

      // Name / Vendor / Ref filter
      if (filters.name.trim()) {
        const query = filters.name.toLowerCase();
        const matchesVendor = (exp.vendorName || '').toLowerCase().includes(query);
        const matchesInvoice = (exp.expenseNumber || exp.referenceNo || '').toLowerCase().includes(query);
        const matchesPaidBy = (exp.approvedBy || '').toLowerCase().includes(query);
        const matchesNotes = (exp.notes || '').toLowerCase().includes(query);
        const projName = exp.projectId ? (projectMap.get(exp.projectId) || '').toLowerCase() : '';
        if (!matchesVendor && !matchesInvoice && !matchesPaidBy && !matchesNotes && !projName.includes(query)) {
          return false;
        }
      }

      // Status / Category filter
      if (filters.status && filters.status !== 'ALL') {
        if (exp.category !== filters.status) return false;
      }

      return true;
    });
  }, [expenses, filters, projectMap]);

  // Aggregate KPIs
  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const tallySyncedAmount = filteredExpenses
    .filter(e => e.tallySyncStatus === 'SYNCED')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const materialExpenses = filteredExpenses
    .filter(e => e.category.toLowerCase().includes('material') || e.category.toLowerCase().includes('steel'))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Category breakdown for chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, { category: string; amount: number; count: number }> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'General';
      if (!map[cat]) map[cat] = { category: cat, amount: 0, count: 0 };
      map[cat].amount += e.amount || 0;
      map[cat].count += 1;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const expenseShareData = useMemo(() => {
    return categoryChartData
      .map(d => ({ name: d.category, value: d.amount }))
      .filter(d => d.value > 0);
  }, [categoryChartData]);

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Expense Category',
      'Vendor / Payee',
      'Expense Voucher #',
      'Reference No',
      'Project',
      'Payment Mode',
      'Amount (INR)',
      'Tally Synced',
      'Notes'
    ];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.category,
      e.vendorName || 'N/A',
      e.expenseNumber || 'N/A',
      e.referenceNo || 'N/A',
      (e.projectId && projectMap.get(e.projectId)) || e.projectCode || 'General',
      e.paymentMode || 'N/A',
      e.amount,
      e.tallySyncStatus === 'SYNCED' ? 'Yes' : 'No',
      e.notes || ''
    ]);
    exportToCSV(`SolarPulse_Expense_Summary_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('Expense summary exported to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      <ReportFilterBar
        filters={filters}
        onChange={onFilterChange}
        onReset={onFilterReset}
        onExportCSV={handleExportCSV}
        onPrint={() => window.print()}
        categoryMeta={meta}
        totalCount={expenses.length}
        filteredCount={filteredExpenses.length}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Expenses</span>
            <span className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            ₹{totalExpenseAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {filteredExpenses.length} expense vouchers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Direct Solar Materials</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            ₹{materialExpenses.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {totalExpenseAmount > 0
              ? `${((materialExpenses / totalExpenseAmount) * 100).toFixed(1)}% of total outflows`
              : '0%'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Top Cost Driver</span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <PieIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 truncate">
            {categoryChartData[0]?.category || 'N/A'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
            ₹{(categoryChartData[0]?.amount || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tally Synced Expenses</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{tallySyncedAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Posted to accounting journals</p>
        </div>
      </div>

      {/* Donut Chart: Category Expense Share */}
      {expenseShareData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Expense Category Share</h3>
          <p className="text-xs text-slate-500 mb-4">Proportion of organizational capital outflow across cost centers</p>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseShareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expenseShareData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Expense Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expense Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Project Expense Outflow Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">Line-item expenses with vendor vouchers and project links</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {filteredExpenses.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Tally Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No expenses found matching the selected filters</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{e.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{e.vendorName || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[170px]">
                      {(e.projectId && projectMap.get(e.projectId)) || e.projectCode || 'General'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{e.expenseNumber || e.referenceNo || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{e.paymentMode || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{e.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-bold ${
                          e.tallySyncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {e.tallySyncStatus}
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
