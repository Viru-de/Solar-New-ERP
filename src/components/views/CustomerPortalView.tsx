import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { StatusBadge } from '../common/StatusBadge';
import {
  SunMedium,
  Zap,
  TrendingUp,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  Download,
  Phone,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const CustomerPortalView: React.FC = () => {
  const { openCustomerControlCenter, setActiveView, showToast, refreshTrigger } = useApp();
  const { currentUser } = useAuth();

  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);
  const myProject = projects[0]; // ABC Industries 100 kW

  const completedStagesCount = myProject.stages.filter(s => s.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-2">
            Client Portal • {myProject.projectCode}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 leading-relaxed">
            Track real-time EPC installation progress, engineering drawings, milestone invoices, and solar power generation for your {myProject.capacityKw} kW Rooftop Solar Plant.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => openCustomerControlCenter(myProject.customerId, myProject.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition-colors shadow-2xs"
            >
              <Layers className="w-4 h-4 text-amber-600" />
              <span>View Full 15-Stage Timeline</span>
            </button>

            <button
              onClick={() => setActiveView('service')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Wrench className="w-4 h-4" />
              <span>Raise Service Ticket</span>
            </button>
          </div>
        </div>

        <SunMedium className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 pointer-events-none" />
      </div>

      {/* Solar Generation Simulation / Estimated Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Est. Daily Generation</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            430 <span className="text-sm font-bold text-slate-500">kWh / Units</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">Estimated ₹3,440 saved per sunny day</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Annual Clean Power</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <SunMedium className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            1,55,000 <span className="text-sm font-bold text-slate-500">kWh/yr</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Saves ~125 Metric Tons CO₂ annually</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Plant Health Status</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            OPTIMAL
          </div>
          <p className="text-[11px] text-slate-500 mt-1">25-Year Performance Warranty Active</p>
        </div>
      </div>

      {/* Live Turnkey EPC Execution Track */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">15-Stage Project Milestone Progression</h3>
            <p className="text-xs text-slate-500">Overall Progress: {myProject.progressPercentage}% ({completedStagesCount} of 15 completed)</p>
          </div>
          <StatusBadge status={myProject.status} />
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${myProject.progressPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {myProject.stages.slice(0, 6).map((stage) => (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                stage.status === 'COMPLETED' ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                stage.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {stage.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : stage.order}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">{stage.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={stage.status} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => openCustomerControlCenter(myProject.customerId, myProject.id)}
            className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Open Detailed Interactive Project Control Center</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Customer Helpline */}
      <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Direct SolarPulse EPC Project Desk:</span>
            <span className="text-slate-600 ml-1">+91 98250 12345 (EPC Operations & Engineering Support)</span>
          </div>
        </div>
        <a
          href="tel:+919825012345"
          className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          Call Engineering Desk
        </a>
      </div>
    </div>
  );
};
