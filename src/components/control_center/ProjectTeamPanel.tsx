import React, { useState } from 'react';
import { SolarProject, ProjectUserAssignment, ProjectAssignmentRole } from '../../types/solar';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import { ProjectAssignmentModal, ROLE_OPTIONS } from './ProjectAssignmentModal';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  Briefcase,
  CheckCircle2,
  Clock,
  Mail,
  AlertTriangle,
  Layers,
  Wrench,
  Zap,
  HardHat,
  Compass,
  FileSpreadsheet,
  Building,
  Sparkles
} from 'lucide-react';

interface ProjectTeamPanelProps {
  project: SolarProject;
  onProjectUpdated?: () => void;
}

// Icon helper per role
const getRoleIcon = (role: ProjectAssignmentRole) => {
  switch (role) {
    case 'Site Survey Engineer':
      return <Compass className="w-4 h-4 text-amber-600" />;
    case 'Civil Team':
      return <HardHat className="w-4 h-4 text-stone-600" />;
    case 'Structure Team':
      return <Building className="w-4 h-4 text-orange-600" />;
    case 'Installation Team':
      return <Layers className="w-4 h-4 text-cyan-600" />;
    case 'Electrical Team':
      return <Zap className="w-4 h-4 text-indigo-600" />;
    case 'Technician':
      return <Wrench className="w-4 h-4 text-sky-600" />;
    case 'Sales Executive':
      return <Briefcase className="w-4 h-4 text-emerald-600" />;
    case 'Service Manager':
      return <Sparkles className="w-4 h-4 text-yellow-600" />;
    default:
      return <Users className="w-4 h-4 text-slate-600" />;
  }
};

const getRoleBadgeClass = (role: ProjectAssignmentRole) => {
  const match = ROLE_OPTIONS.find(r => r.role === role);
  return match ? match.badgeColor : 'bg-slate-100 text-slate-800 border-slate-300';
};

export const ProjectTeamPanel: React.FC<ProjectTeamPanelProps> = ({ project, onProjectUpdated }) => {
  const { canManageProjectAssignments, isAdmin } = useAuth();
  const { showToast, triggerRefresh } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ProjectUserAssignment | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('ALL');

  const assignments: ProjectUserAssignment[] = project.assignedUsers || [];
  const activeAssignments = assignments.filter(a => a.isActive !== false);

  const handleOpenAdd = () => {
    if (!canManageProjectAssignments()) {
      showToast('Admin Authorization Required: Only an authorized Admin can assign users to projects.', 'warning');
      return;
    }
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asgn: ProjectUserAssignment) => {
    if (!canManageProjectAssignments()) {
      showToast('Admin Authorization Required: Only an authorized Admin can edit project assignments.', 'warning');
      return;
    }
    setEditingAssignment(asgn);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = (asgn: ProjectUserAssignment) => {
    if (!canManageProjectAssignments()) {
      showToast('Admin Authorization Required: Only an authorized Admin can remove assigned users.', 'warning');
      return;
    }

    const success = storageService.removeUserFromProject(project.id, asgn.id);
    if (success) {
      showToast(`Removed ${asgn.userName} (${asgn.role}) from project`, 'info');
      setDeletingAssignmentId(null);
      triggerRefresh();
      onProjectUpdated?.();
    } else {
      showToast('Failed to remove assignment', 'error');
    }
  };

  // Filtered list
  const filteredAssignments = filterRole === 'ALL'
    ? assignments
    : assignments.filter(a => a.role === filterRole);

  const canManage = canManageProjectAssignments();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Project Team & Work Roles</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {assignments.length} {assignments.length === 1 ? 'Specialist' : 'Specialists'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Multi-user role allocation across survey, civil, structure, installation, electrical, service & sales coordination
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {canManage ? (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Assign Specialist</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200" title="Only Admins can modify project team assignments">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Controlled</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Filter Chips if assignments exist */}
      {assignments.length > 0 && (
        <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/40 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filter:</span>
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
              filterRole === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({assignments.length})
          </button>
          {Array.from(new Set(assignments.map(a => a.role))).map(role => {
            const count = assignments.filter(a => a.role === role).length;
            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1 ${
                  filterRole === role
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{role}</span>
                <span className={`text-[10px] px-1.5 rounded-full ${filterRole === role ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="p-4 sm:p-5">
        {assignments.length === 0 ? (
          <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">No Specialists Assigned Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Solar projects require cross-functional teams: Site Surveyors, Civil & Structure Engineers, Electricians, and Technicians.
            </p>
            {canManage && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign First Team Member</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAssignments.map((asgn) => {
              const isDeleting = deletingAssignmentId === asgn.id;

              return (
                <div
                  key={asgn.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 hover:border-amber-300 hover:shadow-xs transition-all relative flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Role badge and Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getRoleBadgeClass(asgn.role)}`}>
                          {getRoleIcon(asgn.role)}
                          <span>{asgn.role}</span>
                        </span>
                        {asgn.department && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {asgn.department}
                          </span>
                        )}
                      </div>

                      {asgn.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
                          <span>On Hold</span>
                        </span>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {asgn.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {asgn.userName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          {asgn.employeeCode && (
                            <span className="font-mono text-slate-600 font-semibold">{asgn.employeeCode}</span>
                          )}
                          {asgn.userEmail && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{asgn.userEmail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scope / Notes */}
                    {asgn.notes && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100 mb-2 leading-relaxed">
                        {asgn.notes}
                      </p>
                    )}
                  </div>

                  {/* Card Bottom Meta & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Assigned {new Date(asgn.assignedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Admin Actions */}
                    {canManage && (
                      <div className="flex items-center gap-1">
                        {isDeleting ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-md border border-rose-200">
                            <span className="text-[10px] text-rose-700 font-bold">Confirm?</span>
                            <button
                              onClick={() => handleConfirmDelete(asgn)}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingAssignmentId(null)}
                              className="px-1 py-0.5 text-slate-500 hover:text-slate-800 text-[10px]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(asgn)}
                              className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                              title="Edit assignment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingAssignmentId(asgn.id)}
                              className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title="Remove from project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <ProjectAssignmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAssignment(null);
          }}
          projectId={project.id}
          projectTitle={`${project.title} (${project.projectCode})`}
          existingAssignment={editingAssignment}
          onSuccess={() => {
            onProjectUpdated?.();
          }}
        />
      )}
    </div>
  );
};
