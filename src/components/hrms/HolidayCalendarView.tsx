import React, { useState, useMemo } from 'react';
import { HolidayRecord, HolidayType } from '../../types/solar';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  Building,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  PartyPopper,
  MapPin,
  Tag,
  Printer,
  Info
} from 'lucide-react';

interface HolidayCalendarViewProps {
  holidays: HolidayRecord[];
  userDepartment?: string;
  onNavigateToManagement?: () => void;
  isAdmin?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HolidayCalendarView: React.FC<HolidayCalendarViewProps> = ({
  holidays,
  userDepartment,
  onNavigateToManagement,
  isAdmin = false
}) => {
  const [viewMode, setViewMode] = useState<'GRID' | 'TIMELINE'>('GRID');
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(8); // September 2026 (index 8)
  const [typeFilter, setTypeFilter] = useState<'ALL' | HolidayType>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHolidayForDetail, setSelectedHolidayForDetail] = useState<HolidayRecord | null>(null);

  // Filter holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      // Year match
      const holidayYear = new Date(h.date).getFullYear();
      if (holidayYear !== currentYear) return false;

      // Type match
      if (typeFilter !== 'ALL' && h.type !== typeFilter) return false;

      // Department match
      if (selectedDepartment !== 'ALL') {
        const depts = h.applicableDepartments || ['All Departments'];
        const isAll = depts.includes('All Departments');
        if (!isAll && !depts.includes(selectedDepartment)) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = h.name.toLowerCase().includes(q);
        const matchDesc = (h.description || '').toLowerCase().includes(q);
        const matchType = h.type.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchType) return false;
      }

      return true;
    });
  }, [holidays, currentYear, typeFilter, selectedDepartment, searchQuery]);

  // Upcoming holiday relative calculation
  const todayStr = '2026-09-18'; // matching current app date
  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter(h => h.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [holidays, todayStr]);

  const nextHoliday = upcomingHolidays[0] || null;

  // Calendar Grid Calculations
  const daysInMonth = useMemo(() => {
    const year = currentYear;
    const month = currentMonthIndex; // 0-indexed
    return new Date(year, month + 1, 0).getDate();
  }, [currentYear, currentMonthIndex]);

  const firstDayOfWeek = useMemo(() => {
    const year = currentYear;
    const month = currentMonthIndex;
    return new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
  }, [currentYear, currentMonthIndex]);

  // Holidays mapped by day of current month
  const currentMonthHolidaysByDay = useMemo(() => {
    const map: Record<number, HolidayRecord[]> = {};
    filteredHolidays.forEach(h => {
      const d = new Date(h.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonthIndex) {
        const dayNum = d.getDate();
        if (!map[dayNum]) map[dayNum] = [];
        map[dayNum].push(h);
      }
    });
    return map;
  }, [filteredHolidays, currentYear, currentMonthIndex]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonthIndex(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonthIndex(m => m + 1);
    }
  };

  // Group holidays by month for timeline view
  const timelineGroupedByMonth = useMemo(() => {
    const groups: { monthIndex: number; monthName: string; list: HolidayRecord[] }[] = [];
    for (let m = 0; m < 12; m++) {
      const inMonth = filteredHolidays.filter(h => {
        const d = new Date(h.date);
        return d.getMonth() === m;
      });
      if (inMonth.length > 0) {
        groups.push({
          monthIndex: m,
          monthName: MONTH_NAMES[m],
          list: inMonth.sort((a, b) => a.date.localeCompare(b.date))
        });
      }
    }
    return groups;
  }, [filteredHolidays]);

  // Helper for type badges
  const getTypeBadge = (type: HolidayType) => {
    switch (type) {
      case 'NATIONAL':
        return {
          label: 'National Holiday',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500'
        };
      case 'FESTIVAL':
        return {
          label: 'Festival Holiday',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-500'
        };
      case 'REGIONAL':
        return {
          label: 'Regional Gazetted',
          badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
          dotClass: 'bg-sky-500'
        };
      case 'COMPANY':
        return {
          label: 'Company Holiday',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
          dotClass: 'bg-purple-500'
        };
      case 'OPTIONAL':
        return {
          label: 'Restricted / Floating',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-500'
        };
      default:
        return {
          label: type,
          badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
          dotClass: 'bg-slate-500'
        };
    }
  };

  const calculateDaysAway = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date('2026-09-18');
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return 'Observed';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Next Holiday Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Next Upcoming Holiday
            </span>
            {nextHoliday && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                {calculateDaysAway(nextHoliday.date)}
              </span>
            )}
          </div>
          {nextHoliday ? (
            <div className="mt-2">
              <h4 className="text-sm font-black text-slate-900 leading-tight">{nextHoliday.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {new Date(nextHoliday.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">No more upcoming holidays this year</p>
          )}
        </div>

        {/* Total Year Holidays */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Annual Holidays ({currentYear})
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{filteredHolidays.length}</span>
            <span className="text-xs text-slate-500 font-medium">scheduled holidays</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
            <span>{filteredHolidays.filter(h => !h.isOptional).length} Mandatory</span>
            <span className="text-slate-300">•</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{filteredHolidays.filter(h => h.isOptional).length} Optional</span>
          </div>
        </div>

        {/* Selected Month Holidays */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            In {MONTH_NAMES[currentMonthIndex]} {currentYear}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-700">
              {Object.keys(currentMonthHolidaysByDay).length}
            </span>
            <span className="text-xs text-slate-500 font-medium">official break(s)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Approx. {Math.max(0, daysInMonth - 4 - Object.keys(currentMonthHolidaysByDay).length)} regular field work days
          </p>
        </div>

        {/* Workforce Guidance / Admin Shortcut */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Policy & Observance
            </span>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Mandatory holidays apply to all solar project sites & head offices. Floating holidays require team lead approval.
            </p>
          </div>
          {isAdmin && onNavigateToManagement && (
            <button
              type="button"
              onClick={onNavigateToManagement}
              className="mt-2 text-left text-xs font-bold text-amber-800 hover:text-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Holiday Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: View mode toggles & Year selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'TIMELINE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Annual List</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500">Year:</span>
            <select
              value={currentYear}
              onChange={e => setCurrentYear(Number(e.target.value))}
              className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-500">Dept:</span>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value="ALL">All Departments</option>
              <option value="Operations">Operations</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Civil">Civil</option>
              <option value="Installation">Installation</option>
              <option value="Electrical">Electrical</option>
              <option value="HR">HR</option>
              <option value="Management">Management</option>
            </select>
          </div>
        </div>

        {/* Right: Classification Filter, Search, and Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Classification type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-amber-500 text-slate-800"
          >
            <option value="ALL">All Types ({holidays.length})</option>
            <option value="NATIONAL">National Public Holidays</option>
            <option value="FESTIVAL">Festival Celebrations</option>
            <option value="REGIONAL">Regional Gazetted</option>
            <option value="COMPANY">Company Foundation</option>
            <option value="OPTIONAL">Optional / Floating</option>
          </select>

          {/* Search box */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search holiday..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Print Calendar Schedule"
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="bg-slate-50/80 rounded-xl px-4 py-2 border border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <span className="font-bold text-slate-700">Classification Legend:</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>National Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Festival Celebration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Regional Gazetted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Company Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Optional / Floating</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: MONTH GRID CALENDAR */}
      {viewMode === 'GRID' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Calendar Header with Prev/Next Month */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {MONTH_NAMES[currentMonthIndex]} {currentYear}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {Object.keys(currentMonthHolidaysByDay).length} holiday(s) observed in this month
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonthIndex(8); // Sept
                  setCurrentYear(2026);
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Current Month
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold text-center py-2.5">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className={idx === 0 || idx === 6 ? 'text-amber-800' : 'text-slate-700'}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[480px]">
            {/* Empty padding slots for days before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-slate-50/40 p-2 min-h-[90px]" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNumber = index + 1;
              const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
              const dayOfWeek = (firstDayOfWeek + index) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isToday = dateStr === todayStr;
              const holidaysOnDay = currentMonthHolidaysByDay[dayNumber] || [];

              return (
                <div
                  key={`day-${dayNumber}`}
                  className={`p-2 min-h-[95px] flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'bg-amber-50/40 ring-1 ring-amber-400 inset-0'
                      : isWeekend
                      ? 'bg-slate-50/30'
                      : 'bg-white hover:bg-slate-50/50'
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-amber-600 text-white shadow-2xs font-black'
                          : holidaysOnDay.length > 0
                          ? 'text-slate-900 font-black'
                          : isWeekend
                          ? 'text-slate-400'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {holidaysOnDay.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Holiday
                      </span>
                    )}
                  </div>

                  {/* Holidays listed on this day */}
                  <div className="space-y-1 my-1">
                    {holidaysOnDay.map(h => {
                      const badgeInfo = getTypeBadge(h.type);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setSelectedHolidayForDetail(h)}
                          className={`w-full text-left p-1.5 rounded-lg border text-[11px] leading-tight font-bold transition-transform hover:scale-[1.02] cursor-pointer shadow-2xs ${badgeInfo.badgeClass}`}
                        >
                          <div className="flex items-center gap-1 line-clamp-1">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeInfo.dotClass}`} />
                            <span className="truncate">{h.name}</span>
                          </div>
                          {h.isOptional && (
                            <span className="text-[9px] font-semibold text-emerald-700 block mt-0.5">
                              (Optional)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Day footer placeholder for height uniformity */}
                  <div className="text-[10px] text-slate-300 text-right">
                    {isWeekend && holidaysOnDay.length === 0 ? 'Weekend' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: COMPREHENSIVE ANNUAL LIST / TIMELINE */}
      {viewMode === 'TIMELINE' && (
        <div className="space-y-6">
          {timelineGroupedByMonth.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-3">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No holidays found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No holidays match your current filter criteria for {currentYear}. Try clearing your search query or selecting "All Types".
              </p>
            </div>
          ) : (
            timelineGroupedByMonth.map(group => (
              <div
                key={group.monthName}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
              >
                {/* Month Group Header */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      {group.monthName} {currentYear}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {group.list.length} holiday(s)
                  </span>
                </div>

                {/* Holiday Cards in this Month */}
                <div className="divide-y divide-slate-100">
                  {group.list.map(h => {
                    const badgeInfo = getTypeBadge(h.type);
                    const d = new Date(h.date);
                    const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
                    const dateNum = d.getDate();
                    const daysAwayText = calculateDaysAway(h.date);

                    return (
                      <div
                        key={h.id}
                        onClick={() => setSelectedHolidayForDetail(h)}
                        className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                      >
                        {/* Left: Date Block & Holiday Info */}
                        <div className="flex items-start gap-4">
                          {/* Big Date Tile */}
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                              {d.toLocaleDateString('en-IN', { month: 'short' })}
                            </span>
                            <span className="text-xl font-black leading-none">{dateNum}</span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h5 className="text-sm font-bold text-slate-900">{h.name}</h5>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${badgeInfo.badgeClass}`}>
                                {badgeInfo.label}
                              </span>
                              {h.isOptional && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Restricted / Floating
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-semibold text-slate-700">{dayName}</span>
                              <span>•</span>
                              <span>
                                Scope:{' '}
                                <strong className="text-slate-800 font-semibold">
                                  {h.applicableDepartments?.join(', ') || 'All Departments'}
                                </strong>
                              </span>
                            </p>

                            {h.description && (
                              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 max-w-2xl">
                                {h.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Days Away Status */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                              daysAwayText === 'Today!'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-black'
                                : daysAwayText === 'Tomorrow' || daysAwayText.startsWith('In')
                                ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {daysAwayText}
                          </span>
                          <span className="text-[10px] text-slate-400">Click for details</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Holiday Detail Drawer / Modal */}
      {selectedHolidayForDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden scale-100 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedHolidayForDetail.name}</h3>
                  <span className="text-xs text-amber-400 font-medium">
                    {calculateDaysAway(selectedHolidayForDetail.date)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHolidayForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Observance Date
                  </span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedHolidayForDetail.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Category
                  </span>
                  <span className="font-bold text-slate-900">
                    {getTypeBadge(selectedHolidayForDetail.type).label}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Leave Type
                  </span>
                  <span
                    className={`font-bold ${
                      selectedHolidayForDetail.isOptional ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {selectedHolidayForDetail.isOptional ? 'Optional / Floating' : 'Mandatory Paid Holiday'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Departments
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedHolidayForDetail.applicableDepartments?.join(', ') || 'All Departments'}
                  </span>
                </div>
              </div>

              {selectedHolidayForDetail.description && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Guidelines & Observance Notes
                  </span>
                  <p className="text-slate-700 bg-slate-50/60 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {selectedHolidayForDetail.description}
                  </p>
                </div>
              )}

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Field operations on critical solar commissioning tasks scheduled during holidays must be coordinated with the Site Engineer and approved for compensatory off or overtime.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedHolidayForDetail(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
