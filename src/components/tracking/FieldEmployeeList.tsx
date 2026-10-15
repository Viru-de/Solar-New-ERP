import React, { useMemo } from 'react';
import {
  LiveEmployeeLocation,
  TrackingFilterOptions,
  ELIGIBLE_FIELD_ROLES
} from '../../types/tracking';
import { FieldEmployeeCard } from './FieldEmployeeCard';
import {
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  Radio
} from 'lucide-react';

interface FieldEmployeeListProps {
  locations: LiveEmployeeLocation[];
  selectedEmployee: LiveEmployeeLocation | null;
  onSelectEmployee: (emp: LiveEmployeeLocation) => void;
  onViewDetails: (emp: LiveEmployeeLocation) => void;
  filters: TrackingFilterOptions;
  onFilterChange: (filters: TrackingFilterOptions) => void;
  isMobileDrawerOpen: boolean;
  onToggleMobileDrawer: () => void;
}

export const FieldEmployeeList: React.FC<FieldEmployeeListProps> = ({
  locations,
  selectedEmployee,
  onSelectEmployee,
  onViewDetails,
  filters,
  onFilterChange,
  isMobileDrawerOpen,
  onToggleMobileDrawer
}) => {
  // Extract distinct roles available among eligible workers
  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => {
      if (l.role) set.add(l.role);
    });
    // Add default eligible field roles
    ELIGIBLE_FIELD_ROLES.forEach((r) => set.add(r));
    return Array.from(set);
  }, [locations]);

  // Compute live counters strictly from actual locations
  const stats = useMemo(() => {
    const total = locations.length;
    const online = locations.filter((l) => l.isOnline).length;
    const moving = locations.filter((l) => l.isOnline && l.status === 'moving').length;
    const idle = locations.filter((l) => l.isOnline && l.status === 'idle').length;
    const offline = locations.filter((l) => !l.isOnline).length;
    const assigned = locations.filter((l) => Boolean(l.assignedProjectId)).length;
    return { total, online, moving, idle, offline, assigned };
  }, [locations]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return locations.filter((emp) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchCode = emp.employeeCode?.toLowerCase().includes(q);
        const matchRole = emp.role.toLowerCase().includes(q);
        const matchCustomer = emp.assignedCustomerName?.toLowerCase().includes(q);
        const matchAddress = emp.assignedSiteAddress?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRole && !matchCustomer && !matchAddress) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'ALL') {
        if (filters.status === 'online') {
          if (!emp.isOnline) return false;
        } else if (filters.status === 'moving') {
          if (!emp.isOnline || emp.status !== 'moving') return false;
        } else if (filters.status === 'idle') {
          if (!emp.isOnline || emp.status !== 'idle') return false;
        } else if (filters.status === 'offline') {
          if (emp.isOnline) return false;
        }
      }

      // Role filter
      if (filters.role !== 'ALL') {
        if (emp.role !== filters.role) return false;
      }

      // Assignment filter
      if (filters.assignment === 'ASSIGNED' && !emp.assignedProjectId) return false;
      if (filters.assignment === 'UNASSIGNED' && emp.assignedProjectId) return false;

      return true;
    });
  }, [locations, filters]);

  const clearFilters = () => {
    onFilterChange({
      searchQuery: '',
      status: 'ALL',
      role: 'ALL',
      assignment: 'ALL'
    });
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.status !== 'ALL' ||
    filters.role !== 'ALL' ||
    filters.assignment !== 'ALL';

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Mobile Drawer Trigger Bar */}
      <div
        onClick={onToggleMobileDrawer}
        className="lg:hidden p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800">
            Workforce List ({filteredEmployees.length})
          </span>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            {stats.online} Online
          </span>
        </div>
        {isMobileDrawerOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        )}
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-1 overflow-hidden ${isMobileDrawerOpen ? 'flex' : 'hidden lg:flex'}`}>
        {/* Header & Status Filter Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Field Workforce
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {locations.length}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Pusher Stream</span>
            </span>
          </div>

          {/* Quick Counter Chips */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, status: 'ALL' })}
              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                filters.status === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <span className="block text-[10px] text-slate-400 uppercase">Total</span>
              <span className="text-xs">{stats.total}</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, status: 'moving' })}
              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                filters.status === 'moving'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="block text-[10px] uppercase">🚗 Moving</span>
              <span className="text-xs">{stats.moving}</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, status: 'idle' })}
              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                filters.status === 'idle'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="block text-[10px] uppercase">🟡 Idle</span>
              <span className="text-xs">{stats.idle}</span>
            </button>

            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, status: 'offline' })}
              className={`p-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                filters.status === 'offline'
                  ? 'bg-slate-600 text-white border-slate-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className="block text-[10px] uppercase">⚫ Offline</span>
              <span className="text-xs">{stats.offline}</span>
            </button>
          </div>

          {/* Search Input: "Search field employee..." */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search field employee..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns (Role & Assignment) */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.role}
              onChange={(e) => onFilterChange({ ...filters, role: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <select
              value={filters.assignment}
              onChange={(e) => onFilterChange({ ...filters, assignment: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Sites</option>
              <option value="ASSIGNED">Assigned Only ({stats.assigned})</option>
              <option value="UNASSIGNED">Unassigned Only ({stats.total - stats.assigned})</option>
            </select>
          </div>

          {/* Active Filter Clear Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Showing {filteredEmployees.length} of {locations.length}</span>
              <button
                type="button"
                onClick={clearFilters}
                className="font-bold text-amber-700 hover:text-amber-800"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Employee Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-600">No field employees match criteria</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try relaxing your search or role filter</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <FieldEmployeeCard
                key={employee.userId}
                employee={employee}
                isSelected={selectedEmployee?.userId === employee.userId}
                onSelect={onSelectEmployee}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
