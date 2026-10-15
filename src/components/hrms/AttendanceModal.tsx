import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Employee } from '../../types/solar';
import { getCurrentGPSPosition } from '../../services/gps';
import { X, Calendar, Clock, MapPin, Building, AlertCircle, Save, CheckCircle2, UserCheck } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: AttendanceRecord) => void;
  recordToEdit?: AttendanceRecord | null;
  employees: Employee[];
}

const ATTENDANCE_STATUSES: AttendanceRecord['status'][] = [
  'PRESENT',
  'LATE',
  'HALF DAY',
  'FIELD VISIT',
  'ABSENT'
];

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
  employees
}) => {
  const isEditing = Boolean(recordToEdit);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    date: new Date().toISOString().slice(0, 10),
    checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    checkOutTime: '',
    status: 'PRESENT' as AttendanceRecord['status'],
    siteLocation: 'Headquarters / Ahmedabad Hub',
    siteProjectTitle: '',
    latitude: 22.9868,
    longitude: 72.3789
  });

  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      let lat = 22.9868;
      let lng = 72.3789;

      if (typeof recordToEdit.checkInGps === 'object' && recordToEdit.checkInGps !== null) {
        lat = recordToEdit.checkInGps.latitude;
        lng = recordToEdit.checkInGps.longitude;
      } else if (recordToEdit.gpsCheckIn) {
        lat = recordToEdit.gpsCheckIn.latitude;
        lng = recordToEdit.gpsCheckIn.longitude;
      } else if (typeof recordToEdit.checkInGps === 'string' && recordToEdit.checkInGps.includes(',')) {
        const parts = recordToEdit.checkInGps.split(',');
        const parsedLat = parseFloat(parts[0]);
        const parsedLng = parseFloat(parts[1]);
        if (!isNaN(parsedLat)) lat = parsedLat;
        if (!isNaN(parsedLng)) lng = parsedLng;
      }

      setFormData({
        employeeId: recordToEdit.employeeId || '',
        employeeName: recordToEdit.employeeName || '',
        date: recordToEdit.date || new Date().toISOString().slice(0, 10),
        checkInTime: recordToEdit.checkInTime || '09:00 AM',
        checkOutTime: recordToEdit.checkOutTime || '',
        status: recordToEdit.status || 'PRESENT',
        siteLocation: recordToEdit.siteLocation || '',
        siteProjectTitle: recordToEdit.siteProjectTitle || '',
        latitude: lat,
        longitude: lng
      });
    } else {
      const defaultEmp = employees[0];
      const now = new Date();
      setFormData({
        employeeId: defaultEmp ? defaultEmp.id : '',
        employeeName: defaultEmp ? defaultEmp.name : '',
        date: now.toISOString().slice(0, 10),
        checkInTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOutTime: '',
        status: 'PRESENT',
        siteLocation: defaultEmp?.currentSiteLocation || 'Headquarters / Ahmedabad Hub',
        siteProjectTitle: '',
        latitude: 22.9868,
        longitude: 72.3789
      });
    }
    setErrors({});
  }, [recordToEdit, isOpen, employees]);

  if (!isOpen) return null;

  const handleEmployeeChange = (empId: string) => {
    const selected = employees.find(e => e.id === empId);
    setFormData(prev => ({
      ...prev,
      employeeId: empId,
      employeeName: selected ? selected.name : '',
      siteLocation: selected?.currentSiteLocation || prev.siteLocation
    }));
  };

  const handleFetchGPS = async () => {
    setIsFetchingGps(true);
    try {
      const gps = await getCurrentGPSPosition();
      setFormData(prev => ({
        ...prev,
        latitude: gps.latitude,
        longitude: gps.longitude,
        siteLocation: prev.siteLocation || gps.locationName
      }));
    } finally {
      setIsFetchingGps(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee.';
    }

    if (!formData.date) {
      newErrors.date = 'Attendance date is required.';
    }

    if (!formData.checkInTime.trim()) {
      newErrors.checkInTime = 'Check-in time is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const finalRecord: AttendanceRecord = {
        id: recordToEdit ? recordToEdit.id : `att-${Date.now()}`,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        date: formData.date,
        checkInTime: formData.checkInTime.trim(),
        checkOutTime: formData.checkOutTime.trim() || undefined,
        status: formData.status,
        siteLocation: formData.siteLocation.trim() || 'Solar Field Operations',
        siteProjectTitle: formData.siteProjectTitle.trim() || undefined,
        checkInGps: `${formData.latitude}, ${formData.longitude}`,
        gpsCheckIn: {
          latitude: formData.latitude,
          longitude: formData.longitude,
          locationName: formData.siteLocation.trim() || 'Verified Solar Site'
        }
      };

      onSave(finalRecord);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="attendance-modal-title" className="font-bold text-base text-slate-900">
                {isEditing ? `Edit Attendance: ${recordToEdit?.employeeName}` : 'Record Field Attendance / Punch-In'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isEditing ? 'Modify time log, site location, or check-in verification' : 'Log manual or verified field attendance for solar crew'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Please correct the following:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700">
                  {Object.values(errors).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.employeeId}
              onChange={e => handleEmployeeChange(e.target.value)}
              className={`w-full text-xs border rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                errors.employeeId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              <option value="" disabled>
                -- Choose Employee --
              </option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode}) — {emp.designation} [{emp.department}]
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-[11px] text-rose-600 mt-1">{errors.employeeId}</p>}
          </div>

          {/* Row: Date and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Attendance Date <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Status <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as AttendanceRecord['status'] })}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {ATTENDANCE_STATUSES.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Check-in and Check-out Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Check-In Time <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={formData.checkInTime}
                onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                placeholder="e.g. 09:30 AM"
                className={`w-full text-xs border rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                  errors.checkInTime ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.checkInTime && <p className="text-[11px] text-rose-600 mt-1">{errors.checkInTime}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Check-Out Time <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></span>
              </label>
              <input
                type="text"
                value={formData.checkOutTime}
                onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                placeholder="e.g. 06:45 PM"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Site Location & Project */}
          <div className="space-y-3.5 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Site Location / Verification Point</span>
              </label>
              <input
                type="text"
                value={formData.siteLocation}
                onChange={e => setFormData({ ...formData, siteLocation: e.target.value })}
                placeholder="e.g. Sanand GIDC Plot 44 Solar Installation"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Associated Project / Client <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></span>
              </label>
              <input
                type="text"
                value={formData.siteProjectTitle}
                onChange={e => setFormData({ ...formData, siteProjectTitle: e.target.value })}
                placeholder="e.g. Adani Polychem 100kW Rooftop"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* GPS Coordinates Section with Live Capture */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>GPS Geotag Verification</span>
              </span>
              <button
                type="button"
                onClick={handleFetchGPS}
                disabled={isFetchingGps}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <MapPin className="w-3 h-3" />
                <span>{isFetchingGps ? 'Querying GPS...' : 'Capture Live GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Latitude (°N)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Longitude (°E)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Record' : 'Save Attendance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
