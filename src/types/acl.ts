import { UserRole } from './solar';

export type AclDomain =
  | 'crm'
  | 'projects'
  | 'survey'
  | 'inventory'
  | 'finance'
  | 'hrms'
  | 'service'
  | 'reports'
  | 'settings';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface AclPermissionDefinition {
  id: string;
  domain: AclDomain;
  domainLabel: string;
  name: string;
  description: string;
  actions: PermissionAction[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type RolePermissionMap = Record<string, boolean>;

export type SystemAclConfig = Record<UserRole, RolePermissionMap>;

export interface AclRoleMetadata {
  role: UserRole;
  department: string;
  hierarchyLevel: 1 | 2 | 3 | 4; // 1: Executive/Admin, 2: Manager/Head, 3: Field Specialist, 4: External
  hierarchyLabel: string;
  description: string;
  badgeColor: string;
  isSystemLocked?: boolean; // e.g. Admin cannot have core permissions revoked
}

export interface AclAuditLogEntry {
  id: string;
  timestamp: string;
  changedBy: string;
  targetRole: UserRole;
  action: 'UPDATE_PERMISSIONS' | 'RESET_ROLE' | 'REASSIGN_USER' | 'IMPORT_CONFIG';
  summary: string;
}
