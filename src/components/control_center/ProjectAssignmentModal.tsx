import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../../services/storage';
import { ProjectUserAssignment, ProjectAssignmentRole, Employee } from '../../types/solar';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  X,
  UserCheck,
  Briefcase,
  Layers,
  AlertCircle,
  Building,
  CheckCircle2,
  UserPlus,
  Compass,
  HardHat,
  Zap,
  Wrench,
  Sparkles,
  Shield,
  Info,
  Filter,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface ProjectAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  existingAssignment?: ProjectUserAssignment | null;
  onSuccess: () => void;
}

export type SpecialistCategory = 'ALL' | 'SURVEY_CIVIL' | 'STRUCTURE_INSTALL' | 'ELECTRICAL_TECH' | 'SERVICE' | 'SALES';

export interface SpecialistRoleOption {
  role: ProjectAssignmentRole;
  title: string;
  category: SpecialistCategory;
  department: string;
  description: string;
  badgeColor: string;
}

// Strictly curated project specialists for Solar EPC projects.
// Administrative and finance roles (Admin, Accountant, HR Manager, Customer) are strictly excluded.
export const ROLE_OPTIONS: SpecialistRoleOption[] = [
  {
    role: 'Site Survey Engineer',
    title: 'Site Survey Engineer / Site Surveyor',
    category: 'SURVEY_CIVIL',
    department: 'Engineering',
    description: 'Site feasibility, GPS coordinate logging, shadow obstruction mapping & roof load checks',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    role: 'Civil Team',
    title: 'Civil Team / Civil Engineer',
    category: 'SURVEY_CIVIL',
    department: 'Civil',
    description: 'Foundation pedestals, roof waterproofing, anchor bolting & concrete curing certification',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300'
  },
  {
    role: 'Structure Team',
    title: 'Structure Team',
    category: 'STRUCTURE_INSTALL',
    department: 'Structure',
    description: 'Elevated HDG mounting structures, tilt angle alignment & purlin torque tightening',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  {
    role: 'Installation Team',
    title: 'Installation Team',
    category: 'STRUCTURE_INSTALL',
    department: 'Installation',
    description: 'Solar PV module clamping, string wiring, roof layout & field safety compliance',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300'
  },
  {
    role: 'Electrical Team',
    title: 'Electrical Team / Electrician',
    category: 'ELECTRICAL_TECH',
    department: 'Electrical',
    description: 'Inverters, ACDB/DCDB, LT breaker tapping, transformer sync & chemical earthing pits',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  {
    role: 'Technician',
    title: 'Technician',
    category: 'ELECTRICAL_TECH',
    department: 'Service',
    description: 'Insulation testing, string VOC measurement, pre-commissioning checks & field troubleshooting',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  {
    role: 'Service Manager',
    title: 'Service Manager (Service Stage & AMC)',
    category: 'SERVICE',
    department: 'Service',
    description: 'Active AMC maintenance, breakdown response, inverter repairs & performance auditing',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  {
    role: 'Sales Executive',
    title: 'Sales Executive (Project Coordination & Liaison)',
    category: 'SALES',
    department: 'Sales',
    description: 'Account relationship manager, client contract liaison & EPC proposal follow-through',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
];

/**
 * Explicit exclusion validator:
 * The following employees/roles must not appear in the employee selection list:
 * - Admin
 * - Accountant
 * - HR Manager
 * - Customer
 * - Also any administrative, finance, or terminated staff
 */
export const isExcludedFromProjectSpecialists = (emp: Employee): boolean => {
  if (emp.status === 'TERMINATED') return true;

  const designation = (emp.designation || '').toLowerCase().trim();
  const department = (emp.department || '').toLowerCase().trim();

  // 1. Explicitly Exclude: Executive & Management
  if (
    designation.includes('managing director') ||
    designation.includes('director') ||
    department === 'management'
  ) {
    return true;
  }

  // 2. Explicitly Exclude: Admin & Administrative staff
  if (
    designation === 'admin' ||
    designation.includes('admin ') ||
    designation.includes(' admin') ||
    designation.includes('administrator') ||
    department === 'administration' ||
    (department === 'operations' && designation.includes('manager'))
  ) {
    return true;
  }

  // 3. Explicitly Exclude: Accountant & Finance staff
  if (
    designation.includes('accountant') ||
    designation.includes('account') ||
    designation.includes('tally') ||
    department === 'finance'
  ) {
    return true;
  }

  // 4. Explicitly Exclude: HR Manager & HR staff
  if (
    designation.includes('hr manager') ||
    designation.includes('human resource') ||
    designation.includes('hr & admin') ||
    designation.includes('hr ') ||
    department === 'hr'
  ) {
    return true;
  }

  // 5. Explicitly Exclude: Customer
  if (
    designation.includes('customer') ||
    designation.includes('client') ||
    department === 'customer'
  ) {
    return true;
  }

  // Ensure the employee belongs to an eligible technical/field department
  const eligibleDepts = [
    'engineering',
    'civil',
    'structure',
    'installation',
    'electrical',
    'service',
    'sales'
  ];

  if (eligibleDepts.includes(department)) {
    return false;
  }

  // Fallback: check technical keywords in designation
  const technicalKeywords = [
    'survey', 'civil', 'structure', 'fabrication', 'installation',
    'installer', 'electrical', 'electrician', 'technician', 'service'
  ];

  return !technicalKeywords.some(kw => designation.includes(kw));
};

export const ProjectAssignmentModal: React.FC<ProjectAssignmentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  existingAssignment,
  onSuccess
}) => {
  const { currentUser, canManageProjectAssignments } = useAuth();
  const { showToast, triggerRefresh } = useApp();

  const [allEligibleEmployees, setAllEligibleEmployees] = useState<Employee[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<ProjectAssignmentRole>('Site Survey Engineer');
  const [selectedCategory, setSelectedCategory] = useState<SpecialistCategory>('ALL');
  const [department, setDepartment] = useState<string>('Engineering');
  const [notes, setNotes] = useState<string>('');
  const [autoSyncStages, setAutoSyncStages] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Filter out all excluded employees: Admin, Accountant, HR Manager, Customer
      const rawEmployees = storageService.getEmployees();
      const eligible = rawEmployees.filter(emp => !isExcludedFromProjectSpecialists(emp));
      setAllEligibleEmployees(eligible);

      if (existingAssignment) {
        setSelectedUserId(existingAssignment.userId);
        setSelectedRole(existingAssignment.role);
        setDepartment(existingAssignment.department);
        setNotes(existingAssignment.notes || '');
        setIsActive(existingAssignment.isActive);
        setAutoSyncStages(true);

        const matchingRoleDef = ROLE_OPTIONS.find(r => r.role === existingAssignment.role);
        if (matchingRoleDef) {
          setSelectedCategory(matchingRoleDef.category);
        }
      } else {
        // Defaults for new assignment
        const firstEmp = eligible[0];
        if (firstEmp) {
          setSelectedUserId(firstEmp.id);
          const autoRole = detectBestRoleForEmployee(firstEmp);
          setSelectedRole(autoRole.role);
          setDepartment(firstEmp.department || autoRole.department);
        } else {
          setSelectedUserId('');
          setSelectedRole('Site Survey Engineer');
          setDepartment('Engineering');
        }
        setNotes('');
        setIsActive(true);
        setAutoSyncStages(true);
        setSelectedCategory('ALL');
      }
      setError(null);
    }
  }, [isOpen, existingAssignment]);

  // Helper to suggest the best matching role for an eligible employee
  const detectBestRoleForEmployee = (emp: Employee): SpecialistRoleOption => {
    const lowerDept = (emp.department || '').toLowerCase();
    const lowerDesig = (emp.designation || '').toLowerCase();

    let matchedRole: ProjectAssignmentRole = 'Site Survey Engineer';
    if (lowerDept.includes('survey') || lowerDesig.includes('survey')) matchedRole = 'Site Survey Engineer';
    else if (lowerDept.includes('civil') || lowerDesig.includes('civil')) matchedRole = 'Civil Team';
    else if (lowerDept.includes('structure') || lowerDesig.includes('structure') || lowerDesig.includes('fabricat')) matchedRole = 'Structure Team';
    else if (lowerDept.includes('installation') || lowerDesig.includes('install') || lowerDesig.includes('module')) matchedRole = 'Installation Team';
    else if (lowerDept.includes('elect') || lowerDesig.includes('elect')) matchedRole = 'Electrical Team';
    else if (lowerDesig.includes('technician') || lowerDesig.includes('troubleshoot')) matchedRole = 'Technician';
    else if (lowerDept.includes('service') || lowerDesig.includes('service')) matchedRole = 'Service Manager';
    else if (lowerDept.includes('sales') || lowerDesig.includes('sales')) matchedRole = 'Sales Executive';

    return ROLE_OPTIONS.find(r => r.role === matchedRole) || ROLE_OPTIONS[0];
  };

  // Filter employees list by selected domain category
  const filteredEmployees = useMemo(() => {
    if (selectedCategory === 'ALL') return allEligibleEmployees;

    return allEligibleEmployees.filter(emp => {
      const dept = (emp.department || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();

      switch (selectedCategory) {
        case 'SURVEY_CIVIL':
          return dept === 'engineering' || dept === 'civil' || desig.includes('survey') || desig.includes('civil');
        case 'STRUCTURE_INSTALL':
          return dept === 'structure' || dept === 'installation' || desig.includes('structure') || desig.includes('install');
        case 'ELECTRICAL_TECH':
          return dept === 'electrical' || desig.includes('elect') || desig.includes('technician');
        case 'SERVICE':
          return dept === 'service' || desig.includes('service') || desig.includes('amc');
        case 'SALES':
          return dept === 'sales' || desig.includes('sales');
        default:
          return true;
      }
    });
  }, [allEligibleEmployees, selectedCategory]);

  if (!isOpen) return null;

  // Handle Employee selection changes
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const emp = allEligibleEmployees.find(e => e.id === userId);
    if (emp && !existingAssignment) {
      const suggestedRole = detectBestRoleForEmployee(emp);
      setSelectedRole(suggestedRole.role);
      setDepartment(emp.department || suggestedRole.department);
    }
  };

  const handleRoleChange = (role: ProjectAssignmentRole) => {
    setSelectedRole(role);
    const roleDef = ROLE_OPTIONS.find(r => r.role === role);
    if (roleDef) {
      setDepartment(roleDef.department);
    }
  };

  const handleCategorySelect = (category: SpecialistCategory) => {
    setSelectedCategory(category);
    // If currently selected employee isn't in this category, pick the first one
    if (category !== 'ALL') {
      const firstInCat = allEligibleEmployees.find(emp => {
        const dept = (emp.department || '').toLowerCase();
        const desig = (emp.designation || '').toLowerCase();
        switch (category) {
          case 'SURVEY_CIVIL': return dept === 'engineering' || dept === 'civil' || desig.includes('survey') || desig.includes('civil');
          case 'STRUCTURE_INSTALL': return dept === 'structure' || dept === 'installation' || desig.includes('structure') || desig.includes('install');
          case 'ELECTRICAL_TECH': return dept === 'electrical' || desig.includes('elect') || desig.includes('technician');
          case 'SERVICE': return dept === 'service' || desig.includes('service');
          case 'SALES': return dept === 'sales' || desig.includes('sales');
          default: return true;
        }
      });
      if (firstInCat) {
        setSelectedUserId(firstInCat.id);
        const suggestedRole = detectBestRoleForEmployee(firstInCat);
        setSelectedRole(suggestedRole.role);
        setDepartment(firstInCat.department || suggestedRole.department);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageProjectAssignments()) {
      showToast('Permission Denied: Only Admins can assign or edit project team members.', 'error');
      return;
    }

    const emp = allEligibleEmployees.find(e => e.id === selectedUserId);
    if (!emp) {
      setError('Please select an eligible technical or field specialist.');
      return;
    }

    // Safety guard against excluded roles
    if (isExcludedFromProjectSpecialists(emp)) {
      setError(`Cannot assign ${emp.name}. Administrative, HR, and Finance users (Admin, Accountant, HR Manager, Customer) cannot be assigned as project specialists.`);
      return;
    }

    // Validate that selected role is one of the supported specialist roles
    const validRole = ROLE_OPTIONS.find(r => r.role === selectedRole);
    if (!validRole) {
      setError(`Role "${selectedRole}" is not valid. Only solar EPC field & technical specialist roles are allowed.`);
      return;
    }

    setSubmitting(true);
    try {
      const project = storageService.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Check for duplicate active assignment for same user and role
      const existingSameRole = (project.assignedUsers || []).find(
        a => a.userId === emp.id && a.role === selectedRole && a.id !== existingAssignment?.id && a.isActive
      );
      if (existingSameRole) {
        setError(`${emp.name} is already actively assigned to role "${selectedRole}" on this project.`);
        setSubmitting(false);
        return;
      }

      if (existingAssignment) {
        // Updating existing assignment
        const success = storageService.updateProjectUserAssignment(
          projectId,
          existingAssignment.id,
          {
            userId: emp.id,
            userName: emp.name,
            userEmail: emp.email,
            employeeCode: emp.employeeCode,
            role: selectedRole,
            department,
            notes,
            isActive
          },
          autoSyncStages
        );
        if (success) {
          showToast(`Updated assignment: ${emp.name} as ${selectedRole}`, 'success');
        } else {
          throw new Error('Failed to update project assignment');
        }
      } else {
        // Creating new assignment
        storageService.assignUserToProject(
          projectId,
          {
            userId: emp.id,
            userName: emp.name,
            userEmail: emp.email,
            employeeCode: emp.employeeCode,
            role: selectedRole,
            department,
            notes,
            autoSyncStages
          },
          currentUser?.name || 'Admin'
        );
        showToast(`Assigned ${emp.name} as ${selectedRole} to project`, 'success');
      }

      triggerRefresh();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing project assignment';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployee = allEligibleEmployees.find(e => e.id === selectedUserId);
  const selectedRoleDef = ROLE_OPTIONS.find(r => r.role === selectedRole);

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
      case 'Service Manager':
        return <Sparkles className="w-4 h-4 text-yellow-600" />;
      case 'Sales Executive':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      default:
        return <UserCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-amber-50/50 via-white to-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              {existingAssignment ? <Briefcase className="w-5 h-5 text-amber-700" /> : <UserPlus className="w-5 h-5 text-amber-700" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {existingAssignment ? 'Edit Project Specialist Assignment' : 'Assign Specialist to Project'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">{projectTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Explicit Policy Notice: Field/Technical Personnel Only */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">Eligible Solar EPC Specialists Only</span>
              <p className="text-[11px] text-slate-500 leading-snug">
                Showing certified field engineers, technicians, and sales coordinators. Administrative and finance staff
                (<span className="font-semibold text-slate-700">Admin, Accountant, HR Manager, Customer</span>)
                are excluded from project specialist assignments.
              </p>
            </div>
          </div>

          {/* Quick Domain Filter Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Filter by Specialty Domain</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                {allEligibleEmployees.length} Eligible Specialists
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'All Specialists' },
                { id: 'SURVEY_CIVIL', label: 'Survey & Civil' },
                { id: 'STRUCTURE_INSTALL', label: 'Structure & Install' },
                { id: 'ELECTRICAL_TECH', label: 'Electrical & Tech' },
                { id: 'SERVICE', label: 'Service & AMC' },
                { id: 'SALES', label: 'Sales Coordination' }
              ].map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id as SpecialistCategory)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specialist Employee Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Specialist <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => handleUserChange(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition-colors"
              required
            >
              <option value="" disabled>-- Select Eligible Specialist from Directory --</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode}) — {emp.designation} [{emp.department} • {emp.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Selected Specialist Highlight Card */}
          {selectedEmployee && (
            <div className="p-3.5 bg-linear-to-r from-amber-50/40 to-slate-50 border border-amber-200/70 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedEmployee.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                  alt={selectedEmployee.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover border border-white shadow-2xs shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 truncate">{selectedEmployee.name}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                      {selectedEmployee.employeeCode}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      selectedEmployee.status === 'IN FIELD'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                    {selectedEmployee.designation}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedEmployee.email}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedEmployee.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Work Role Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Project Specialist Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Technical EPC Scope</span>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value as ProjectAssignmentRole)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition-colors"
              required
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.role} value={opt.role}>
                  {opt.title} ({opt.department})
                </option>
              ))}
            </select>

            {/* Role Scope Preview Banner */}
            {selectedRoleDef && (
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {getRoleIcon(selectedRoleDef.role)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${selectedRoleDef.badgeColor}`}>
                      {selectedRoleDef.role}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Dept: {selectedRoleDef.department}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {selectedRoleDef.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Department / Operational Unit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Department / Operational Unit
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering, Civil, Electrical, Installation, Service, Sales"
              className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            />
          </div>

          {/* Assignment Scope & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assignment Scope & Project Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Responsible for structural foundation curing sign-off, module mounting torque check, and LT breaker synchronization."
              className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden resize-none"
            />
          </div>

          {/* Auto Sync Stages Checkbox */}
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="autoSyncStages"
              checked={autoSyncStages}
              onChange={(e) => setAutoSyncStages(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4 border-slate-300 cursor-pointer"
            />
            <label htmlFor="autoSyncStages" className="text-xs text-slate-700 cursor-pointer">
              <span className="font-bold text-slate-900 block">Auto-sync matching workflow stages</span>
              <span className="text-[11px] text-slate-600">
                Automatically assigns this specialist to relevant timeline stages (e.g. Site Survey, Civil Work, Structure Fabrication, Solar Installation, AC Electrical, or Testing).
              </span>
            </label>
          </div>

          {/* Active status toggle (when editing existing assignment) */}
          {existingAssignment && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800">Assignment Status</span>
                <p className="text-[11px] text-slate-500">Enable or temporarily put on hold</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {isActive ? 'Active' : 'On Hold'}
              </button>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || allEligibleEmployees.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-2xs transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>{existingAssignment ? 'Save Changes' : 'Confirm Assignment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
