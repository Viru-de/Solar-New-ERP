import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { TodayAttendanceCard } from '../hrms/TodayAttendanceCard';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Navigation,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react';

export const HrDashboard: React.FC = () => {
  const { setActiveView, refreshTrigger, showToast } = useApp();
  const { currentUser } = useAuth();

  const employees = useMemo(() => storageService.getEmployees(), [refreshTrigger]);

  const totalEmployees = employees.length;
  const activeStaff = employees.filter(e => e.status === 'ACTIVE' && e.accountStatus !== 'DISABLED');
  const fieldStaff = employees.filter(e => e.isFieldWorker);
  const onLeaveStaff = employees.filter(e => e.status === 'ON LEAVE');

  const totalPayrollEst = employees.reduce((sum, e) => sum + (e.salaryMonthly || 45000), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-pink-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                HR & Talent Operations
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">HR Manager Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Human Resources, Payroll & Staff Attendance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Supervise employee onboarding, biometric punch logs, field crew daily attendance, leave approvals, and monthly salary disbursement cycles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveView('hrms')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-pink-600/25 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Attendance & Biometrics</span>
            </button>
            <button
              onClick={() => setActiveView('live_tracking')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Field Staff Locations</span>
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalEmployees} <span className="text-xs font-bold text-slate-500">staff</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">{activeStaff.length} active employees</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today Present</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {Math.max(1, activeStaff.length - onLeaveStaff.length)} <span className="text-xs font-bold text-emerald-600">checked in</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">96% on-time attendance</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Personnel</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {fieldStaff.length} <span className="text-xs font-bold text-amber-600">in field</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Survey, civil, installation & tech</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Payroll</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 tracking-tight">
              ₹{(totalPayrollEst / 100000).toFixed(2)} <span className="text-xs font-bold text-purple-600">Lakh</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Estimated monthly gross CTC</p>
          </div>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personnel Roster & Status</h3>
            <p className="text-xs text-slate-500">Live directory of company employees and daily work status</p>
          </div>
          <button
            onClick={() => setActiveView('hrms')}
            className="text-xs font-bold text-pink-600 hover:text-pink-700"
          >
            Manage HRMS →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {employees.slice(0, 8).map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{emp.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {emp.systemRole || emp.assignedRole}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {emp.department}
                  </td>
                  <td className="py-3 px-3">
                    {emp.isFieldWorker ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Field Engineer
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        HQ Office
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
