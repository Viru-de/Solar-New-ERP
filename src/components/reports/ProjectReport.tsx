import React, { useMemo } from 'react';
import { SolarProject, Customer } from '../../types/solar';
import { ReportFilterState, ReportCategoryMeta } from '../../types/reports';
import { exportToCSV } from '../../services/exportImport';
import { ReportFilterBar } from './ReportFilterBar';
import { Sun, CheckCircle2, Clock, Zap, DollarSign, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const CHART_COLORS = [
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#6366f1',
  '#14b8a6',
  '#ef4444'
];

interface ProjectReportProps {
  projects: SolarProject[];
  customers?: Customer[];
  filters: ReportFilterState;
  onFilterChange: (updated: Partial<ReportFilterState>) => void;
  onFilterReset: () => void;
  meta: ReportCategoryMeta;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ProjectReport: React.FC<ProjectReportProps> = ({
  projects,
  filters,
  onFilterChange,
  onFilterReset,
  meta,
  showToast
}) => {
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const pDate = p.startDate || '2025-01-01';

      // Date filter
      if (filters.fromDate && pDate < filters.fromDate) return false;
      if (filters.toDate && pDate > filters.toDate) return false;

      // Name / Code / Customer / Location filter
      if (filters.name.trim()) {
        const query = filters.name.toLowerCase();
        const matchesTitle = (p.title || '').toLowerCase().includes(query);
        const matchesCode = (p.projectCode || '').toLowerCase().includes(query);
        const matchesCustomer = (p.customerName || '').toLowerCase().includes(query);
        const matchesCity = (p.city || p.location || '').toLowerCase().includes(query);
        const matchesMgr = (p.projectManagerName || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesCode && !matchesCustomer && !matchesCity && !matchesMgr) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (p.status !== filters.status) return false;
      }

      return true;
    });
  }, [projects, filters]);

  // Aggregate KPIs
  const totalProjects = filteredProjects.length;
  const completedProjects = filteredProjects.filter(p => p.status === 'COMPLETED').length;
  const totalCapacityKw = filteredProjects.reduce((sum, p) => sum + (p.capacityKw || 0), 0);
  const totalPortfolioValue = filteredProjects.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const avgProgress = totalProjects > 0
    ? Math.round(
        filteredProjects.reduce(
          (sum, p) => sum + (p.completionPercentage !== undefined ? p.completionPercentage : p.progressPercentage || 0),
          0
        ) / totalProjects
      )
    : 0;

  // Status breakdown for chart
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      PLANNING: 0,
      SURVEY: 0,
      'DESIGN & APPROVALS': 0,
      'CIVIL & STRUCTURE': 0,
      INSTALLATION: 0,
      'TESTING & COMMISSIONING': 0,
      HANDOVER: 0,
      COMPLETED: 0,
      DELAYED: 0,
      'ON HOLD': 0
    };
    filteredProjects.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status] += 1;
      } else {
        counts[p.status] = 1;
      }
    });
    return Object.entries(counts).filter(([_, count]) => count > 0 || true).map(([status, count]) => ({ status, count }));
  }, [filteredProjects]);

  const projectStatusShare = useMemo(() => {
    return statusData
      .map(d => ({ name: d.status, value: d.count }))
      .filter(d => d.value > 0);
  }, [statusData]);

  const handleExportCSV = () => {
    const headers = [
      'Project Code',
      'Project Title',
      'Customer Name',
      'Capacity (kW)',
      'Total Value (INR)',
      'Current Stage',
      'Progress (%)',
      'Status',
      'Start Date',
      'Target Completion Date',
      'Site Location',
      'Assigned Team',
      'Panel Specification',
      'Inverter Specification'
    ];
    const rows = filteredProjects.map(p => [
      p.projectCode,
      p.title,
      p.customerName,
      p.capacityKw,
      p.totalValue,
      p.currentStageKey || 'N/A',
      p.completionPercentage !== undefined ? p.completionPercentage : p.progressPercentage,
      p.status,
      p.startDate,
      p.expectedCompletionDate || p.actualCompletionDate || 'N/A',
      p.city || p.location || 'N/A',
      p.assignedUsers && p.assignedUsers.length > 0
        ? p.assignedUsers.map(u => `${u.userName} (${u.role})`).join('; ')
        : p.projectManagerName || 'N/A',
      p.panelModel || 'N/A',
      p.inverterModel || 'N/A'
    ]);
    exportToCSV(`SolarPulse_Projects_Report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('Projects report exported to CSV', 'success');
  };

  const getStatusBadge = (status: SolarProject['status']) => {
    switch (status) {
      case 'COMPLETED':
      case 'HANDOVER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INSTALLATION':
      case 'TESTING & COMMISSIONING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PLANNING':
      case 'SURVEY':
      case 'DESIGN & APPROVALS':
      case 'CIVIL & STRUCTURE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELAYED':
      case 'ON HOLD':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
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
        totalCount={projects.length}
        filteredCount={filteredProjects.length}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Installed Capacity</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {totalCapacityKw.toFixed(1)} kW
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {totalProjects} solar projects</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Turnkey Project Value</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalPortfolioValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Cumulative contract order book</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Commissioned & Done</span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {completedProjects} / {totalProjects}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Projects successfully energized</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Average Progress</span>
            <span className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {avgProgress}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Mean execution workflow completion</p>
        </div>
      </div>

      {/* Donut Chart: Project Status Share */}
      {projectStatusShare.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Project Execution Status Share</h3>
          <p className="text-xs text-slate-500 mb-4">Proportion of active, energized, and milestone-stage EPC solar projects</p>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {projectStatusShare.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [val, 'Projects']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Projects Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Solar EPC Projects Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive tracking of system capacity, progress and equipment</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {filteredProjects.length} Projects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-4">Project / Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Capacity (kW)</th>
                <th className="py-3 px-4 text-right">Contract Value</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">Assigned Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Sun className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No solar projects match the selected filters</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(p => {
                  const progressVal = p.completionPercentage !== undefined ? p.completionPercentage : p.progressPercentage || 0;
                  const activeAssignments = p.assignedUsers?.filter(u => u.isActive !== false) || [];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.title}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {p.projectCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {p.customerName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {p.city || p.location || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {p.capacityKw} kW
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{p.totalValue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-700">
                          {p.currentStageKey || 'Planning'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-600">{progressVal}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {p.expectedCompletionDate || p.actualCompletionDate || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {activeAssignments.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                              <Users className="w-3 h-3 text-amber-600" />
                              <span>{activeAssignments.length} Specialists</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
