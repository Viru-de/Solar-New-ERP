import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { TodayAttendanceCard } from '../hrms/TodayAttendanceCard';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Plus,
  Calendar,
  Users,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const ServiceDashboard: React.FC = () => {
  const { setActiveView, refreshTrigger, showToast } = useApp();
  const { currentUser } = useAuth();

  const tickets = useMemo(() => storageService.getServiceTickets(), [refreshTrigger]);

  const openTickets = tickets.filter(t => t.status !== 'RESOLVED');
  const criticalTickets = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-yellow-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                O&M and Warranty Operations
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">{currentUser?.role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Solar Service & AMC Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Track plant breakdown tickets, inverter fault codes, string diagnostic tests, and preventive maintenance visits for warranty customers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveView('service')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Service Ticket</span>
            </button>
            <button
              onClick={() => setActiveView('live_tracking')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Technician Tracking</span>
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {openTickets.length} <span className="text-xs font-bold text-slate-500">tickets</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Pending field resolution</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Priority</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700 tracking-tight">
              {criticalTickets.length} <span className="text-xs font-bold text-rose-600">urgent</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Inverter shutdown / trip</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved Tickets</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {resolvedTickets.length} <span className="text-xs font-bold text-emerald-600">closed</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">This month</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active AMCs</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700 tracking-tight">
              18 <span className="text-xs font-bold text-blue-600">plants</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Under annual maintenance</p>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Service Breakdown Tickets</h3>
            <p className="text-xs text-slate-500">Live issues requiring technician dispatch and spares replacement</p>
          </div>
          <button
            onClick={() => setActiveView('service')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Open Service Desk →
          </button>
        </div>

        <div className="space-y-3">
          {tickets.slice(0, 5).map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setActiveView('service')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-yellow-50/50 border border-slate-200/80 hover:border-yellow-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{ticket.issue || ticket.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ticket.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-800'
                      : ticket.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{ticket.customerName} • {ticket.projectTitle || 'Solar Site'}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600">
                  Technician: <strong className="text-slate-800">{ticket.assignedTechnicianName || ticket.assignedToName || 'Ketan Solanki'}</strong>
                </span>
                <span className="text-xs font-bold text-amber-700 hover:underline">
                  Resolve Ticket →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
