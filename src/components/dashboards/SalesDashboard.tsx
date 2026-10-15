import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { TodayAttendanceCard } from '../hrms/TodayAttendanceCard';
import {
  TrendingUp,
  UserCheck,
  UserX,
  Target,
  Plus,
  FileText,
  Phone,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  Search,
  CheckCircle2,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export const SalesDashboard: React.FC = () => {
  const { setActiveView, refreshTrigger, openCustomerControlCenter } = useApp();
  const { currentUser } = useAuth();

  const leads = useMemo(() => storageService.getLeads(), [refreshTrigger]);
  const customers = useMemo(() => storageService.getCustomers(), [refreshTrigger]);
  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);

  // Sales statistics
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'WON');
  const lostLeads = leads.filter(l => l.status === 'LOST');
  const activeLeads = leads.filter(l => !['WON', 'LOST'].includes(l.status));

  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0;

  // Filter today's follow-ups or pending follow-ups
  const todayStr = new Date().toISOString().split('T')[0];
  const followUps = useMemo(() => {
    return leads
      .filter(l => l.nextFollowUpDate || l.status === 'NEW' || l.status === 'PROPOSAL')
      .slice(0, 6);
  }, [leads]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Sales & CRM Pipeline Dashboard
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">{currentUser?.role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Solar Sales Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Track leads, commercial quotes, customer conversions, and site feasibility proposals across your sales pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveView('crm_leads')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Lead</span>
            </button>
            <button
              onClick={() => setActiveView('crm_quotations')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Quotations Builder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Attendance Punch Card */}
      <TodayAttendanceCard />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {activeLeads.length} <span className="text-xs font-bold text-slate-500">leads</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              In feasibility & proposal stage
            </p>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline Value</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              ₹{(pipelineValue / 100000).toFixed(1)} <span className="text-xs font-bold text-amber-600">Lakh</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Estimated project value
            </p>
          </div>
        </div>

        {/* Won Deals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deals Won</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {wonLeads.length} <span className="text-xs font-bold text-emerald-600">clients</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Transferred to Project execution
            </p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-700 tracking-tight">
              {conversionRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lostLeads.length} leads lost to competitor/dropped
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Follow-ups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Follow-ups</h3>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {followUps.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {followUps.map(lead => (
              <div
                key={lead.id}
                onClick={() => setActiveView('crm_leads')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {lead.customerName}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                    {lead.solarCapacityKw || '5'} kW
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{lead.city || 'Gujarat'} • {lead.phone}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Status: <strong className="text-slate-700">{lead.status}</strong></span>
                  <span className="text-blue-600 font-bold">Call / WhatsApp →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leads & Opportunities */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active CRM Pipeline</h3>
              <p className="text-xs text-slate-500">Recent customer inquiries and proposal status</p>
            </div>
            <button
              onClick={() => setActiveView('crm_leads')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View Full CRM →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Lead Name</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Budget</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {leads.slice(0, 6).map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{lead.customerName}</span>
                      <span className="text-[11px] text-slate-400">{lead.phone}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {lead.solarCapacityKw || 10} kWp
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.status === 'WON'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.status === 'PROPOSAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      ₹{((lead.estimatedValue || 450000) / 1000).toLocaleString('en-IN')}k
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setActiveView('crm_leads')}
                        className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
