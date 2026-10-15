import React from 'react';
import { Search, Calendar, Filter, RotateCcw, Download, Printer, X, Warehouse as WarehouseIcon } from 'lucide-react';
import { ReportCategoryMeta, ReportFilterState } from '../../types/reports';
import { Warehouse } from '../../types/solar';

interface ReportFilterBarProps {
  filters: ReportFilterState;
  onChange: (updated: Partial<ReportFilterState>) => void;
  onReset: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  categoryMeta: ReportCategoryMeta;
  totalCount: number;
  filteredCount: number;
  hideDate?: boolean;
  hideName?: boolean;
  hideStatus?: boolean;
  showWarehouseFilter?: boolean;
  warehouses?: Warehouse[];
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  onExportCSV,
  onPrint,
  categoryMeta,
  totalCount,
  filteredCount,
  hideDate = false,
  hideName = false,
  hideStatus = false,
  showWarehouseFilter = false,
  warehouses = []
}) => {
  const isFiltered = Boolean(
    filters.fromDate ||
    filters.toDate ||
    filters.name.trim() ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.warehouseId && filters.warehouseId !== 'ALL')
  );

  const setPreset = (type: 'all' | 'this_month' | 'last_30' | 'this_quarter' | 'this_year') => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (type === 'all') {
      onChange({ fromDate: '', toDate: '' });
      return;
    }

    if (type === 'this_month') {
      const fromDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      onChange({ fromDate: fromDateStr, toDate: toDateStr });
      return;
    }

    if (type === 'last_30') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const fromDateStr = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`;
      onChange({ fromDate: fromDateStr, toDate: toDateStr });
      return;
    }

    if (type === 'this_quarter') {
      const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const fromDateStr = `${now.getFullYear()}-${pad(currentQuarterMonth + 1)}-01`;
      onChange({ fromDate: fromDateStr, toDate: toDateStr });
      return;
    }

    if (type === 'this_year') {
      const fromDateStr = `${now.getFullYear()}-01-01`;
      onChange({ fromDate: fromDateStr, toDate: toDateStr });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Top row: Title, result count, and Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {categoryMeta.label} Filters
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing <span className="font-bold text-slate-900">{filteredCount}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> records
              {isFiltered && <span className="text-amber-600 font-semibold ml-1">(filtered)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-2xs"
            title="Print this report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-2xs"
            title="Export filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Filter Controls Grid */}
      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Date Range: From Date & To Date */}
        {!hideDate && (
          <div className={`${showWarehouseFilter ? 'lg:col-span-4' : 'lg:col-span-5'} grid grid-cols-2 gap-2`}>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>From Date</span>
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={e => onChange({ fromDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>To Date</span>
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={e => onChange({ toDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Name / Keyword Search Filter */}
        {!hideName && (
          <div className={showWarehouseFilter ? 'lg:col-span-3' : (!hideDate && !hideStatus ? 'lg:col-span-4' : 'lg:col-span-6')}>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {categoryMeta.nameFilterLabel}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.name}
                onChange={e => onChange({ name: e.target.value })}
                placeholder={categoryMeta.nameFilterPlaceholder}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {filters.name && (
                <button
                  type="button"
                  onClick={() => onChange({ name: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status Filter */}
        {!hideStatus && (
          <div className={showWarehouseFilter ? 'lg:col-span-2' : (!hideDate && !hideName ? 'lg:col-span-3' : 'lg:col-span-6')}>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Status Filter
            </label>
            <select
              value={filters.status || 'ALL'}
              onChange={e => onChange({ status: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all cursor-pointer"
            >
              {categoryMeta.statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Warehouse Filter */}
        {showWarehouseFilter && warehouses && warehouses.length > 0 && (
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <WarehouseIcon className="w-3 h-3 text-amber-600" />
              <span>Warehouse Hub</span>
            </label>
            <select
              value={filters.warehouseId || 'ALL'}
              onChange={e => onChange({ warehouseId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">All Facilities (Global)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Date Presets Bar */}
      {!hideDate && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Quick Dates:
          </span>
          <button
            type="button"
            onClick={() => setPreset('all')}
            className={`px-2 py-0.5 text-[11px] rounded-lg transition-colors font-medium ${
              !filters.fromDate && !filters.toDate
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All Dates
          </button>
          <button
            type="button"
            onClick={() => setPreset('this_month')}
            className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200/80 transition-colors font-medium"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setPreset('last_30')}
            className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200/80 transition-colors font-medium"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => setPreset('this_quarter')}
            className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200/80 transition-colors font-medium"
          >
            This Quarter
          </button>
          <button
            type="button"
            onClick={() => setPreset('this_year')}
            className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200/80 transition-colors font-medium"
          >
            This Year (YTD)
          </button>
        </div>
      )}

      {/* Active Filter Badges */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Active:
          </span>
          {filters.fromDate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-medium">
              From: {filters.fromDate}
              <button onClick={() => onChange({ fromDate: '' })} className="hover:text-amber-950">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filters.toDate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-medium">
              To: {filters.toDate}
              <button onClick={() => onChange({ toDate: '' })} className="hover:text-amber-950">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filters.name.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[11px] font-medium">
              Search: "{filters.name}"
              <button onClick={() => onChange({ name: '' })} className="hover:text-blue-950">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filters.status && filters.status !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md text-[11px] font-medium">
              Status: {categoryMeta.statusOptions.find(o => o.value === filters.status)?.label || filters.status}
              <button onClick={() => onChange({ status: 'ALL' })} className="hover:text-purple-950 cursor-pointer">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filters.warehouseId && filters.warehouseId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-md text-[11px] font-medium">
              Facility: {warehouses?.find(w => w.id === filters.warehouseId)?.name || filters.warehouseId}
              <button onClick={() => onChange({ warehouseId: 'ALL' })} className="hover:text-amber-950 cursor-pointer">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
