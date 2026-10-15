import React, { useMemo } from 'react';
import { Payslip, Employee } from '../../types/solar';
import { ReportFilterState, ReportCategoryMeta } from '../../types/reports';
import { exportToCSV } from '../../services/exportImport';
import { ReportFilterBar } from './ReportFilterBar';
import { Wallet, Users, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const CHART_COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#e11d48'
];

interface PayrollReportProps {
  payslips: Payslip[];
  employees: Employee[];
  filters: ReportFilterState;
  onFilterChange: (updated: Partial<ReportFilterState>) => void;
  onFilterReset: () => void;
  meta: ReportCategoryMeta;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PayrollReport: React.FC<PayrollReportProps> = ({
  payslips,
  employees,
  filters,
  onFilterChange,
  onFilterReset,
  meta,
  showToast
}) => {
  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  const filteredPayslips = useMemo(() => {
    return payslips.filter(ps => {
      const emp = employeeMap.get(ps.employeeId);
      const dateVal = ps.paymentDate || ps.generatedDate || `${ps.month}-01`;

      // Date filter
      if (filters.fromDate && dateVal < filters.fromDate) return false;
      if (filters.toDate && dateVal > filters.toDate) return false;

      // Name / Code / Dept filter
      if (filters.name.trim()) {
        const query = filters.name.toLowerCase();
        const empName = (ps.employeeName || emp?.name || '').toLowerCase();
        const empCode = (ps.employeeCode || emp?.employeeCode || '').toLowerCase();
        const dept = (ps.department || emp?.department || '').toLowerCase();
        if (!empName.includes(query) && !empCode.includes(query) && !dept.includes(query)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (ps.status !== filters.status) return false;
      }

      return true;
    });
  }, [payslips, filters, employeeMap]);

  // Aggregate KPIs
  const totalNetDisbursed = filteredPayslips
    .filter(ps => ps.status === 'PAID')
    .reduce((sum, ps) => sum + (ps.netPay || 0), 0);
  const totalPayrollCommitment = filteredPayslips.reduce((sum, ps) => sum + (ps.netPay || 0), 0);
  const totalDeductions = filteredPayslips.reduce((sum, ps) => sum + (ps.totalDeductions || 0), 0);
  const pendingDisbursements = filteredPayslips
    .filter(ps => ps.status !== 'PAID')
    .reduce((sum, ps) => sum + (ps.netPay || 0), 0);

  // Department-wise payroll aggregation
  const deptData = useMemo(() => {
    const map: Record<string, { department: string; net: number; count: number }> = {};
    filteredPayslips.forEach(ps => {
      const dept = ps.department || 'Operations';
      if (!map[dept]) map[dept] = { department: dept, net: 0, count: 0 };
      map[dept].net += ps.netPay || 0;
      map[dept].count += 1;
    });
    return Object.values(map).sort((a, b) => b.net - a.net);
  }, [filteredPayslips]);

  const deptPayrollShare = useMemo(() => {
    return deptData
      .map(d => ({ name: d.department, value: d.net }))
      .filter(d => d.value > 0);
  }, [deptData]);

  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Payslip #',
      'Employee Code',
      'Employee Name',
      'Department',
      'Base Salary (INR)',
      'Overtime & Allowances (INR)',
      'Deductions (INR)',
      'Net Pay (INR)',
      'Status',
      'Payment Date',
      'Bank Reference'
    ];
    const rows = filteredPayslips.map(ps => [
      ps.month,
      ps.payslipNumber,
      ps.employeeCode,
      ps.employeeName,
      ps.department,
      ps.baseSalary,
      (ps.overtimeAmount || 0) + (ps.totalAdditionalExpenses || 0),
      ps.totalDeductions,
      ps.netPay,
      ps.status,
      ps.paymentDate || 'N/A',
      ps.bankReferenceNo || 'N/A'
    ]);
    exportToCSV(`SolarPulse_Payroll_Report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('Payroll report exported to CSV', 'success');
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
        totalCount={payslips.length}
        filteredCount={filteredPayslips.length}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Disbursed</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{totalNetDisbursed.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Cleared employee bank transfers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Salaries</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            ₹{pendingDisbursements.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Generated payslips awaiting payout</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Statutory Deductions</span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            ₹{totalDeductions.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">PF, PT and tax deductions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Payroll Commitment</span>
            <span className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalPayrollCommitment.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {filteredPayslips.length} generated statements</p>
        </div>
      </div>

      {/* Donut Chart: Department Payroll Share */}
      {deptPayrollShare.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Department Payroll Share</h3>
          <p className="text-xs text-slate-500 mb-4">Proportion of net compensation distributed across organizational divisions</p>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptPayrollShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {deptPayrollShare.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Net Payroll']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Salary Statements Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive employee compensation records</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {filteredPayslips.length} Statements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-4">Cycle Month</th>
                <th className="py-3 px-4">Payslip #</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Basic (₹)</th>
                <th className="py-3 px-4 text-right">Allowances (₹)</th>
                <th className="py-3 px-4 text-right">Deductions (₹)</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Bank Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No payroll statements found matching filters</p>
                  </td>
                </tr>
              ) : (
                filteredPayslips.map(ps => (
                  <tr key={ps.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{ps.month}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{ps.payslipNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {ps.employeeName}
                      <span className="block text-[10px] text-slate-400 font-normal">{ps.employeeCode}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{ps.department}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      ₹{ps.baseSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      ₹{((ps.overtimeAmount || 0) + (ps.totalAdditionalExpenses || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                      ₹{ps.totalDeductions.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      ₹{ps.netPay.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          ps.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ps.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {ps.bankReferenceNo || '-'}
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
