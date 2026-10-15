import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { TodayAttendanceCard } from '../hrms/TodayAttendanceCard';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Database
} from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { setActiveView, refreshTrigger, openCustomerControlCenter, showToast } = useApp();
  const { currentUser } = useAuth();

  const payments = useMemo(() => storageService.getPayments(), [refreshTrigger]);
  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);

  const totalInvoiced = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter(p => p.status !== 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleSyncTally = () => {
    showToast('Tally Prime ODBC sync triggered. 14 vouchers pushed to ledger queue.', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Finance & Billing Operations
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">Accountant Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Finance, GST Invoicing & Tally Prime
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Track milestone payment receipts, generate GST sales tax invoices, manage vendor payable vouchers, and monitor direct Tally Prime synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncTally}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/25 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync with Tally Prime</span>
            </button>
            <button
              onClick={() => setActiveView('finance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Full Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Attendance Punch Card */}
      <TodayAttendanceCard />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{(totalInvoiced / 100000).toFixed(2)} <span className="text-xs font-bold text-slate-500">Lakh</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{payments.length} billing milestones</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              ₹{(totalPaid / 100000).toFixed(2)} <span className="text-xs font-bold text-emerald-600">Lakh</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Realized in bank accounts</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Dues</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              ₹{(totalPending / 100000).toFixed(2)} <span className="text-xs font-bold text-amber-600">Lakh</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Awaiting customer clearance</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tally Prime Status</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-emerald-600 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Synchronized</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">ODBC Port 9000 connected</p>
          </div>
        </div>
      </div>

      {/* Recent Payments Ledger */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Payment Receipts & Milestones</h3>
            <p className="text-xs text-slate-500">Live feed of advance, stage, and final solar project payments</p>
          </div>
          <button
            onClick={() => setActiveView('finance')}
            className="text-xs font-bold text-rose-600 hover:text-rose-700"
          >
            View Finance Module →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">Milestone Stage</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payments.slice(0, 6).map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {pay.milestone || 'Advance Booking'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    ₹{pay.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {pay.paidDate || pay.dueDate}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {pay.paymentMode || 'Bank NEFT/RTGS'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pay.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
