import React, { useState, useEffect } from 'react';
import { LiveEmployeeLocation } from '../../types/tracking';
import { formatRelativeTime } from '../../services/liveLocationService';
import { useApp } from '../../context/AppContext';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Navigation,
  Compass,
  Battery,
  Clock,
  Briefcase,
  ExternalLink,
  User,
  ShieldAlert
} from 'lucide-react';

interface FieldEmployeeDetailsModalProps {
  employee: LiveEmployeeLocation | null;
  isOpen: boolean;
  onClose: () => void;
  onCenterOnMap: (emp: LiveEmployeeLocation) => void;
  followSelected: boolean;
  onToggleFollow: () => void;
}

export const FieldEmployeeDetailsModal: React.FC<FieldEmployeeDetailsModalProps> = ({
  employee,
  isOpen,
  onClose,
  onCenterOnMap,
  followSelected,
  onToggleFollow
}) => {
  const { openCustomerControlCenter, openWhatsAppModal, setActiveView } = useApp();
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    if (!employee) return;
    setRelativeTime(formatRelativeTime(employee.updatedAt));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(employee.updatedAt));
    }, 4000);
    return () => clearInterval(interval);
  }, [employee]);

  if (!isOpen || !employee) return null;

  const hasGps = employee.hasLocation && typeof employee.latitude === 'number' && typeof employee.longitude === 'number';
  const isMoving = hasGps && employee.status === 'moving';
  const isIdle = hasGps && employee.status === 'idle';
  const isOffline = !hasGps || employee.status === 'offline';

  const handleOpenWhatsApp = () => {
    if (!employee.phone) return;
    openWhatsAppModal(
      employee.phone,
      employee.name,
      'TEXT',
      `Hello ${employee.name}, please update on your current field assignment (${employee.assignedCustomerName || 'Solar EPC Site'}).`
    );
  };

  const handleOpenProject = () => {
    if (employee.assignedProjectId) {
      openCustomerControlCenter('', employee.assignedProjectId);
      onClose();
    }
  };

  const handleViewEmployee = () => {
    setActiveView('hrms');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {employee.avatar ? (
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-base flex items-center justify-center border-2 border-white shadow-md">
                  {employee.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  !hasGps
                    ? 'bg-rose-500'
                    : isMoving
                    ? 'bg-emerald-500 animate-pulse'
                    : isIdle
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {employee.name}
                </h3>
                {employee.employeeCode && (
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    {employee.employeeCode}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {employee.role}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    !hasGps
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isMoving
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isIdle
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      !hasGps ? 'bg-rose-500' : isMoving ? 'bg-emerald-500 animate-ping' : isIdle ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {!hasGps ? 'Location unavailable' : isMoving ? '🟢 LIVE (Moving)' : isIdle ? '🟡 LIVE (At Site)' : '⚫ Offline'}
                  </span>
                </span>

                {employee.batteryLevel !== undefined && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                    <Battery className="w-3 h-3" />
                    <span>{employee.batteryLevel}% battery</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Movement & Telemetry Box */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Movement</span>
              <span className="text-xs font-black text-slate-800">
                {!hasGps ? 'Standby' : isMoving ? 'Moving' : isIdle ? 'At Site' : 'Offline'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Speed</span>
              <span className="text-xs font-black text-slate-800">
                {hasGps && employee.speed ? `${Math.round(employee.speed)} km/h` : '0 km/h'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Accuracy</span>
              <span className="text-xs font-black text-slate-800">
                {hasGps && employee.accuracy ? `±${Math.round(employee.accuracy)} m` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Current Location & Last Updated */}
          <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Current Location:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {hasGps
                  ? `${employee.latitude?.toFixed(4)}°, ${employee.longitude?.toFixed(4)}°`
                  : 'Location unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Last Updated:</span>
              <span className="font-semibold text-slate-800">
                {hasGps ? relativeTime : 'Waiting for GPS transmission'}
              </span>
            </div>
          </div>

          {/* Assigned Project Site */}
          <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Current Assignment</span>
              </span>
              {employee.assignedProjectId && (
                <button
                  onClick={handleOpenProject}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <span>View Project</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {employee.assignedCustomerName ? (
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  Customer: {employee.assignedCustomerName}
                </div>
                {employee.assignedProjectTitle && (
                  <div className="text-xs text-slate-600 font-medium">
                    {employee.assignedProjectTitle}
                  </div>
                )}
                {employee.assignedSiteAddress && (
                  <div className="text-xs text-slate-500">
                    {employee.assignedSiteAddress}
                  </div>
                )}

                {hasGps && employee.distanceToSiteKm !== undefined && (
                  <div className="mt-2 pt-2 border-t border-amber-200/50 flex items-center justify-between text-xs">
                    <span className="text-slate-600">Distance to site:</span>
                    <span className="font-black text-amber-800">
                      {employee.distanceToSiteKm < 0.1
                        ? 'At site (0 km)'
                        : `${employee.distanceToSiteKm} km`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No active project assignment. Field staff on standby.
              </p>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
          {/* Communication & Directory Buttons */}
          <div className="flex items-center gap-2">
            {employee.phone && (
              <>
                <a
                  href={`tel:${employee.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleViewEmployee}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>View Employee</span>
            </button>
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFollow}
              className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                followSelected
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{followSelected ? 'Following' : 'Follow Employee'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onCenterOnMap(employee);
                onClose();
              }}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-2xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Center on Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
