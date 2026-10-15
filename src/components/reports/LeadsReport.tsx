import React, { useMemo } from 'react';
import { Lead } from '../../types/solar';
import { ReportFilterState, ReportCategoryMeta } from '../../types/reports';
import { exportToCSV } from '../../services/exportImport';
import { ReportFilterBar } from './ReportFilterBar';
import { UserCheck, Zap, DollarSign, Target, Award } from 'lucide-react';
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
  '#8b5cf6',
  '#f59e0b',
  '#f97316',
  '#eab308',
  '#10b981',
  '#ef4444'
];

interface LeadsReportProps {
  leads: Lead[];
  filters: ReportFilterState;
  onFilterChange: (updated: Partial<ReportFilterState>) => void;
  onFilterReset: () => void;
  meta: ReportCategoryMeta;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const LeadsReport: React.FC<LeadsReportProps> = ({
  leads,
  filters,
  onFilterChange,
  onFilterReset,
  meta,
  showToast
}) => {
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const createdDate = l.createdAt ? l.createdAt.slice(0, 10) : '2025-01-01';

      // Date filter
      if (filters.fromDate && createdDate < filters.fromDate) return false;
      if (filters.toDate && createdDate > filters.toDate) return false;

      // Name / Phone / City / Source filter
      if (filters.name.trim()) {
        const query = filters.name.toLowerCase();
        const matchesName = (l.customerName || '').toLowerCase().includes(query);
        const matchesCompany = (l.companyName || '').toLowerCase().includes(query);
        const matchesPhone = (l.phone || '').toLowerCase().includes(query);
        const matchesCity = (l.city || '').toLowerCase().includes(query);
        const matchesSource = (l.source || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCompany && !matchesPhone && !matchesCity && !matchesSource) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (l.status !== filters.status) return false;
      }

      return true;
    });
  }, [leads, filters]);

  // Aggregate KPIs
  const totalLeads = filteredLeads.length;
  const wonLeads = filteredLeads.filter(l => l.status === 'WON').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';
  const totalCapacityKw = filteredLeads.reduce((sum, l) => sum + (l.solarCapacityKw || 0), 0);
  const totalPipelineValue = filteredLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  // Stage distribution data for funnel chart
  const stageData = useMemo(() => {
    const stageCounts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      'SITE SURVEY': 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0
    };
    filteredLeads.forEach(l => {
      if (stageCounts[l.status] !== undefined) {
        stageCounts[l.status] += 1;
      }
    });
    return Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      count
    }));
  }, [filteredLeads]);

  const leadStageShare = useMemo(() => {
    return stageData
      .map(d => ({ name: d.stage, value: d.count }))
      .filter(d => d.value > 0);
  }, [stageData]);

  const handleExportCSV = () => {
    const headers = [
      'Customer / Lead Name',
      'Company Name',
      'Phone Number',
      'Email',
      'City',
      'Capacity (kW)',
      'Estimated Value (INR)',
      'Stage / Status',
      'Acquisition Source',
      'Assigned Rep',
      'Created Date'
    ];
    const rows = filteredLeads.map(l => [
      l.customerName,
      l.companyName || 'N/A',
      l.phone,
      l.email || 'N/A',
      l.city || 'N/A',
      l.solarCapacityKw,
      l.estimatedValue,
      l.status,
      l.source,
      l.assignedToName || l.assignedSalespersonName || 'Unassigned',
      l.createdAt ? l.createdAt.slice(0, 10) : 'N/A'
    ]);
    exportToCSV(`SolarPulse_Leads_Report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    showToast('Leads report exported to CSV', 'success');
  };

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'WON':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'NEGOTIATION':
      case 'PROPOSAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SITE SURVEY':
      case 'QUALIFIED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CONTACTED':
      case 'NEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOST':
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
        totalCount={leads.length}
        filteredCount={filteredLeads.length}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Inquiries</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalLeads} Prospects
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Commercial & residential inquiries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Win Rate</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{wonLeads} deals won & converted</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pipeline Capacity</span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {totalCapacityKw.toFixed(1)} kW
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Combined rooftop & ground demand</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pipeline Value</span>
            <span className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalPipelineValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Estimated contract pipeline</p>
        </div>
      </div>

      {/* Donut Chart: Lead Stage Share */}
      {leadStageShare.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Lead Pipeline Stage Share</h3>
          <p className="text-xs text-slate-500 mb-4">Proportion of opportunities across pipeline milestones from discovery to won contracts</p>
          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadStageShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {leadStageShare.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [val, 'Leads in Stage']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Leads Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">CRM Leads & Inquiries Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">Inquiry sources, kW requirements, and pipeline conversions</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {filteredLeads.length} Leads
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-4">Customer / Company</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Capacity Req.</th>
                <th className="py-3 px-4 text-right">Est. Value</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-center">Stage</th>
                <th className="py-3 px-4">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No leads found matching current filters</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {l.customerName}
                      {l.companyName && (
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {l.companyName}
                        </span>
                      )}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Added: {l.createdAt ? l.createdAt.slice(0, 10) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {l.phone}
                      {l.email && <span className="block text-[10px] text-slate-400">{l.email}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{l.city || '-'}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {l.solarCapacityKw} kW
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{l.estimatedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                        {l.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(
                          l.status
                        )}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {l.assignedToName || l.assignedSalespersonName || 'Unassigned'}
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
