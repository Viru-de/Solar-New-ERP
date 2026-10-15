import React from 'react';
import { StageStatus, Priority } from '../../types/solar';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  XCircle,
  FileCheck,
  PauseCircle,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface StatusBadgeProps {
  status: StageStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
      case 'WON':
      case 'PAID':
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: status
        };
      case 'IN PROGRESS':
      case 'INSTALLATION':
      case 'ACTIVE':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: PlayCircle,
          label: status
        };
      case 'SCHEDULED':
      case 'ASSIGNED':
      case 'SITE SURVEY':
      case 'VISIT SCHEDULED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Calendar,
          label: status
        };
      case 'UNDER REVIEW':
      case 'SUBMITTED':
      case 'PROPOSAL':
      case 'QUALIFIED':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: FileCheck,
          label: status
        };
      case 'WAITING':
      case 'CONTACTED':
      case 'NEGOTIATION':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Clock,
          label: status
        };
      case 'OVERDUE':
      case 'DELAYED':
      case 'REJECTED':
      case 'BLOCKED':
      case 'LOST':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertCircle,
          label: status
        };
      case 'NOT STARTED':
      case 'NEW':
      case 'DRAFT':
      case 'PENDING':
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          icon: PauseCircle,
          label: status
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase whitespace-nowrap shadow-2xs ${config.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const map = {
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${map[priority] || map.MEDIUM}`}>
      {priority === 'URGENT' && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
      {priority}
    </span>
  );
};
