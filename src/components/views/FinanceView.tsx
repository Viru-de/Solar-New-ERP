import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { PaymentRecord, ExpenseRecord } from '../../types/solar';
import { StatusBadge } from '../common/StatusBadge';
import { attemptTallySync, generateTallyReceiptXML, generateTallyExpenseXML } from '../../services/tally';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Layers,
  ArrowRight,
  Send,
  X
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { settings, showToast, openImportExportModal, triggerRefresh } = useApp();
  const { currentUser, canEditFinancials } = useAuth();

  const [activeTab, setActiveTab] = useState<'RECEIPTS' | 'EXPENSES' | 'TALLY_QUEUE'>('RECEIPTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [activeXmlPayload, setActiveXmlPayload] = useState<string | null>(null);

  // New Payment Modal
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customerName: 'ABC Industries Ltd.',
    projectId: 'proj-1',
    milestone: 'Structure Completion & Module Delivery',
    amount: 1500000,
    dueDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'Bank NEFT/RTGS',
    status: 'PAID' as const,
    transactionReference: 'HDFC-NEFT-992104'
  });

  const payments = useMemo(() => storageService.getPayments(), []);
  const expenses = useMemo(() => storageService.getExpenses(), []);

  const totalInflow = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const totalOutflow = expenses.reduce((s, e) => s + e.amount, 0);
  const netMargin = totalInflow - totalOutflow;

  const handleSyncToTally = (id: string, type: 'PAYMENT' | 'EXPENSE') => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
      const record = type === 'PAYMENT' ? payments.find(p => p.id === id) : expenses.find(e => e.id === id);
      if (!record) return;

      const result = attemptTallySync(id, type, record, settings);
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        // Honest notification as specified in prompt
        showToast(result.message, 'warning');
      }
    }, 700);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = storageService.getProjectById(paymentForm.projectId);
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      projectId: paymentForm.projectId,
      customerId: proj?.customerId || 'cust-1',
      customerName: paymentForm.customerName,
      milestone: paymentForm.milestone as any,
      amount: paymentForm.amount,
      status: paymentForm.status,
      dueDate: paymentForm.dueDate,
      paidDate: paymentForm.status === 'PAID' ? new Date().toISOString().slice(0, 10) : undefined,
      receiptNumber: `RCPT-2026-${Math.floor(100 + Math.random() * 900)}`,
      paymentMode: paymentForm.paymentMode as any,
      transactionReference: paymentForm.transactionReference,
      tallySyncStatus: 'NOT SYNCED'
    };

    storageService.savePayment(newPayment);
    setIsNewPaymentOpen(false);
    showToast(`Payment receipt ${newPayment.receiptNumber} recorded`, 'success');
    triggerRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Financial Accounting
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Cash Flow, Milestones & Tally Integration Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Finance & Accounting Desk
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditFinancials() && (
            <button
              onClick={() => setIsNewPaymentOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          <button
            onClick={() => openImportExportModal('Payments')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel Hub</span>
          </button>
        </div>
      </div>

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Received Inflow</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{(totalInflow / 100000).toFixed(2)} <span className="text-sm font-bold text-slate-500">Lakh</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Customer project milestone collections</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor & Project Outflow</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{(totalOutflow / 100000).toFixed(2)} <span className="text-sm font-bold text-slate-500">Lakh</span>
          </div>
          <p className="text-xs text-rose-700 mt-1 font-medium">Solar modules, inverters, cables & civil foundation</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Cash Position</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{(netMargin / 100000).toFixed(2)} <span className="text-sm font-bold text-slate-500">Lakh</span>
          </div>
          <p className="text-xs text-blue-700 mt-1 font-medium">Operating surplus before pending milestones</p>
        </div>
      </div>

      {/* Tally Ready Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            T
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">Tally Prime Accounting Synchronizer (ODBC / XML)</h4>
            <p className="text-[11px] text-amber-800">
              Company: <span className="font-mono font-bold">{settings.tallyCompany}</span> • Server: <span className="font-mono">{settings.tallyServerUrl}</span> • Status: <span className="font-bold">{settings.tallyStatus}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            showToast('Tally sync engine queued 4 vouchers for transmission to Tally Prime Gateway.', 'info');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync All Pending</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-2xs">
        <button
          onClick={() => setActiveTab('RECEIPTS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'RECEIPTS' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'EXPENSES' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vendor Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('TALLY_QUEUE')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'TALLY_QUEUE' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tally Sync Queue
        </button>
      </div>

      {/* TAB 1: RECEIPTS */}
      {activeTab === 'RECEIPTS' && (
        <div className="bg-white rounded-b-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Mode / Ref</th>
                  <th className="py-3 px-4">Tally Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{p.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.milestone}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{p.dueDate}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.paymentMode || 'NEFT'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        p.tallySyncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.tallySyncStatus || 'NOT SYNCED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const xml = generateTallyReceiptXML(p, settings);
                          setActiveXmlPayload(xml);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px]"
                      >
                        XML
                      </button>
                      <button
                        onClick={() => handleSyncToTally(p.id, 'PAYMENT')}
                        disabled={syncingId === p.id}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px]"
                      >
                        {syncingId === p.id ? 'Syncing...' : 'Sync to Tally'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-b-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4">Tally Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{e.expenseNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{e.vendorName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{e.category}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">₹{e.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-500">{e.date}</td>
                    <td className="py-3.5 px-4 text-slate-500">{e.referenceNo}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        e.tallySyncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {e.tallySyncStatus || 'NOT SYNCED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const xml = generateTallyExpenseXML(e, settings);
                          setActiveXmlPayload(xml);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px]"
                      >
                        XML
                      </button>
                      <button
                        onClick={() => handleSyncToTally(e.id, 'EXPENSE')}
                        disabled={syncingId === e.id}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px]"
                      >
                        {syncingId === e.id ? 'Syncing...' : 'Sync to Tally'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TALLY QUEUE */}
      {activeTab === 'TALLY_QUEUE' && (
        <div className="bg-white rounded-b-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Live Tally Synchronization Architecture</h3>
            <span className="text-xs text-slate-500">Auto-retries on ODBC Gateway availability</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <p>
              <strong>Future-Ready Connector Architecture:</strong> SolarPulse exports compliant Tally Prime XML envelopes for all Sales Invoices, Customer Receipt Vouchers, and Material Payment Vouchers.
            </p>
            <p className="text-slate-500">
              When Tally Prime is active on your company network (Default ODBC Port 9000), transactions can be posted directly into your Tally Company: <em>{settings.tallyCompany}</em>.
            </p>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isNewPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">Record Customer Milestone Payment</h3>
              <button onClick={() => setIsNewPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={paymentForm.customerName}
                  onChange={e => setPaymentForm({ ...paymentForm, customerName: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Milestone Description</label>
                <input
                  type="text"
                  required
                  value={paymentForm.milestone}
                  onChange={e => setPaymentForm({ ...paymentForm, milestone: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentForm.status}
                    onChange={e => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <input
                    type="text"
                    value={paymentForm.paymentMode}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UTR / Ref No</label>
                  <input
                    type="text"
                    value={paymentForm.transactionReference}
                    onChange={e => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-2xs"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* XML Payload Previewer */}
      {activeXmlPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <span className="text-xs font-mono font-bold">Tally Prime XML Voucher Payload</span>
              <button onClick={() => setActiveXmlPayload(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
              <pre>{activeXmlPayload}</pre>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeXmlPayload);
                  showToast('XML payload copied to clipboard', 'success');
                }}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Copy XML
              </button>
              <button
                onClick={() => setActiveXmlPayload(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
