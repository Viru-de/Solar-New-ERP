import { UserRole } from '../types/solar';
import {
  AclPermissionDefinition,
  AclRoleMetadata,
  SystemAclConfig,
  AclDomain
} from '../types/acl';

export interface AclDomainMetadata {
  id: AclDomain;
  label: string;
  description: string;
  icon: string;
  badgeColor: string;
}

export const ACL_DOMAINS: AclDomainMetadata[] = [
  {
    id: 'crm',
    label: 'CRM & Sales Pipeline',
    description: 'Leads, prospective client follow-ups, quotation builder, and commercial negotiations',
    icon: 'Briefcase',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'projects',
    label: 'Projects & Engineering',
    description: 'EPC project lifecycle, milestone workflow stages, checklists, and specialist assignments',
    icon: 'Layers',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    id: 'survey',
    label: 'Site Survey & Feasibility',
    description: 'Roof dimensions, shadow obstruction analysis, GPS logging, and transformer specs',
    icon: 'Compass',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'inventory',
    label: 'Material, BOM & Inventory',
    description: 'Solar panels, inverters, cables, mounting structures, and project BOM customization',
    icon: 'Package',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200'
  },
  {
    id: 'finance',
    label: 'Finance, Invoicing & Tally',
    description: 'GST tax invoices, milestone draws, customer receipts, and Tally Prime XML synchronization',
    icon: 'DollarSign',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  {
    id: 'hrms',
    label: 'HRMS, Attendance & Payroll',
    description: 'Staff directory, field GPS attendance punch, leave requests, and monthly payroll disbursement',
    icon: 'Users',
    badgeColor: 'bg-pink-50 text-pink-800 border-pink-200'
  },
  {
    id: 'service',
    label: 'Service, AMC & Maintenance',
    description: 'Warranty tickets, breakdown technician dispatch, spare replacement, and AMC visits',
    icon: 'Wrench',
    badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  },
  {
    id: 'reports',
    label: 'Analytics & Executive Reports',
    description: 'Operational analytics, cashflow reports, sales pipeline charts, and CSV/PDF data exports',
    icon: 'BarChart3',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  {
    id: 'settings',
    label: 'System Admin & Security',
    description: 'Company credentials, Tally/WhatsApp gateways, audit logs, and ACL access rules',
    icon: 'ShieldCheck',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
  }
];

export const ACL_ROLES_METADATA: AclRoleMetadata[] = [
  {
    role: 'Admin',
    department: 'Administration',
    hierarchyLevel: 1,
    hierarchyLabel: 'System Administrator (Root Authority)',
    description: 'Full system control, administrative oversight, user management, and security policy control',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    isSystemLocked: true
  },
  {
    role: 'Project Manager',
    department: 'Operations',
    hierarchyLevel: 2,
    hierarchyLabel: 'Operations Head',
    description: 'Full oversight of all EPC projects, stage sign-offs, milestone approvals, and team assignments',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  {
    role: 'Site Survey Engineer',
    department: 'Engineering',
    hierarchyLevel: 3,
    hierarchyLabel: 'Field Specialist',
    description: 'Site feasibility assessments, shadow analysis, roof measurements, and pre-engineering survey',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  {
    role: 'Site Inspector',
    department: 'Engineering',
    hierarchyLevel: 3,
    hierarchyLabel: 'Quality & Field Auditor',
    description: 'Site quality inspections, installation audits, safety compliance, and stage validations',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300'
  },
  {
    role: 'Sales Manager',
    department: 'Sales',
    hierarchyLevel: 2,
    hierarchyLabel: 'Department Head',
    description: 'Leads CRM, quotation approvals, commercial discounts, and sales team target monitoring',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  {
    role: 'Sales Executive',
    department: 'Sales',
    hierarchyLevel: 3,
    hierarchyLabel: 'Commercial Officer',
    description: 'Inquiry logging, customer site coordination, proposal delivery, and pipeline tracking',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300'
  },
  {
    role: 'Civil Team',
    department: 'Civil',
    hierarchyLevel: 3,
    hierarchyLabel: 'Field Specialist',
    description: 'Foundation pedestals, roof puncture waterproofing, anchor bolting, and concrete curing sign-off',
    badgeColor: 'bg-stone-100 text-stone-900 border-stone-300'
  },
  {
    role: 'Structure Team',
    department: 'Structure',
    hierarchyLevel: 3,
    hierarchyLabel: 'Field Specialist',
    description: 'Mounting structure assembly, module tilt angle verification, and purlin torque checklists',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300'
  },
  {
    role: 'Installation Team',
    department: 'Installation',
    hierarchyLevel: 3,
    hierarchyLabel: 'Field Specialist',
    description: 'Solar PV module clamping, string cabling, conduit routing, and safety compliance checks',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300'
  },
  {
    role: 'Electrical Team',
    department: 'Electrical',
    hierarchyLevel: 3,
    hierarchyLabel: 'Field Specialist',
    description: 'Inverter synchronization, ACDB/DCDB, grid interconnection, earthing pits, and Discom net-metering',
    badgeColor: 'bg-violet-100 text-violet-900 border-violet-300'
  },
  {
    role: 'Technician',
    department: 'Service',
    hierarchyLevel: 3,
    hierarchyLabel: 'Field Specialist',
    description: 'Field breakdown diagnostics, inverter error code troubleshooting, and preventive maintenance',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300'
  },
  {
    role: 'Service Manager',
    department: 'Service',
    hierarchyLevel: 2,
    hierarchyLabel: 'Department Head',
    description: 'Service SLA monitoring, ticket assignments, AMC contract management, and spares allocation',
    badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300'
  },
  {
    role: 'Accountant',
    department: 'Finance',
    hierarchyLevel: 2,
    hierarchyLabel: 'Finance Specialist',
    description: 'GST tax invoice generation, customer receipts, vendor payments, and Tally Prime sync',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
  },
  {
    role: 'HR Manager',
    department: 'HR',
    hierarchyLevel: 2,
    hierarchyLabel: 'Department Head',
    description: 'Staff directory, mobile GPS attendance verification, leave approvals, and payroll processing',
    badgeColor: 'bg-pink-100 text-pink-900 border-pink-300'
  },
  {
    role: 'Customer',
    department: 'Customer',
    hierarchyLevel: 4,
    hierarchyLabel: 'External Portal Client',
    description: 'View personal solar plant status, live generation, payment milestones, and raise support tickets',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  }
];

export const ACL_PERMISSIONS_CATALOG: AclPermissionDefinition[] = [
  // CRM & Sales
  {
    id: 'crm.leads.view',
    domain: 'crm',
    domainLabel: 'CRM & Sales',
    name: 'View Inquiries & Leads',
    description: 'Browse prospective client inquiries, phone contacts, solar capacity requirements, and stage',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'crm.leads.manage',
    domain: 'crm',
    domainLabel: 'CRM & Sales',
    name: 'Create & Edit Leads',
    description: 'Create new leads, edit client info, update lead pipeline status, and log call notes',
    actions: ['create', 'edit'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'crm.quotations.create',
    domain: 'crm',
    domainLabel: 'CRM & Sales',
    name: 'Generate Quotations',
    description: 'Configure solar capacity, BOM pricing, generate downloadable proposals with payback estimates',
    actions: ['create', 'edit'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'crm.quotations.approve',
    domain: 'crm',
    domainLabel: 'CRM & Sales',
    name: 'Approve Commercial Discounts',
    description: 'Authorize high-value price reductions, custom PPA terms, and contractual discount margins',
    actions: ['approve'],
    riskLevel: 'HIGH'
  },

  // Projects & EPC
  {
    id: 'projects.view',
    domain: 'projects',
    domainLabel: 'Projects & Engineering',
    name: 'View EPC Projects',
    description: 'View project dashboard, kWp capacity, site address, timeline schedules, and stage progression',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'projects.create',
    domain: 'projects',
    domainLabel: 'Projects & Engineering',
    name: 'Create New Project Record',
    description: 'Initialize new project from won quotation, define target commissioning date, and scope',
    actions: ['create'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'projects.edit_specs',
    domain: 'projects',
    domainLabel: 'Projects & Engineering',
    name: 'Edit Technical Specs',
    description: 'Modify DC plant capacity, inverter makes, module wattage, and consumer number',
    actions: ['edit'],
    riskLevel: 'HIGH'
  },
  {
    id: 'projects.assign_team',
    domain: 'projects',
    domainLabel: 'Projects & Engineering',
    name: 'Assign Project Specialists',
    description: 'Allocate survey engineers, civil teams, electrical engineers, and service personnel to projects',
    actions: ['edit', 'approve'],
    riskLevel: 'HIGH'
  },
  {
    id: 'projects.stage_checklist',
    domain: 'projects',
    domainLabel: 'Projects & Engineering',
    name: 'Update Stage Checklists',
    description: 'Check off field tasks (e.g., pedestal waterproofing, torque checks, string continuity)',
    actions: ['edit'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'projects.stage_photos',
    domain: 'projects',
    domainLabel: 'Projects & Engineering',
    name: 'Upload Work Photos & Proofs',
    description: 'Upload live photos with GPS timestamps for structural mounting, inverter wiring, and panels',
    actions: ['create', 'edit'],
    riskLevel: 'LOW'
  },
  {
    id: 'projects.stage_approve',
    domain: 'projects',
    domainLabel: 'Projects & Engineering',
    name: 'Approve & Close Workflow Stages',
    description: 'Officially sign-off completed milestones, unlock subsequent stages, and trigger payment drawdowns',
    actions: ['approve'],
    riskLevel: 'CRITICAL'
  },

  // Site Survey & Feasibility
  {
    id: 'survey.view',
    domain: 'survey',
    domainLabel: 'Site Survey & Feasibility',
    name: 'View Site Feasibility Surveys',
    description: 'Inspect roof dimension drawings, obstruction azimuth angles, and satellite coordinates',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'survey.submit',
    domain: 'survey',
    domainLabel: 'Site Survey & Feasibility',
    name: 'Conduct & Submit Survey',
    description: 'Fill out on-site survey form, log roof photos, shadow obstacles, and electricity bills',
    actions: ['create', 'edit'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'survey.approve',
    domain: 'survey',
    domainLabel: 'Site Survey & Feasibility',
    name: 'Validate Technical Feasibility',
    description: 'Certify roof load capacity, shadow free area, and electrical interconnection feasibility',
    actions: ['approve'],
    riskLevel: 'HIGH'
  },

  // Material & Inventory
  {
    id: 'inventory.view',
    domain: 'inventory',
    domainLabel: 'Material & Inventory',
    name: 'View Warehouse Stock & Products',
    description: 'Check real-time inventory balances for PV modules, inverters, structure rails, and cables',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'inventory.manage',
    domain: 'inventory',
    domainLabel: 'Material & Inventory',
    name: 'Manage Stock & Adjustments',
    description: 'Add new inventory SKUs, update reorder levels, adjust physical counts, and record GRN receipts',
    actions: ['create', 'edit'],
    riskLevel: 'HIGH'
  },
  {
    id: 'inventory.bom_edit',
    domain: 'inventory',
    domainLabel: 'Material & Inventory',
    name: 'Customize Project BOM',
    description: 'Add or modify bill of materials components allocated to an active installation project',
    actions: ['edit'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'inventory.purchase_orders',
    domain: 'inventory',
    domainLabel: 'Material & Inventory',
    name: 'Issue Vendor Purchase Orders',
    description: 'Generate POs to solar module and inverter suppliers with payment terms and delivery dates',
    actions: ['create', 'approve'],
    riskLevel: 'HIGH'
  },
  {
    id: 'inventory.warehouses_manage',
    domain: 'inventory',
    domainLabel: 'Material & Inventory',
    name: 'Manage Multi-Warehouse Facilities',
    description: 'Create, edit, decommission warehouse facilities, manage storage capacity, and execute physical audits',
    actions: ['create', 'edit', 'delete'],
    riskLevel: 'HIGH'
  },

  // Finance & Accounting
  {
    id: 'finance.view',
    domain: 'finance',
    domainLabel: 'Finance, Invoicing & Tally',
    name: 'View Invoices & Project Ledgers',
    description: 'Examine customer billing schedules, overdue invoices, and milestone payment status',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'finance.invoices',
    domain: 'finance',
    domainLabel: 'Finance, Invoicing & Tally',
    name: 'Generate Tax Invoices',
    description: 'Draft, issue and cancel official GST tax invoices for solar EPC milestone payments',
    actions: ['create', 'edit', 'delete'],
    riskLevel: 'HIGH'
  },
  {
    id: 'finance.receipts',
    domain: 'finance',
    domainLabel: 'Finance, Invoicing & Tally',
    name: 'Record Customer Receipts',
    description: 'Acknowledge NEFT, RTGS, Cheque or Cash receipts and issue stamped money receipts',
    actions: ['create'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'finance.tally_sync',
    domain: 'finance',
    domainLabel: 'Finance, Invoicing & Tally',
    name: 'Push Vouchers to Tally Prime',
    description: 'Transmit XML receipts, sales invoices, and vendor debits directly into Tally Prime ODBC',
    actions: ['approve'],
    riskLevel: 'CRITICAL'
  },
  {
    id: 'finance.audit',
    domain: 'finance',
    domainLabel: 'Finance, Invoicing & Tally',
    name: 'Financial Ledger & Bank Audit',
    description: 'Review overall profit & loss, project gross margins, and bank reconciliation ledgers',
    actions: ['view', 'approve'],
    riskLevel: 'CRITICAL'
  },

  // HRMS & Attendance
  {
    id: 'hrms.view',
    domain: 'hrms',
    domainLabel: 'HRMS, Attendance & Payroll',
    name: 'View Employee Directory',
    description: 'View internal staff contact details, designations, employee codes, and assigned teams',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'hrms.attendance_punch',
    domain: 'hrms',
    domainLabel: 'HRMS, Attendance & Payroll',
    name: 'Mark Daily GPS Attendance',
    description: 'Self-punch check-in and check-out with automatic GPS location capture',
    actions: ['create'],
    riskLevel: 'LOW'
  },
  {
    id: 'hrms.manage',
    domain: 'hrms',
    domainLabel: 'HRMS, Attendance & Payroll',
    name: 'Manage Staff & Leave Requests',
    description: 'Onboard new staff, adjust salary structures, approve leaves, and audit geofenced punches',
    actions: ['create', 'edit', 'approve'],
    riskLevel: 'HIGH'
  },
  {
    id: 'hrms.payroll',
    domain: 'hrms',
    domainLabel: 'HRMS, Attendance & Payroll',
    name: 'Calculate & Process Payroll',
    description: 'Generate monthly payroll register, deductions (PF/ESIC/PT), and salary slips',
    actions: ['approve'],
    riskLevel: 'CRITICAL'
  },

  // Service & AMC
  {
    id: 'service.tickets_view',
    domain: 'service',
    domainLabel: 'Service, AMC & Maintenance',
    name: 'View Maintenance & Warranty Tickets',
    description: 'Monitor open customer breakdown requests, generation loss complaints, and inverter alerts',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'service.tickets_create',
    domain: 'service',
    domainLabel: 'Service, AMC & Maintenance',
    name: 'Log New Breakdown Call',
    description: 'Create service ticket with customer details, inverter fault codes, and priority SLA',
    actions: ['create'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'service.tickets_resolve',
    domain: 'service',
    domainLabel: 'Service, AMC & Maintenance',
    name: 'Perform Service & Resolve Tickets',
    description: 'Log on-site diagnosis, replace components, upload restoration photos, and obtain OTP sign-off',
    actions: ['edit', 'approve'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'service.amc_manage',
    domain: 'service',
    domainLabel: 'Service, AMC & Maintenance',
    name: 'Manage AMC Contracts & Schedules',
    description: 'Create annual maintenance contracts, schedule quarterly panel washing, and renew contracts',
    actions: ['create', 'edit', 'approve'],
    riskLevel: 'HIGH'
  },

  // Reports & Analytics
  {
    id: 'reports.view',
    domain: 'reports',
    domainLabel: 'Analytics & Executive Reports',
    name: 'View Operational Reports',
    description: 'Review lead conversions, kWp installed, project delays, and team attendance summaries',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'reports.export',
    domain: 'reports',
    domainLabel: 'Analytics & Executive Reports',
    name: 'Export Datasets (Excel / CSV)',
    description: 'Download bulk operational records, customer directories, and project execution ledgers',
    actions: ['approve'],
    riskLevel: 'MEDIUM'
  },

  // System Administration & Security
  {
    id: 'settings.view',
    domain: 'settings',
    domainLabel: 'System Admin & Security',
    name: 'View System Configuration',
    description: 'Check active company profile, GSTIN, Tally gateway status, and WhatsApp integration mode',
    actions: ['view'],
    riskLevel: 'LOW'
  },
  {
    id: 'settings.manage',
    domain: 'settings',
    domainLabel: 'System Admin & Security',
    name: 'Configure Company & Integrations',
    description: 'Update bank details, GST rates, Tally Prime server address, and WhatsApp Cloud credentials',
    actions: ['edit'],
    riskLevel: 'HIGH'
  },
  {
    id: 'settings.acl_manage',
    domain: 'settings',
    domainLabel: 'System Admin & Security',
    name: 'Modify Role-Based Access Control',
    description: 'Grant or revoke permissions, edit ACL matrices, reassign user roles, and enforce security policies',
    actions: ['edit', 'approve'],
    riskLevel: 'CRITICAL'
  }
];

// Helper to generate a full boolean map with all permissions
const createPermissions = (grantList: string[]): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  ACL_PERMISSIONS_CATALOG.forEach(p => {
    result[p.id] = grantList.includes(p.id);
  });
  return result;
};

// All permissions array for Admin (Root Authority)
const ALL_PERMISSION_IDS = ACL_PERMISSIONS_CATALOG.map(p => p.id);

/**
 * Standard Production-Grade Solar EPC Default Access Control List (ACL)
 */
export const DEFAULT_SYSTEM_ACL_CONFIG: SystemAclConfig = {
  'Admin': createPermissions(ALL_PERMISSION_IDS),

  'Project Manager': createPermissions([
    'crm.leads.view', 'crm.quotations.create',
    'projects.view', 'projects.create', 'projects.edit_specs', 'projects.assign_team',
    'projects.stage_checklist', 'projects.stage_photos', 'projects.stage_approve',
    'survey.view', 'survey.approve',
    'inventory.view', 'inventory.bom_edit', 'inventory.purchase_orders',
    'finance.view',
    'hrms.view', 'hrms.attendance_punch',
    'service.tickets_view', 'service.tickets_create',
    'reports.view', 'reports.export',
    'settings.view'
  ]),

  'Site Survey Engineer': createPermissions([
    'crm.leads.view',
    'projects.view', 'projects.stage_checklist', 'projects.stage_photos',
    'survey.view', 'survey.submit',
    'hrms.attendance_punch',
    'settings.view'
  ]),

  'Site Inspector': createPermissions([
    'projects.view', 'projects.stage_checklist', 'projects.stage_photos',
    'survey.view', 'survey.submit',
    'service.tickets_view', 'service.tickets_resolve',
    'hrms.attendance_punch',
    'settings.view'
  ]),

  'Sales Manager': createPermissions([
    'crm.leads.view', 'crm.leads.manage', 'crm.quotations.create', 'crm.quotations.approve',
    'projects.view',
    'survey.view',
    'inventory.view',
    'finance.view',
    'hrms.view', 'hrms.attendance_punch',
    'reports.view', 'reports.export',
    'settings.view'
  ]),

  'Sales Executive': createPermissions([
    'crm.leads.view', 'crm.leads.manage', 'crm.quotations.create',
    'projects.view',
    'survey.view',
    'inventory.view',
    'hrms.attendance_punch',
    'settings.view'
  ]),

  'Civil Team': createPermissions([
    'projects.view', 'projects.stage_checklist', 'projects.stage_photos',
    'inventory.view',
    'hrms.attendance_punch',
    'settings.view'
  ]),

  'Structure Team': createPermissions([
    'projects.view', 'projects.stage_checklist', 'projects.stage_photos',
    'inventory.view',
    'hrms.attendance_punch',
    'settings.view'
  ]),

  'Installation Team': createPermissions([
    'projects.view', 'projects.stage_checklist', 'projects.stage_photos',
    'inventory.view',
    'hrms.attendance_punch',
    'settings.view'
  ]),

  'Electrical Team': createPermissions([
    'projects.view', 'projects.stage_checklist', 'projects.stage_photos',
    'inventory.view',
    'hrms.attendance_punch',
    'settings.view'
  ]),

  'Technician': createPermissions([
    'projects.view', 'projects.stage_checklist', 'projects.stage_photos',
    'inventory.view',
    'hrms.attendance_punch',
    'service.tickets_view', 'service.tickets_resolve',
    'settings.view'
  ]),

  'Service Manager': createPermissions([
    'projects.view',
    'inventory.view',
    'hrms.view', 'hrms.attendance_punch',
    'service.tickets_view', 'service.tickets_create', 'service.tickets_resolve', 'service.amc_manage',
    'reports.view', 'reports.export',
    'settings.view'
  ]),

  'Accountant': createPermissions([
    'crm.leads.view',
    'projects.view',
    'inventory.view', 'inventory.purchase_orders',
    'finance.view', 'finance.invoices', 'finance.receipts', 'finance.tally_sync', 'finance.audit',
    'hrms.view', 'hrms.attendance_punch', 'hrms.payroll',
    'reports.view', 'reports.export',
    'settings.view'
  ]),

  'HR Manager': createPermissions([
    'projects.view',
    'hrms.view', 'hrms.attendance_punch', 'hrms.manage', 'hrms.payroll',
    'reports.view', 'reports.export',
    'settings.view'
  ]),

  'Customer': createPermissions([
    'projects.view',
    'finance.view',
    'service.tickets_view', 'service.tickets_create'
  ])
};
