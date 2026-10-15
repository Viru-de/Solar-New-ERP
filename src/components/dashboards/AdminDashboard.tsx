import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { liveLocationService } from '../../services/liveLocationService';
import { LiveEmployeeLocation } from '../../types/tracking';
import {
  SunMedium,
  Zap,
  TrendingUp,
  CreditCard,
  Layers,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Sparkles,
  Navigation,
  Users,
  Shield,
  Briefcase,
  FileText,
  DollarSign,
  Activity,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { openCustomerControlCenter, setActiveView, setStageFilterKey, openImportExportModal, refreshTrigger } = useApp();
  const { currentUser } = useAuth();

  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);
  const leads = useMemo(() => storageService.getLeads(), [refreshTrigger]);
  const payments = useMemo(() => storageService.getPayments(), [refreshTrigger]);
  const serviceTickets = useMemo(() => storageService.getServiceTickets(), [refreshTrigger]);
  const activities = useMemo(() => storageService.getRecentActivities(8), [refreshTrigger]);
  const employees = useMemo(() => storageService.getEmployees(), [refreshTrigger]);

  // Compute metrics
  const totalCapacityKw = projects.reduce((sum, p) => sum + p.capacityKw, 0);
  const totalProjectValue = projects.reduce((sum, p) => sum + p.totalValue, 0);
  const totalCollected = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPendingCollection = payments
    .filter(p => p.status !== 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeLeadsCount = leads.filter(l => !['WON', 'LOST'].includes(l.status)).length;
  const openTicketsCount = serviceTickets.filter(s => s.status !== 'RESOLVED').length;

  // Live Field Workforce tracking statistics (live subscription)
  const [liveLocations, setLiveLocations] = useState<LiveEmployeeLocation[]>(() =>
    liveLocationService.getLocations()
  );

  useEffect(() => {
    const unsub = liveLocationService.subscribe((locs) => {
      setLiveLocations(locs);
    });
    return () => unsub();
  }, []);

  const liveStats = useMemo(() => {
    const online = liveLocations.filter((l) => l.isOnline).length;
    const moving = liveLocations.filter((l) => l.isOnline && l.status === 'moving').length;
    const idle = liveLocations.filter((l) => l.isOnline && l.status === 'idle').length;
    return { online, moving, idle, total: liveLocations.length };
  }, [liveLocations]);

  // Pipeline stage breakdown
  const stageDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'Survey': 0,
      'Procurement': 0,
      'Civil/Struct': 0,
      'Installation': 0,
      'Electrical': 0,
      'Net Metering': 0,
      'Commissioned': 0
    };

    projects.forEach(p => {
      const stage = p.currentStageKey;
      if (stage === 'site_survey') counts['Survey']++;
      else if (stage === 'customer_confirmation') counts['Procurement']++;
      else if (stage === 'civil_work' || stage === 'structure_fabrication') counts['Civil/Struct']++;
      else if (stage === 'solar_installation') counts['Installation']++;
      else if (
        stage === 'ac_side_electrical' ||
        stage === 'inverter_installation' ||
        stage === 'acdb_dcdb_fixing' ||
        stage === 'earthing_pits' ||
        stage === 'lightning_arrestor' ||
        stage === 'cdc_earthing'
      ) counts['Electrical']++;
      else if (stage === 'meter_synchronisation' || stage === 'inverter_wifi_pairing') counts['Net Metering']++;
      else if (stage === 'final_verification' || stage === 'final_handover' || stage === 'service_amc') counts['Commissioned']++;
      else counts['Procurement']++;
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [projects]);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Master Administration Control Center
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">Rejoy Solar EPC ERP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {currentUser?.name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Overall system status: <span className="text-emerald-400 font-bold">{projects.length} solar projects active</span>, {liveStats.online} field engineers in real-time dispatch, and ₹{(totalProjectValue / 100000).toFixed(1)}L order book.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveView('live_tracking')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Live Field Tracking</span>
            </button>
            <button
              onClick={() => setActiveView('users')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Installed Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <SunMedium className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalCapacityKw.toFixed(1)} <span className="text-xs font-bold text-slate-500">kWp</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> {projects.length}
              </span>
              <span>total solar installations</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              ₹{(totalCollected / 100000).toFixed(2)} <span className="text-xs font-bold text-emerald-600">Lakh</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-amber-600 font-bold">
                ₹{(totalPendingCollection / 100000).toFixed(2)}L
              </span>
              <span>pending collections</span>
            </div>
          </div>
        </div>

        {/* Active CRM Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active CRM Leads</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {activeLeadsCount} <span className="text-xs font-bold text-slate-500">leads</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-blue-600 font-bold">{leads.filter(l => l.status === 'WON').length} converted</span>
              <span>• {leads.length} total</span>
            </div>
          </div>
        </div>

        {/* Live Field Personnel Online */}
        <div
          onClick={() => setActiveView('live_tracking')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Personnel</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Navigation className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 tracking-tight flex items-center gap-2">
              <span>{liveStats.online}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Online
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between font-medium">
              <span>{liveStats.moving} moving • {liveStats.idle} on-site</span>
              <span className="text-amber-600 font-bold flex items-center text-[11px]">
                Map <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Field Workforce Tracking Banner / Widget */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  Realtime Field Workforce Tracking
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Pusher Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live GPS telemetry for site survey engineers, civil, structure, electrical and installation teams.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('live_tracking')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <span>Open Tracking Center</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Active Field Workers Horizontal Reel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {liveLocations.slice(0, 4).map((worker) => (
            <div
              key={worker.userId}
              onClick={() => setActiveView('live_tracking')}
              className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {worker.name}
                </span>
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    worker.status === 'moving'
                      ? 'bg-blue-100 text-blue-800'
                      : worker.status === 'online'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {worker.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {worker.role}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{worker.assignedProjectTitle || 'Assigned to Field'}</span>
                <span>{worker.speed ? `${worker.speed} km/h` : 'Stationary'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access to All ERP Modules */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Quick Access to System Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveView('crm_leads')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900">CRM & Leads</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pipeline & Quotes</div>
          </button>

          <button
            onClick={() => setActiveView('projects_all')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900">Solar Projects</div>
            <div className="text-[10px] text-slate-400 mt-0.5">14-Stage Execution</div>
          </button>

          <button
            onClick={() => setActiveView('sales_purchase')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900">Inventory & BOM</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Vendors & Stock</div>
          </button>

          <button
            onClick={() => setActiveView('finance')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900">Finance & Tally</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Invoices & Receipts</div>
          </button>

          <button
            onClick={() => setActiveView('hrms')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900">HRMS & Attendance</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Payroll & Staff</div>
          </button>

          <button
            onClick={() => setActiveView('users')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-900">User Management</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Roles & Accounts</div>
          </button>
        </div>
      </div>

      {/* Charts and Stage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">EPC Stage Distribution</h3>
              <p className="text-xs text-slate-500">Current progress of solar project pipeline</p>
            </div>
            <button
              onClick={() => setActiveView('projects_all')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              View Projects →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">System Activity Feed</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="space-y-3.5">
            {activities.slice(0, 5).map(act => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">
                    {act.action}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {act.details || 'System event'}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
