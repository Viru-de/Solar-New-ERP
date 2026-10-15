import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { TodayAttendanceCard } from '../hrms/TodayAttendanceCard';
import {
  Layers,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Zap,
  Wrench
} from 'lucide-react';

export const ProjectDashboard: React.FC = () => {
  const { setActiveView, setStageFilterKey, openCustomerControlCenter, refreshTrigger } = useApp();
  const { currentUser } = useAuth();

  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);
  const employees = useMemo(() => storageService.getEmployees(), [refreshTrigger]);

  // Project statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status !== 'COMPLETED');
  const totalCapacity = projects.reduce((sum, p) => sum + p.capacityKw, 0);

  // Stages breakdown
  const delayedProjects = useMemo(() => {
    return projects.filter(p => {
      return (
        p.currentStageKey === 'site_survey' ||
        p.currentStageKey === 'civil_work' ||
        p.currentStageKey === 'inverter_installation' ||
        p.currentStageKey === 'ac_side_electrical'
      );
    }).slice(0, 4);
  }, [projects]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Operations & EPC Delivery
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">Project Manager Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Project Execution & Milestone Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Supervise 14-stage EPC milestones, approve engineering checklists, allocate civil/electrical teams, and ensure on-time DISCOM net metering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveView('projects_all')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>All Projects List</span>
            </button>
            <button
              onClick={() => setActiveView('live_tracking')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Track Field Teams</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Attendance Punch Card */}
      <TodayAttendanceCard />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Projects</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {activeProjects.length} <span className="text-xs font-bold text-slate-500">sites</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Under active physical execution
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Capacity</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700 tracking-tight">
              {totalCapacity.toFixed(1)} <span className="text-xs font-bold text-blue-600">kWp</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Commercial & rooftop installations
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stage Blockers</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700 tracking-tight">
              {delayedProjects.length} <span className="text-xs font-bold text-rose-600">alerts</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Requires engineer sign-off
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Specialists</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {employees.filter(e => e.isFieldWorker).length} <span className="text-xs font-bold text-emerald-600">staff</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Civil, Electrical & Survey crews
            </p>
          </div>
        </div>
      </div>

      {/* Projects in Progress Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current EPC Stage Pipeline</h3>
              <p className="text-xs text-slate-500">Live progress across rooftop and ground-mounted sites</p>
            </div>
            <button
              onClick={() => setActiveView('projects_all')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              View All Projects →
            </button>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 5).map(proj => (
              <div
                key={proj.id}
                onClick={() => openCustomerControlCenter(proj.customerId, proj.id)}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{proj.title}</span>
                    <span className="text-[11px] text-slate-500">{proj.customerName} • {proj.capacityKw} kWp</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                    Stage: {proj.currentStageKey.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, proj.completionPercentage || proj.progressPercentage || 25)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delayed / Action Required Milestones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Attention Required</h3>
            </div>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
              Needs Review
            </span>
          </div>

          <div className="space-y-3">
            {delayedProjects.map(proj => (
              <div
                key={proj.id}
                onClick={() => openCustomerControlCenter(proj.customerId, proj.id)}
                className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 hover:border-amber-400 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{proj.title}</span>
                  <span className="text-[10px] font-bold text-amber-700">Action</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Pending stage milestone verification for {proj.currentStageKey.replace(/_/g, ' ')}
                </p>
                <div className="mt-2 text-right">
                  <span className="text-[11px] font-bold text-amber-700 hover:underline">
                    Open Control Center →
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
