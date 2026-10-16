import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/solar';
import { storageService } from '../services/storage';
import { liveLocationService } from '../services/liveLocationService';
import { apiClient } from '../services/apiClient';

export interface RoleDefinition {
  role: UserRole;
  department: string;
  description: string;
  badgeColor: string;
  isFieldWorkerDefault?: boolean;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'Admin',
    department: 'Administration',
    description: 'Master system authority, user management, financial approvals & administrative control',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    isFieldWorkerDefault: false
  },
  {
    role: 'Sales Manager',
    department: 'Sales',
    description: 'Pipeline analytics, commercial quoting, revenue targets & lead assignments',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    isFieldWorkerDefault: false
  },
  {
    role: 'Sales Executive',
    department: 'Sales',
    description: 'Lead generation, customer site visits, proposal follow-ups & CRM conversion',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    isFieldWorkerDefault: false
  },
  {
    role: 'Project Manager',
    department: 'Operations',
    description: '14-stage EPC milestones, stage approvals, resource scheduling & contractor oversight',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    isFieldWorkerDefault: false
  },
  {
    role: 'Site Survey Engineer',
    department: 'Engineering',
    description: 'Site feasibility audits, roof structure load, solar radiance, azimuth & shadow analysis',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    isFieldWorkerDefault: true
  },
  {
    role: 'Site Inspector',
    department: 'Engineering',
    description: 'Installation quality audits, safety compliance checks, punchlists & milestone sign-offs',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    isFieldWorkerDefault: true
  },
  {
    role: 'Civil Team',
    department: 'Civil',
    description: 'RCC pedestal casting, chemical anchoring, roof penetrations & civil structural safety',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
    isFieldWorkerDefault: true
  },
  {
    role: 'Structure Team',
    department: 'Structure',
    description: 'Module mounting structures (MMS), column fabrication, tilt torque & wind shear alignment',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    isFieldWorkerDefault: true
  },
  {
    role: 'Installation Team',
    department: 'Installation',
    description: 'Solar PV module clamping, string cabling, inter-module jumpering & array leveling',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    isFieldWorkerDefault: true
  },
  {
    role: 'Electrical Team',
    department: 'Electrical',
    description: 'On-grid inverters, HT/LT ACDB-DCDB panels, chemical earthing pits & lightning arresters',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    isFieldWorkerDefault: true
  },
  {
    role: 'Accountant',
    department: 'Finance',
    description: 'Milestone billing, GST sales invoices, expense vouchers & Tally Prime ODBC integration',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    isFieldWorkerDefault: false
  },
  {
    role: 'Service Manager',
    department: 'Service',
    description: 'Preventive maintenance, AMC lifecycle renewals, fault SLA telemetry & ticket routing',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    isFieldWorkerDefault: false
  },
  {
    role: 'Technician',
    department: 'Service',
    description: 'Field ticket remediation, string inverter replacement, thermal hotspot drone scans',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    isFieldWorkerDefault: true
  },
  {
    role: 'HR Manager',
    department: 'HR',
    description: 'Staff directory, field wage payroll, geofence attendance stamps & performance appraisals',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300',
    isFieldWorkerDefault: false
  },
  {
    role: 'Customer',
    department: 'Customer',
    description: 'Real-time project milestone tracking, quotation downloads, net-metering status & warranty portal',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    isFieldWorkerDefault: false
  }
];

export interface DemoAccount {
  name: string;
  email: string;
  role: UserRole;
  password: string;
  department: string;
  isFieldWorker?: boolean;
  profile: UserProfile;
  description: string;
  badgeColor: string;
}

/**
 * Default password for all local/development/demo accounts.
 * WARNING: This credential is strictly for local development and demonstration environments.
 * It must NEVER be used in production environments.
 */
export const DEMO_DEFAULT_PASSWORD = '123456';

export const DEMO_ACCOUNTS: DemoAccount[] = ROLE_DEFINITIONS.map((r, idx) => ({
  name: `${r.role} Demo`,
  email: `${r.role.toLowerCase().replace(/[^a-z0-9]/g, '')}@rejoysolar.com`,
  role: r.role,
  password: DEMO_DEFAULT_PASSWORD,
  department: r.department,
  isFieldWorker: Boolean(r.isFieldWorkerDefault),
  profile: {
    id: `demo-usr-${idx + 1}`,
    employeeId: `EMP00${idx + 1}`,
    name: `${r.role} Demo User`,
    email: `${r.role.toLowerCase().replace(/[^a-z0-9]/g, '')}@rejoysolar.com`,
    role: r.role,
    phone: '+91 98000 00000',
    department: r.department,
    designation: r.role,
    isFieldWorker: Boolean(r.isFieldWorkerDefault)
  },
  description: r.description,
  badgeColor: r.badgeColor
}));

export interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (
    email: string,
    pass: string,
    name: string,
    role?: UserRole,
    department?: string,
    designation?: string,
    phone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateRole: (newRole: UserRole) => void;
  switchPersona: (profile: UserProfile) => void;
  canAccessModule: (moduleName: string) => boolean;
  hasPermission: (permissionId: string) => boolean;
  canApproveStage: () => boolean;
  canEditFinancials: () => boolean;
  canAccessHR: () => boolean;
  canManageProjectAssignments: () => boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isFieldStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_PROFILE_STORAGE_KEY = 'rejoysolar_profile_';
const ACTIVE_SESSION_STORAGE_KEY = 'rejoysolar_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and securely validate session from backend on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const token = apiClient.getToken();
        if (!token) {
          // No token exists: ensure active session is cleared
          localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          if (isMounted) setCurrentUser(null);
          return;
        }

        // Validate session token with authoritative backend API (/api/auth/me)
        const verifiedUser = await apiClient.verifySession();
        if (verifiedUser && isMounted) {
          const employees = storageService.getEmployees();
          const cleanEmail = String(verifiedUser.email || '').trim().toLowerCase();
          const linkedEmp = employees.find(
            e => (e.id && e.id === verifiedUser.id) || (e.email && e.email.trim().toLowerCase() === cleanEmail)
          );

          const profile: UserProfile = {
            id: verifiedUser.id || linkedEmp?.id || `usr-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`,
            employeeId: verifiedUser.employeeId || linkedEmp?.employeeCode || (verifiedUser.role === 'Customer' ? `CUST-${verifiedUser.customerId || verifiedUser.id}` : 'EMP001'),
            name: verifiedUser.name || linkedEmp?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: (verifiedUser.role || linkedEmp?.systemRole || 'Admin') as UserRole,
            phone: verifiedUser.phone || linkedEmp?.phone || '+91 98250 11223',
            department: verifiedUser.department || linkedEmp?.department || (verifiedUser.role === 'Customer' ? 'Client Portal' : 'Administration'),
            designation: verifiedUser.designation || linkedEmp?.designation || (verifiedUser.role as string),
            isFieldWorker: Boolean(verifiedUser.isFieldWorker ?? linkedEmp?.isFieldWorker),
            assignedProjects: []
          };
          setCurrentUser(profile);
          localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(profile));
          storageService.syncFromBackend().catch(() => {});
        } else {
          // Token is invalid, expired, or rejected by server: clear auth state
          if (isMounted) {
            setCurrentUser(null);
            localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
            apiClient.setToken(null);
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Session verification notice:', e);
        if (isMounted) {
          setCurrentUser(null);
          localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          apiClient.setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist active user profile changes
  const saveUserProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    if (profile.id) {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY + profile.id, JSON.stringify(profile));
    }
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(profile));
  };

  const login = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      if (!cleanEmail || !cleanPass) {
        throw new Error('Please enter both your email address and password.');
      }

      // Authenticate with backend API (authoritative MySQL + JWT token verification)
      const apiRes = await apiClient.login(cleanEmail, cleanPass);
      if (apiRes && apiRes.success && apiRes.user && apiRes.token) {
        const u = apiRes.user;
        const profile: UserProfile = {
          id: u.id || `usr-${u.email.replace(/[^a-z0-9]/g, '-')}`,
          employeeId: u.employeeId || (u.role === 'Customer' ? `CUST-${u.customerId || u.id}` : 'EMP001'),
          name: u.name || email.split('@')[0],
          email: u.email,
          role: u.role as UserRole,
          phone: u.phone || '+91 98250 11223',
          department: u.department || (u.role === 'Customer' ? 'Client Portal' : 'Administration'),
          designation: u.designation || (u.role as string),
          isFieldWorker: Boolean(u.isFieldWorker),
          assignedProjects: []
        };
        saveUserProfile(profile);
        storageService.syncFromBackend().catch(() => {});
        return;
      }

      // Handle backend failure message
      const errorMsg = apiRes?.message || 'Invalid email or password. Please verify your credentials.';
      throw new Error(errorMsg);
    } catch (err: any) {
      apiClient.setToken(null);
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      throw new Error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole = 'Admin',
    department?: string,
    designation?: string,
    phone: string = '+91 98250 11223'
  ): Promise<void> => {
    setLoading(true);
    try {
      const isFw = [
        'Site Survey Engineer',
        'Site Inspector',
        'Civil Team',
        'Structure Team',
        'Installation Team',
        'Electrical Team',
        'Technician'
      ].includes(role);

      const newProfile: UserProfile = {
        id: 'usr-local-' + Date.now(),
        employeeId: 'EMP' + Math.floor(100 + Math.random() * 900),
        name: name.trim() || email.split('@')[0],
        email: email.trim().toLowerCase(),
        role,
        phone,
        department: department || 'Administration',
        designation: designation || role,
        isFieldWorker: isFw,
        assignedProjects: []
      };
      saveUserProfile(newProfile);
    } catch (err: any) {
      throw new Error(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (currentUser?.id) {
        liveLocationService.sendOffline(currentUser.id, currentUser.email, currentUser.employeeId).catch(() => {});
        localStorage.removeItem(USER_PROFILE_STORAGE_KEY + currentUser.id);
      }
      await apiClient.logout().catch(() => {});
      apiClient.setToken(null);
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const clean = email.trim().toLowerCase();
    await apiClient.requestPasswordReset(clean).catch(() => {});
    const employees = storageService.getEmployees();
    const linkedEmp = employees.find(e => e.email && e.email.trim().toLowerCase() === clean);
    const demo = DEMO_ACCOUNTS.find(d => d.email.toLowerCase() === clean);

    if (!linkedEmp && !demo && !clean.includes('rejoy') && !clean.includes('solar')) {
      throw new Error('No user account found with that email address.');
    }
  };

  const updateRole = (newRole: UserRole) => {
    if (!currentUser) return;
    const def = ROLE_DEFINITIONS.find(r => r.role === newRole);
    const updated: UserProfile = {
      ...currentUser,
      role: newRole,
      department: def?.department || currentUser.department,
      designation: def?.role || currentUser.designation,
      isFieldWorker: Boolean(def?.isFieldWorkerDefault)
    };
    saveUserProfile(updated);
  };

  const switchPersona = (profile: UserProfile) => {
    if (!currentUser) return;
    const def = ROLE_DEFINITIONS.find(r => r.role === profile.role);
    const updated: UserProfile = {
      ...currentUser,
      role: profile.role,
      department: profile.department || def?.department || currentUser.department,
      designation: profile.designation || def?.role || currentUser.designation,
      isFieldWorker: Boolean(profile.isFieldWorker ?? def?.isFieldWorkerDefault)
    };
    saveUserProfile(updated);
  };

  const currentRole: UserRole = currentUser?.role || 'Admin';
  const isCustomer = currentRole === 'Customer';
  const isAdmin = currentRole === 'Admin';
  const isProjectManager = currentRole === 'Project Manager';
  const isFieldStaff = Boolean(
    currentUser?.isFieldWorker ||
    [
      'Site Survey Engineer',
      'Site Inspector',
      'Civil Team',
      'Structure Team',
      'Installation Team',
      'Electrical Team',
      'Technician'
    ].includes(currentRole)
  );

  const hasPermission = (permissionId: string): boolean => {
    if (isAdmin) return true;
    return storageService.hasAclPermission(currentRole, permissionId);
  };

  const canApproveStage = (): boolean => {
    return isAdmin || isProjectManager || hasPermission('projects.stage_approve');
  };

  const canEditFinancials = (): boolean => {
    return isAdmin || currentRole === 'Accountant' || hasPermission('finance.invoices') || hasPermission('finance.receipts');
  };

  const canAccessHR = (): boolean => {
    return isAdmin || currentRole === 'HR Manager' || hasPermission('hrms.manage');
  };

  const canManageProjectAssignments = (): boolean => {
    return isAdmin || hasPermission('projects.assign_team');
  };

  const canAccessModule = (moduleName: string): boolean => {
    if (isAdmin) return true;

    if (isCustomer) {
      return ['customer_portal', 'my_project', 'my_documents', 'my_payments', 'service_request'].includes(moduleName);
    }

    // Role module mapping
    switch (moduleName) {
      case 'dashboard':
        return true;
      case 'live_tracking':
      case 'field_tracking':
        return isAdmin;
      case 'crm':
      case 'crm_leads':
      case 'leads':
      case 'crm_customers':
      case 'customers':
      case 'crm_quotations':
      case 'quotations':
        return (
          hasPermission('crm.leads.view') ||
          hasPermission('crm.quotations.create') ||
          hasPermission('crm.quotations.approve') ||
          ['Sales Manager', 'Sales Executive', 'Project Manager'].includes(currentRole)
        );
      case 'sales_purchase':
      case 'sales':
      case 'purchase':
      case 'inventory':
      case 'bom':
      case 'vendors':
        return hasPermission('inventory.view') || ['Admin', 'Sales Manager', 'Project Manager', 'Accountant'].includes(currentRole);
      case 'projects':
      case 'workflow':
        return hasPermission('projects.view') || !isCustomer;
      case 'site_survey':
        return hasPermission('survey.view') || isAdmin || isProjectManager || currentRole === 'Site Survey Engineer' || currentRole.includes('Sales');
      case 'finance':
      case 'invoices':
      case 'accounting':
      case 'tally':
        return hasPermission('finance.view') || isAdmin || currentRole === 'Accountant';
      case 'hrms':
      case 'employees':
      case 'attendance':
      case 'payroll':
        return hasPermission('hrms.view') || isAdmin || currentRole === 'HR Manager';
      case 'service':
      case 'amc':
        return hasPermission('service.tickets_view') || isAdmin || isProjectManager || currentRole === 'Service Manager' || currentRole === 'Technician';
      case 'reports':
        return hasPermission('reports.view') || isAdmin || isProjectManager || currentRole === 'Sales Manager' || currentRole === 'Accountant';
      case 'users':
      case 'settings':
      case 'roles':
        return isAdmin;
      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        loading,
        isAuthenticated: Boolean(currentUser),
        login,
        register,
        logout,
        resetPassword,
        updateRole,
        switchPersona,
        canAccessModule,
        hasPermission,
        canApproveStage,
        canEditFinancials,
        canAccessHR,
        canManageProjectAssignments,
        isAdmin,
        isCustomer,
        isFieldStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function getRoleDefaultPath(role?: UserRole): string {
  if (role === 'Customer') return '/customer-portal';
  return '/dashboard';
}
