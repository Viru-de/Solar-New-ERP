import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import { UserRole, Employee } from '../../types/solar';
import {
  SystemAclConfig,
  AclRoleMetadata,
  AclPermissionDefinition,
  AclAuditLogEntry,
  AclDomain
} from '../../types/acl';
import {
  ACL_ROLES_METADATA,
  ACL_PERMISSIONS_CATALOG,
  ACL_DOMAINS,
  DEFAULT_SYSTEM_ACL_CONFIG
} from '../../services/aclDefaults';
import {
  ShieldCheck,
  Users,
  Grid,
  History,
  FileCheck2,
  Lock,
  RotateCcw,
  Save,
  Check,
  X,
  AlertTriangle,
  Search,
  Download,
  Upload,
  UserCheck,
  Layers,
  Sparkles,
  ChevronRight,
  Sliders,
  ExternalLink,
  Info,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const RoleBasedAccessControlPanel: React.FC = () => {
  const { currentRole, currentUser, switchPersona } = useAuth();
  const { showToast, triggerRefresh } = useApp();

  // Active view tab inside the ACL module
  const [aclTab, setAclTab] = useState<'configurator' | 'matrix' | 'users' | 'audit'>('configurator');

  // Load and manage ACL config
  const [aclConfig, setAclConfig] = useState<SystemAclConfig>(() => storageService.getAclConfig());
  const [selectedRole, setSelectedRole] = useState<UserRole>('Project Manager');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [permissionSearch, setPermissionSearch] = useState<string>('');
  const [matrixDomainFilter, setMatrixDomainFilter] = useState<AclDomain | 'ALL'>('ALL');
  const [userSearch, setUserSearch] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AclAuditLogEntry[]>(() => storageService.getAclAuditLogs());

  // Track pending unsaved changes for the selected role in Configurator
  const [pendingRolePerms, setPendingRolePerms] = useState<Record<string, boolean>>(() => {
    return { ...(aclConfig[selectedRole] || {}) };
  });
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);

  // Employees directory for role assignment
  const [employees, setEmployees] = useState<Employee[]>(() => storageService.getEmployees());

  // Whenever selectedRole changes, reset the pending edits to the stored role perms
  const handleRoleSelect = (role: UserRole) => {
    if (hasPendingChanges) {
      if (!window.confirm('You have unsaved permission changes. Switch role and discard edits?')) {
        return;
      }
    }
    setSelectedRole(role);
    setPendingRolePerms({ ...(aclConfig[role] || {}) });
    setHasPendingChanges(false);
  };

  const selectedRoleMeta = useMemo<AclRoleMetadata>(() => {
    return (
      ACL_ROLES_METADATA.find(r => r.role === selectedRole) || {
        role: selectedRole,
        department: 'Operations',
        hierarchyLevel: 3,
        hierarchyLabel: 'Field Specialist',
        description: 'Operational team member',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
      }
    );
  }, [selectedRole]);

  // Count employees assigned to each role
  const roleUserCounts = useMemo(() => {
    const map: Record<string, number> = {};
    ACL_ROLES_METADATA.forEach(r => {
      map[r.role] = 0;
    });
    employees.forEach(emp => {
      const matched = ACL_ROLES_METADATA.find(
        r => r.role.toLowerCase() === (emp.assignedRole || emp.designation || '').toLowerCase()
      );
      if (matched) {
        map[matched.role] = (map[matched.role] || 0) + 1;
      } else {
        // Match by role if designated
        if (emp.assignedRole && map[emp.assignedRole] !== undefined) {
          map[emp.assignedRole] = (map[emp.assignedRole] || 0) + 1;
        }
      }
    });
    return map;
  }, [employees]);

  // Filtered roles list for selector
  const filteredRoles = useMemo(() => {
    if (departmentFilter === 'ALL') return ACL_ROLES_METADATA;
    return ACL_ROLES_METADATA.filter(r => r.department.toLowerCase() === departmentFilter.toLowerCase());
  }, [departmentFilter]);

  // Unique departments
  const departments = useMemo(() => {
    const list = Array.from(new Set(ACL_ROLES_METADATA.map(r => r.department)));
    return ['ALL', ...list];
  }, []);

  // Filter permissions for configurator
  const filteredPermissions = useMemo(() => {
    let list = ACL_PERMISSIONS_CATALOG;
    if (permissionSearch.trim()) {
      const q = permissionSearch.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.domainLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [permissionSearch]);

  // Group filtered permissions by domain
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, AclPermissionDefinition[]> = {};
    filteredPermissions.forEach(p => {
      if (!groups[p.domain]) groups[p.domain] = [];
      groups[p.domain].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  // Toggle single permission for current selected role
  const handleTogglePermission = (permissionId: string) => {
    if (selectedRole === 'Admin') {
      showToast('Admin root authority is immutable to prevent security lockouts', 'info');
      return;
    }
    setPendingRolePerms(prev => {
      const updated = { ...prev, [permissionId]: !prev[permissionId] };
      setHasPendingChanges(true);
      return updated;
    });
  };

  // Toggle permission directly from Matrix table
  const handleMatrixToggle = (role: UserRole, permissionId: string) => {
    if (role === 'Admin') {
      showToast('Admin root authority cannot be modified', 'info');
      return;
    }
    const currentVal = Boolean(aclConfig[role]?.[permissionId]);
    const newVal = !currentVal;

    const newConfig = {
      ...aclConfig,
      [role]: {
        ...(aclConfig[role] || {}),
        [permissionId]: newVal
      }
    };

    setAclConfig(newConfig);
    storageService.updateRolePermissions(
      role,
      { [permissionId]: newVal },
      currentUser?.name || 'Administrator',
      `${newVal ? 'Granted' : 'Revoked'} ${permissionId} for ${role}`
    );

    if (selectedRole === role) {
      setPendingRolePerms(newConfig[role]);
    }

    setAuditLogs(storageService.getAclAuditLogs());
    showToast(`${newVal ? 'Granted' : 'Revoked'} permission for ${role}`, 'success');
  };

  // Bulk toggle for a domain in Configurator
  const handleBulkDomainToggle = (domain: string, grant: boolean) => {
    if (selectedRole === 'Admin') {
      showToast('Admin permissions are fixed as root authority', 'info');
      return;
    }
    const domainPerms = ACL_PERMISSIONS_CATALOG.filter(p => p.domain === domain);
    setPendingRolePerms(prev => {
      const updated = { ...prev };
      domainPerms.forEach(p => {
        updated[p.id] = grant;
      });
      setHasPendingChanges(true);
      return updated;
    });
  };

  // Save current role edits
  const handleSaveRole = () => {
    storageService.updateRolePermissions(
      selectedRole,
      pendingRolePerms,
      currentUser?.name || 'Administrator',
      `Modified operational permissions for ${selectedRole}`
    );

    const updatedConfig = storageService.getAclConfig();
    setAclConfig(updatedConfig);
    setHasPendingChanges(false);
    setAuditLogs(storageService.getAclAuditLogs());
    triggerRefresh();
    showToast(`Saved ACL security policies for ${selectedRole}`, 'success');
  };

  // Reset selected role to default
  const handleResetRole = () => {
    if (window.confirm(`Reset ${selectedRole} back to standard Solar EPC default permissions?`)) {
      const updated = storageService.resetRoleAclToDefault(selectedRole, currentUser?.name || 'Administrator');
      setAclConfig(updated);
      setPendingRolePerms({ ...(updated[selectedRole] || {}) });
      setHasPendingChanges(false);
      setAuditLogs(storageService.getAclAuditLogs());
      triggerRefresh();
      showToast(`Restored default permissions for ${selectedRole}`, 'info');
    }
  };

  // Reset ALL roles to default
  const handleResetAll = () => {
    if (
      window.confirm(
        'EMERGENCY RESTORE: Reset ALL 15 roles back to factory default Solar EPC access control policies?'
      )
    ) {
      const updated = storageService.resetAllAclToDefault(currentUser?.name || 'Administrator');
      setAclConfig(updated);
      setPendingRolePerms({ ...(updated[selectedRole] || {}) });
      setHasPendingChanges(false);
      setAuditLogs(storageService.getAclAuditLogs());
      triggerRefresh();
      showToast('Restored baseline ACL configuration across all 15 operational tiers', 'success');
    }
  };

  // Copy permissions from another role
  const handleCopyFromRole = (sourceRole: UserRole) => {
    if (selectedRole === 'Admin') return;
    const sourcePerms = aclConfig[sourceRole] || DEFAULT_SYSTEM_ACL_CONFIG[sourceRole] || {};
    setPendingRolePerms({ ...sourcePerms });
    setHasPendingChanges(true);
    showToast(`Copied permissions from ${sourceRole}. Click Save to apply.`, 'info');
  };

  // Test persona switch
  const handleTestPersona = (roleToTest: UserRole) => {
    const testProfile = {
      id: `test-${roleToTest.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${roleToTest} (Test Mode)`,
      email: `${roleToTest.toLowerCase().replace(/\s+/g, '.')}@solarpulse.com`,
      role: roleToTest,
      phone: '+91 98000 00000',
      department: selectedRoleMeta.department,
      designation: roleToTest,
      assignedProjects: []
    };
    switchPersona(testProfile);
    showToast(`Switched active session to test as "${roleToTest}"`, 'info');
  };

  // Reassign an employee's role in the Users tab
  const handleEmployeeRoleChange = (empId: string, newRole: UserRole) => {
    const updated = employees.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          assignedRole: newRole,
          designation: newRole
        };
      }
      return emp;
    });

    setEmployees(updated);
    const updatedTarget = updated.find(e => e.id === empId);
    if (updatedTarget) {
      storageService.saveEmployee(updatedTarget);
    } else {
      storageService.saveEmployees(updated);
    }
    storageService.addAclAuditLog({
      changedBy: currentUser?.name || 'Administrator',
      targetRole: newRole,
      action: 'REASSIGN_USER',
      summary: `Assigned role ${newRole} to employee ${empId}`
    });
    setAuditLogs(storageService.getAclAuditLogs());
    showToast(`Updated employee operational role to ${newRole}`, 'success');
  };

  // Export ACL config as JSON
  const handleExportAcl = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(aclConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `solar-epc-acl-policy-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Downloaded ACL configuration backup JSON', 'success');
  };

  // Import ACL config from JSON
  const handleImportAcl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object' && parsed['Admin']) {
          storageService.saveAclConfig(parsed);
          setAclConfig(parsed);
          setPendingRolePerms({ ...(parsed[selectedRole] || {}) });
          storageService.addAclAuditLog({
            changedBy: currentUser?.name || 'Administrator',
            targetRole: 'Admin',
            action: 'IMPORT_CONFIG',
            summary: `Imported ACL policy configuration from file "${file.name}"`
          });
          setAuditLogs(storageService.getAclAuditLogs());
          triggerRefresh();
          showToast('Successfully imported and applied ACL policy configuration', 'success');
        } else {
          showToast('Invalid ACL policy JSON format', 'error');
        }
      } catch (err) {
        showToast('Failed to parse uploaded JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Stats for the selected role in Configurator
  const roleGrantedCount = useMemo(() => {
    return Object.values(pendingRolePerms).filter(Boolean).length;
  }, [pendingRolePerms]);

  const totalPermissionsCount = ACL_PERMISSIONS_CATALOG.length;
  const grantedPercentage = Math.round((roleGrantedCount / totalPermissionsCount) * 100);

  // Filtered matrix rows
  const matrixPermissions = useMemo(() => {
    let list = ACL_PERMISSIONS_CATALOG;
    if (matrixDomainFilter !== 'ALL') {
      list = list.filter(p => p.domain === matrixDomainFilter);
    }
    if (permissionSearch.trim()) {
      const q = permissionSearch.toLowerCase();
      list = list.filter(
        p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.domainLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [matrixDomainFilter, permissionSearch]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!userSearch.trim()) return employees;
    const q = userSearch.toLowerCase();
    return employees.filter(
      emp =>
        emp.name.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        (emp.assignedRole || '').toLowerCase().includes(q)
    );
  }, [employees, userSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Module Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                Access Control List (ACL)
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">Security & Operational Governance</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                15 Tiers Enforced
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
              Role-Based Access Control
            </h2>
            <p className="text-xs text-slate-500 max-w-3xl mt-1 leading-relaxed">
              Fine-grained authorization, operational boundaries, milestone approvals, and security policies governing the
              turnkey Solar EPC project lifecycle.
            </p>
          </div>

          {/* Quick Global Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={handleExportAcl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
              title="Download full ACL JSON backup"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportAcl} className="hidden" />
            </label>

            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs"
              title="Emergency restore factory Solar EPC permissions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Factory Reset</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs within ACL */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setAclTab('configurator')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              aclTab === 'configurator'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Role Permissions Configurator</span>
            {hasPendingChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setAclTab('matrix')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              aclTab === 'matrix'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Interactive Matrix Grid</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100/50 text-current">
              15 × {totalPermissionsCount}
            </span>
          </button>

          <button
            onClick={() => setAclTab('users')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              aclTab === 'users'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Role Allocations & Testing</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700">
              {employees.length} Users
            </span>
          </button>

          <button
            onClick={() => setAclTab('audit')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              aclTab === 'audit'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit History & Policies</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700">
              {auditLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROLE PERMISSIONS CONFIGURATOR                                      */}
      {/* ========================================================================= */}
      {aclTab === 'configurator' && (
        <div className="space-y-6">
          {/* Department Filter & Role Selection Carousel/Chips */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Operational Role</h3>
                <p className="text-xs text-slate-500">
                  Switch between roles to inspect active entitlements and tailor access permissions
                </p>
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Dept:
                </span>
                {departments.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setDepartmentFilter(dept)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      departmentFilter === dept
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Cards Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {filteredRoles.map(r => {
                const isSelected = selectedRole === r.role;
                const userCount = roleUserCounts[r.role] || 0;
                return (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSelect(r.role)}
                    className={`text-left p-3 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-white text-slate-700">
                        {r.department}
                      </span>
                      {r.isSystemLocked && (
                        <span title="System Locked Root Role">
                          <Lock className="w-3 h-3 text-purple-600" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate" title={r.role}>
                      {r.role}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                      <span>{r.hierarchyLabel.split(' ')[0]}</span>
                      <span className="font-semibold text-slate-700">{userCount} staff</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Role Detail Hero Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-black text-lg shadow-2xs shrink-0">
                  {selectedRole.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedRole}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedRoleMeta.badgeColor}`}>
                      {selectedRoleMeta.department}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Tier {selectedRoleMeta.hierarchyLevel} • {selectedRoleMeta.hierarchyLabel}
                    </span>
                    {selectedRoleMeta.isSystemLocked && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Root Authority
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedRoleMeta.description}</p>
                </div>
              </div>

              {/* Action Buttons for Role */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => handleTestPersona(selectedRole)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs"
                  title="Switch preview session to this role"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Test as this Role</span>
                </button>

                {/* Copy from role dropdown */}
                <div className="relative inline-block text-left">
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) handleCopyFromRole(e.target.value as UserRole);
                    }}
                    disabled={selectedRole === 'Admin'}
                    className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Copy from Role...
                    </option>
                    {ACL_ROLES_METADATA.filter(r => r.role !== selectedRole).map(r => (
                      <option key={r.role} value={r.role}>
                        Copy: {r.role}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleResetRole}
                  disabled={selectedRole === 'Admin'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
                  title="Restore Solar EPC defaults for this role"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={!hasPendingChanges || selectedRole === 'Admin'}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                    hasPendingChanges && selectedRole !== 'Admin'
                      ? 'bg-purple-600 text-white hover:bg-purple-700 animate-pulse'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Role</span>
                </button>
              </div>
            </div>

            {/* Role Entitlement Gauge */}
            <div className="mt-4 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Entitlement Coverage:</span>
                <div className="w-48 sm:w-64 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${grantedPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-black text-purple-700">
                  {roleGrantedCount} / {totalPermissionsCount} ({grantedPercentage}%)
                </span>
              </div>

              {/* Search permission within configurator */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={permissionSearch}
                  onChange={e => setPermissionSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-purple-400"
                />
                {permissionSearch && (
                  <button
                    onClick={() => setPermissionSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Granular Permission Domain Cards */}
          <div className="space-y-4">
            {ACL_DOMAINS.map(domain => {
              const permsInDomain = groupedPermissions[domain.id];
              if (!permsInDomain || permsInDomain.length === 0) return null;

              const grantedInDomain = permsInDomain.filter(p => pendingRolePerms[p.id]).length;
              const isAllGranted = grantedInDomain === permsInDomain.length;

              return (
                <div
                  key={domain.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
                >
                  {/* Domain Header */}
                  <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                        <Layers className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{domain.label}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${domain.badgeColor}`}>
                            {grantedInDomain} of {permsInDomain.length} Granted
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{domain.description}</p>
                      </div>
                    </div>

                    {/* Quick domain bulk toggle */}
                    {selectedRole !== 'Admin' && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleBulkDomainToggle(domain.id, true)}
                          className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          Grant All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkDomainToggle(domain.id, false)}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          Revoke All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Permissions Grid in Domain */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {permsInDomain.map(perm => {
                      const isGranted = Boolean(pendingRolePerms[perm.id]);
                      const isLocked = selectedRole === 'Admin';

                      return (
                        <div
                          key={perm.id}
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            isGranted
                              ? 'bg-purple-50/40 border-purple-200'
                              : 'bg-slate-50/40 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1 flex-1 pr-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{perm.name}</span>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold border ${
                                  perm.riskLevel === 'CRITICAL'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : perm.riskLevel === 'HIGH'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : perm.riskLevel === 'MEDIUM'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {perm.riskLevel}
                              </span>
                              {perm.actions.map(act => (
                                <span
                                  key={act}
                                  className="text-[9px] px-1 py-0.2 rounded bg-white text-slate-500 border border-slate-200 uppercase font-bold"
                                >
                                  {act}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{perm.description}</p>
                            <span className="text-[9px] font-mono text-slate-400 block">{perm.id}</span>
                          </div>

                          {/* Switch / Toggle */}
                          <div className="shrink-0 pt-0.5">
                            {isLocked ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-lg border border-purple-200">
                                <Lock className="w-3 h-3" />
                                <span>Root</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(perm.id)}
                                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-hidden ${
                                  isGranted ? 'bg-purple-600' : 'bg-slate-300'
                                }`}
                                aria-label={`Toggle ${perm.name}`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform ${
                                    isGranted ? 'left-6' : 'left-1'
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Save Bar when changes exist */}
          {hasPendingChanges && selectedRole !== 'Admin' && (
            <div className="sticky bottom-4 z-20 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold">Unsaved changes for role: {selectedRole}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingRolePerms({ ...(aclConfig[selectedRole] || {}) });
                    setHasPendingChanges(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-sm transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply Changes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CROSS-ROLE INTERACTIVE MATRIX GRID                                 */}
      {/* ========================================================================= */}
      {aclTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4">
          {/* Matrix Top Filters */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cross-Role Permissions Matrix</h3>
              <p className="text-xs text-slate-500">
                Directly compare and toggle operational entitlements across all 15 Solar EPC tiers
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Domain Filter */}
              <select
                value={matrixDomainFilter}
                onChange={e => setMatrixDomainFilter(e.target.value as any)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"
              >
                <option value="ALL">All 9 Domains</option>
                {ACL_DOMAINS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter matrix rows..."
                  value={permissionSearch}
                  onChange={e => setPermissionSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700">
                  <th className="p-3.5 sticky left-0 z-10 bg-slate-50 min-w-[260px] font-bold border-r border-slate-200/80">
                    Functional Permission
                  </th>
                  {ACL_ROLES_METADATA.map(r => (
                    <th
                      key={r.role}
                      className="p-2.5 text-center min-w-[110px] font-bold border-r border-slate-200/60"
                      title={r.role}
                    >
                      <div className="truncate text-[11px] font-bold text-slate-900">{r.role}</div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border ${r.badgeColor}`}>
                        {r.department}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixPermissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="p-3.5 sticky left-0 z-10 bg-white border-r border-slate-200/80">
                      <div className="font-bold text-slate-900 leading-tight">{perm.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-slate-400 font-mono">{perm.id}</span>
                        <span
                          className={`text-[9px] px-1 rounded font-semibold border ${
                            perm.riskLevel === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : perm.riskLevel === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {perm.riskLevel}
                        </span>
                      </div>
                    </td>

                    {ACL_ROLES_METADATA.map(r => {
                      const isGranted = Boolean(aclConfig[r.role]?.[perm.id]);
                      const isRoot = r.role === 'Admin';

                      return (
                        <td
                          key={r.role}
                          onClick={() => !isRoot && handleMatrixToggle(r.role, perm.id)}
                          className={`p-2.5 text-center border-r border-slate-100 transition-colors cursor-pointer ${
                            isRoot
                              ? 'bg-purple-50/20 cursor-default'
                              : isGranted
                              ? 'hover:bg-emerald-50'
                              : 'hover:bg-slate-100'
                          }`}
                          title={
                            isRoot
                              ? 'Admin (Root authority)'
                              : `Click to ${isGranted ? 'Revoke' : 'Grant'} for ${r.role}`
                          }
                        >
                          <div className="flex items-center justify-center">
                            {isRoot ? (
                              <span className="w-6 h-6 rounded-md bg-purple-100 border border-purple-300 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                                <Lock className="w-3 h-3" />
                              </span>
                            ) : isGranted ? (
                              <span className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-[11px] shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-[10px]">
                                <X className="w-3 h-3 stroke-[2]" />
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Showing {matrixPermissions.length} permissions across 15 operational tiers. Click any cell to toggle.
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Granted
              </span>
              <span className="flex items-center gap-1 text-slate-400 font-semibold">
                <X className="w-3.5 h-3.5 text-slate-400" /> Denied
              </span>
              <span className="flex items-center gap-1 text-purple-800 font-semibold">
                <Lock className="w-3.5 h-3.5 text-purple-600" /> Root Locked
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USER ROLE ALLOCATIONS & TESTING                                    */}
      {/* ========================================================================= */}
      {aclTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Role Directory & Testing</h3>
              <p className="text-xs text-slate-500">
                Reassign employee operational tiers and preview the application interface from their viewpoint
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff or code..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500 font-bold bg-slate-50/50">
                  <th className="p-3 rounded-l-xl">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Assigned Role (ACL Tier)</th>
                  <th className="p-3">Entitlements</th>
                  <th className="p-3 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const currentRoleForEmp: UserRole = emp.assignedRole || (emp.designation as UserRole) || 'Technician';
                  const roleMeta = ACL_ROLES_METADATA.find(r => r.role === currentRoleForEmp);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {emp.photoUrl ? (
                            <img
                              src={emp.photoUrl}
                              alt={emp.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{emp.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="text-xs text-slate-700 font-medium">{emp.department}</span>
                      </td>

                      <td className="p-3">
                        <select
                          value={currentRoleForEmp}
                          onChange={e => handleEmployeeRoleChange(emp.id, e.target.value as UserRole)}
                          className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-purple-400"
                        >
                          {ACL_ROLES_METADATA.map(r => (
                            <option key={r.role} value={r.role}>
                              {r.role} ({r.department})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleMeta?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                          {roleMeta?.hierarchyLabel || 'Staff'}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestPersona(currentRoleForEmp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Switch Persona</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT HISTORY & SECURITY POLICIES                                  */}
      {/* ========================================================================= */}
      {aclTab === 'audit' && (
        <div className="space-y-6">
          {/* Solar EPC Security Policies / Guardrails */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Solar EPC Turnkey Security Guardrails</h3>
                <p className="text-xs text-slate-500">Core operational compliance standards enforced by this system</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> Stage Approval Dual-Control
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Field engineers submit checklists and geolocated photos; only Project Managers and Admins can officially close stages.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> Least Privilege for Field
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Civil, Structure, and Electrical teams execute physical milestones without visibility into company finance or customer billing.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> Tally Prime Integrity
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Direct XML voucher push over ODBC requires Finance Accountant or Admin credentials to ensure ledger compliance.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> Root Protection Policy
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Admin role is protected against permission revoking to prevent self-lockout scenarios.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Access Control Audit Trail</h3>
                  <p className="text-xs text-slate-500">Immutable chronological record of permission and role adjustments</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {auditLogs.length} Records Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-500 font-bold bg-slate-50/50">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Target Role</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{log.changedBy}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-bold bg-purple-50 text-purple-800 border border-purple-200 text-[10px]">
                          {log.targetRole}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
