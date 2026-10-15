import React, { useState, useMemo } from 'react';
import { HolidayRecord, HolidayType } from '../../types/solar';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Building2,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

interface HolidayManagementViewProps {
  holidays: HolidayRecord[];
  onAddHoliday: () => void;
  onEditHoliday: (holiday: HolidayRecord) => void;
  onDeleteHoliday: (holiday: HolidayRecord) => void;
  onResetStandardHolidays: () => void;
  isAdmin: boolean;
}

export const HolidayManagementView: React.FC<HolidayManagementViewProps> = ({
  holidays,
  onAddHoliday,
  onEditHoliday,
  onDeleteHoliday,
  onResetStandardHolidays,
  isAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'ALL' | HolidayType>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Safeguard: non-admin users
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Administrator Access Required</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          The Holiday Administration portal is restricted to authorized HR Managers and System Administrators. Please switch to the Holiday Calendar tab to view the published schedule.
        </p>
      </div>
    );
  }

  // Filtered list
  const filteredHolidays = useMemo(() => {
    return holidays
      .filter(h => {
        const year = new Date(h.date).getFullYear();
        if (selectedYear !== year) return false;

        if (selectedType !== 'ALL' && h.type !== selectedType) return false;

        if (selectedDept !== 'ALL') {
          const depts = h.applicableDepartments || ['All Departments'];
          if (!depts.includes('All Departments') && !depts.includes(selectedDept)) {
            return false;
          }
        }

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = h.name.toLowerCase().includes(q);
          const matchDesc = (h.description || '').toLowerCase().includes(q);
          const matchType = h.type.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchType) return false;
        }

        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, selectedYear, selectedType, selectedDept, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const yearHolidays = holidays.filter(h => new Date(h.date).getFullYear() === selectedYear);
    const mandatory = yearHolidays.filter(h => !h.isOptional).length;
    const optional = yearHolidays.filter(h => h.isOptional).length;
    const company = yearHolidays.filter(h => h.type === 'COMPANY').length;
    return {
      total: yearHolidays.length,
      mandatory,
      optional,
      company
    };
  }, [holidays, selectedYear]);

  // Badge styler
  const getTypeBadge = (type: HolidayType) => {
    switch (type) {
      case 'NATIONAL':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'FESTIVAL':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'REGIONAL':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'COMPANY':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'OPTIONAL':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Stats & Admin Actions */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              HR Administration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Holiday Schedule Configuration</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Manage Holiday Calendar ({selectedYear})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure statutory national holidays, festival days, and company off-days for payroll calculations and attendance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reset standard button */}
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Restore standard 2026 Indian holiday set"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Standard Set</span>
          </button>

          {/* Add Holiday Button */}
          <button
            type="button"
            onClick={onAddHoliday}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday Record</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total {selectedYear} Holidays
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-500">Configured in registry</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
            Mandatory Holidays
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{stats.mandatory}</span>
          <span className="text-[11px] text-slate-500">Full office & site closure</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Floating / Optional
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.optional}</span>
          <span className="text-[11px] text-slate-500">Elective floating leaves</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">
            Company Milestones
          </span>
          <span className="text-2xl font-black text-purple-700 mt-1 block">{stats.company}</span>
          <span className="text-[11px] text-slate-500">Corporate & Foundation Days</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Classification type filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500">Type:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value="ALL">All Types</option>
              <option value="NATIONAL">National</option>
              <option value="FESTIVAL">Festival</option>
              <option value="REGIONAL">Regional</option>
              <option value="COMPANY">Company</option>
              <option value="OPTIONAL">Optional</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500">Dept:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value="ALL">All Departments</option>
              <option value="Operations">Operations</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Civil">Civil</option>
              <option value="Structure">Structure</option>
              <option value="Installation">Installation</option>
              <option value="Electrical">Electrical</option>
              <option value="HR">HR</option>
              <option value="Management">Management</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search holiday name or notes..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Holidays Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Date & Day</th>
                <th className="py-3 px-4">Holiday Name</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Status / Leave Type</th>
                <th className="py-3 px-4">Departments</th>
                <th className="py-3 px-4">Description & Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-800">No holiday records found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try adjusting your filters or click below to create a new holiday.
                      </p>
                      <button
                        type="button"
                        onClick={onAddHoliday}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Holiday</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHolidays.map(h => {
                  const d = new Date(h.date);
                  const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
                  const formattedDate = d.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date & Day */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formattedDate}</div>
                        <span className="text-[11px] text-slate-500 font-medium">{dayName}</span>
                      </td>

                      {/* Holiday Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {h.name}
                        {h.createdBy && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Added by {h.createdBy}
                          </span>
                        )}
                      </td>

                      {/* Classification Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${getTypeBadge(h.type)}`}>
                          {h.type}
                        </span>
                      </td>

                      {/* Status / Leave Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {h.isOptional ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Optional / Floating</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Mandatory Paid</span>
                          </span>
                        )}
                      </td>

                      {/* Applicable Departments */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-700 font-medium">
                          {h.applicableDepartments?.join(', ') || 'All Departments'}
                        </span>
                      </td>

                      {/* Description & Notes */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 text-xs">
                        {h.description || <span className="text-slate-300 italic">No notes provided</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditHoliday(h)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Edit Holiday Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteHoliday(h)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Holiday Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore standard confirmation dialog */}
      {isResetConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Restore Standard 2026 Holidays?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This will reset your holiday registry to the default official Indian gazetted & regional holiday schedule (Republic Day, Holi, Eid, Independence Day, Diwali, Foundation Day, etc.). Any custom holiday changes will be overwritten.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetStandardHolidays();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Restore Standard Holidays
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
