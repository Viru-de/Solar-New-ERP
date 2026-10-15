import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { SolarProject } from '../../types/solar';
import { StatusBadge } from '../common/StatusBadge';
import {
  SunMedium,
  Search,
  Filter,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Zap,
  Building2,
  FileSpreadsheet,
  MessageSquare
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { openCustomerControlCenter, openWhatsAppModal, openImportExportModal, stageFilterKey, setStageFilterKey, refreshTrigger } = useApp();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState<string>(stageFilterKey || 'ALL');

  const projects = useMemo(() => storageService.getProjects(), [refreshTrigger]);

  const filteredProjects = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    const stageTerm = (activeStageFilter || '').toLowerCase().trim();

    return projects.filter(p => {
      const matchesSearch =
        !term ||
        (p.title || '').toLowerCase().includes(term) ||
        (p.projectCode || '').toLowerCase().includes(term) ||
        (p.customerName || '').toLowerCase().includes(term) ||
        (p.location || '').toLowerCase().includes(term);

      const matchesStage =
        !activeStageFilter ||
        activeStageFilter === 'ALL' ||
        (p.currentStageKey || '').toLowerCase().includes(stageTerm);

      return matchesSearch && matchesStage;
    });
  }, [projects, searchTerm, activeStageFilter]);

  const stagesList = [
    { key: 'ALL', label: 'All Projects' },
    { key: 'site_survey', label: 'Site Survey' },
    { key: 'procurement_dispatch', label: 'Procurement' },
    { key: 'civil_work', label: 'Civil Work' },
    { key: 'structure_mounting', label: 'Structure' },
    { key: 'panel_installation', label: 'Panel Installation' },
    { key: 'inverter_electrical', label: 'Electrical' },
    { key: 'testing_commissioning', label: 'Testing' },
    { key: 'net_metering', label: 'Net Metering' },
    { key: 'final_handover', label: 'Commissioned' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              EPC Project Execution
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{projects.length} Total Turnkey Sites</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Active Solar Projects Portfolio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openImportExportModal('Projects')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Projects</span>
          </button>
        </div>
      </div>

      {/* Stage Filter Chips */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto flex items-center gap-1.5">
        {stagesList.map(st => (
          <button
            key={st.key}
            onClick={() => {
              setActiveStageFilter(st.key);
              setStageFilterKey(st.key === 'ALL' ? null : st.key);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeStageFilter === st.key
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project name, project ID, customer, location..."
          className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => {
          const completedStagesCount = p.stages.filter(s => s.status === 'COMPLETED').length;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    {p.projectCode}
                  </span>
                  <StatusBadge status={p.status} size="sm" />
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{p.customerName}</p>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 my-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
                    <p className="font-black text-slate-900 text-sm">{p.capacityKw} kW</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Value</span>
                    <p className="font-black text-slate-900 text-sm">₹{(p.totalValue / 100000).toFixed(1)}L</p>
                  </div>
                </div>

                {/* Location & Dates */}
                <div className="space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{p.location}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Target: {p.expectedCompletionDate}</span>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700 capitalize">
                      Stage: {p.currentStageKey.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-amber-700">{p.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${p.progressPercentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {completedStagesCount} of 15 Workflow Stages Completed
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() =>
                    openWhatsAppModal('919879544321', p.customerName, 'INSTALLATION_UPDATE', {
                      projectTitle: p.title,
                      stageTitle: p.currentStageKey.replace(/_/g, ' ')
                    })
                  }
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="WhatsApp Update"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openCustomerControlCenter(p.customerId, p.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>Open Control Center</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
