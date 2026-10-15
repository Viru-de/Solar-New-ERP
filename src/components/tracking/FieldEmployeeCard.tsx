import React, { useState, useEffect } from 'react';
import { LiveEmployeeLocation } from '../../types/tracking';
import { formatRelativeTime } from '../../services/liveLocationService';
import {
  MapPin,
  Navigation,
  Battery,
  Clock,
  Zap,
  Eye,
  AlertCircle
} from 'lucide-react';

interface FieldEmployeeCardProps {
  employee: LiveEmployeeLocation;
  isSelected: boolean;
  onSelect: (emp: LiveEmployeeLocation) => void;
  onViewDetails?: (emp: LiveEmployeeLocation) => void;
}

export const FieldEmployeeCard: React.FC<FieldEmployeeCardProps> = ({
  employee,
  isSelected,
  onSelect,
  onViewDetails
}) => {
  // Live relative time ticker
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(employee.updatedAt));

  useEffect(() => {
    setRelativeTime(formatRelativeTime(employee.updatedAt));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(employee.updatedAt));
    }, 5000);
    return () => clearInterval(interval);
  }, [employee.updatedAt]);

  const isOnline = Boolean(employee.isOnline);
  const hasGps = employee.hasLocation && typeof employee.latitude === 'number' && typeof employee.longitude === 'number';
  const isMoving = isOnline && hasGps && employee.status === 'moving';
  const isIdle = isOnline && hasGps && employee.status === 'idle';

  let statusConfig = {
    label: 'Online',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    pulse: false
  };

  if (!isOnline) {
    statusConfig = {
      label: 'Offline',
      badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
      dotColor: 'bg-slate-400',
      pulse: false
    };
  } else if (!hasGps) {
    statusConfig = {
      label: employee.isSharingLocation ? 'Online • GPS Locking' : 'Online • Standby',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      dotColor: 'bg-sky-500',
      pulse: true
    };
  } else if (isMoving) {
    statusConfig = {
      label: employee.speed && employee.speed > 0 ? `Moving (${Math.round(employee.speed)} km/h)` : 'Moving',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      pulse: true
    };
  } else {
    statusConfig = {
      label: 'Idle / At Site',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      pulse: false
    };
  }

  return (
    <div
      onClick={() => onSelect(employee)}
      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
        isSelected
          ? 'bg-amber-50/60 border-amber-400 shadow-sm ring-2 ring-amber-400/30'
          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
      }`}
    >
      {/* Card Header: Avatar, Name, Employee Code & Status */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                {employee.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
            )}
            {/* Status dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                statusConfig.dotColor
              } ${statusConfig.pulse ? 'animate-pulse' : ''}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 truncate">{employee.name}</h4>
              {employee.employeeCode && (
                <span className="text-[10px] font-mono font-medium text-slate-400">
                  {employee.employeeCode}
                </span>
              )}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">
              {employee.role}
            </div>
          </div>
        </div>

        {/* Live Status Badge */}
        <div
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusConfig.badgeBg}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} ${
              statusConfig.pulse ? 'animate-ping' : ''
            }`}
          />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Assignment / Site info */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
        {employee.assignedCustomerName ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1 truncate max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                {employee.assignedCustomerName}
              </span>
            </span>
            {hasGps && employee.distanceToSiteKm !== undefined && (
              <span className="text-[11px] font-bold text-amber-700 shrink-0">
                {employee.distanceToSiteKm < 0.1
                  ? 'At site'
                  : `${employee.distanceToSiteKm} km away`}
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No project currently assigned</div>
        )}

        {/* Telemetry Row: Speed, Battery, and Last update */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            {isMoving && employee.speed && employee.speed > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                <Navigation className="w-3 h-3 rotate-45" />
                {Math.round(employee.speed)} km/h
              </span>
            ) : hasGps ? (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                {relativeTime}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-500 text-[10px]">
                <AlertCircle className="w-3 h-3" />
                GPS Pending
              </span>
            )}

            {employee.batteryLevel !== undefined && (
              <span className="inline-flex items-center gap-0.5 text-slate-400">
                <Battery className="w-3 h-3" />
                {employee.batteryLevel}%
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewDetails) onViewDetails(employee);
              else onSelect(employee);
            }}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-0.5"
          >
            <Eye className="w-3 h-3" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
