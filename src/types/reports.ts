export type ReportCategory =
  | 'sales'
  | 'purchase'
  | 'product_stock'
  | 'customer_ledger'
  | 'vendor_ledger'
  | 'income_summary'
  | 'expense_summary'
  | 'payroll'
  | 'monthly_attendance'
  | 'leads'
  | 'projects';

export interface ReportFilterState {
  fromDate: string;
  toDate: string;
  name: string;
  status: string;
  warehouseId?: string;
}

export interface ReportCategoryMeta {
  id: ReportCategory;
  label: string;
  shortLabel: string;
  description: string;
  nameFilterLabel: string;
  nameFilterPlaceholder: string;
  statusOptions: { label: string; value: string }[];
}

export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  {
    id: 'sales',
    label: 'Sales Report',
    shortLabel: 'Sales',
    description: 'Invoiced revenue, customer sales orders, tax breakdowns, and payment collection statuses',
    nameFilterLabel: 'Customer / Invoice #',
    nameFilterPlaceholder: 'Search customer name or invoice #...',
    statusOptions: [
      { label: 'All Statuses', value: 'ALL' },
      { label: 'Paid', value: 'PAID' },
      { label: 'Issued / Pending', value: 'ISSUED' },
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Cancelled', value: 'CANCELLED' }
    ]
  },
  {
    id: 'purchase',
    label: 'Purchase Report',
    shortLabel: 'Purchases',
    description: 'Procurement orders, vendor commitments, tax input credits, and delivery fulfillment',
    nameFilterLabel: 'Vendor / PO #',
    nameFilterPlaceholder: 'Search vendor name or PO #...',
    statusOptions: [
      { label: 'All Statuses', value: 'ALL' },
      { label: 'Received', value: 'RECEIVED' },
      { label: 'Ordered / Sent', value: 'ORDERED' },
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Cancelled', value: 'CANCELLED' }
    ]
  },
  {
    id: 'product_stock',
    label: 'Product Stock Report',
    shortLabel: 'Stock',
    description: 'Solar equipment inventory levels, valuation, minimum threshold alerts, and warehouse movements',
    nameFilterLabel: 'Product / SKU / Category',
    nameFilterPlaceholder: 'Search SKU, product name or category...',
    statusOptions: [
      { label: 'All Stock Statuses', value: 'ALL' },
      { label: 'In Stock', value: 'IN_STOCK' },
      { label: 'Low Stock Alert', value: 'LOW_STOCK' },
      { label: 'Out of Stock', value: 'OUT_OF_STOCK' }
    ]
  },
  {
    id: 'customer_ledger',
    label: 'Customer Ledger',
    shortLabel: 'Customer Ledger',
    description: 'Party-wise financial ledger displaying invoices billed, payments credited, and outstanding balances',
    nameFilterLabel: 'Customer Name',
    nameFilterPlaceholder: 'Search customer name or document #...',
    statusOptions: [
      { label: 'All Account Statuses', value: 'ALL' },
      { label: 'Outstanding Balance', value: 'OUTSTANDING' },
      { label: 'Settled / Zero Balance', value: 'SETTLED' },
      { label: 'Overdue Payments', value: 'OVERDUE' }
    ]
  },
  {
    id: 'vendor_ledger',
    label: 'Vendor Ledger',
    shortLabel: 'Vendor Ledger',
    description: 'Supplier payables ledger recording procurement bills, disbursements made, and net pending dues',
    nameFilterLabel: 'Vendor / Supplier',
    nameFilterPlaceholder: 'Search vendor name or voucher ref...',
    statusOptions: [
      { label: 'All Payables Statuses', value: 'ALL' },
      { label: 'Pending Dues', value: 'PENDING' },
      { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
      { label: 'Fully Paid / Cleared', value: 'PAID' }
    ]
  },
  {
    id: 'income_summary',
    label: 'Income Summary',
    shortLabel: 'Income',
    description: 'Cash inflows, milestone payment receipts, payment methods, and Tally accounting sync reconciliation',
    nameFilterLabel: 'Customer / Project',
    nameFilterPlaceholder: 'Search customer, receipt # or project...',
    statusOptions: [
      { label: 'All Inflow Statuses', value: 'ALL' },
      { label: 'Received / Paid', value: 'PAID' },
      { label: 'Pending Milestone', value: 'PENDING' },
      { label: 'Overdue Milestones', value: 'OVERDUE' },
      { label: 'Partial Inflow', value: 'PARTIAL' }
    ]
  },
  {
    id: 'expense_summary',
    label: 'Expense Summary',
    shortLabel: 'Expenses',
    description: 'Project material purchases, civil/electrical costs, labor wages, and logistics outflows',
    nameFilterLabel: 'Payee / Expense #',
    nameFilterPlaceholder: 'Search vendor, expense # or project...',
    statusOptions: [
      { label: 'All Categories & Statuses', value: 'ALL' },
      { label: 'Material - Solar Panels', value: 'Material - Solar Panels' },
      { label: 'Material - Inverter', value: 'Material - Inverter' },
      { label: 'Material - Cables & BOS', value: 'Material - Cables & BOS' },
      { label: 'Structure Steel', value: 'Structure Steel' },
      { label: 'Civil Raw Materials', value: 'Civil Raw Materials' },
      { label: 'Labor & Contractors', value: 'Labor & Contractors' },
      { label: 'Transport & Logistics', value: 'Transport & Logistics' },
      { label: 'Government Permits', value: 'Government Permits' }
    ]
  },
  {
    id: 'payroll',
    label: 'Payroll Report',
    shortLabel: 'Payroll',
    description: 'Monthly compensation statements, base salaries, overtime earnings, and statutory deductions',
    nameFilterLabel: 'Employee Name / Code',
    nameFilterPlaceholder: 'Search employee code, name or department...',
    statusOptions: [
      { label: 'All Payroll Statuses', value: 'ALL' },
      { label: 'Paid', value: 'PAID' },
      { label: 'Generated', value: 'GENERATED' },
      { label: 'Draft', value: 'DRAFT' }
    ]
  },
  {
    id: 'monthly_attendance',
    label: 'Monthly Attendance',
    shortLabel: 'Attendance',
    description: 'Daily check-in/out logs, GPS field survey verifications, working hours, and shift attendance summaries',
    nameFilterLabel: 'Employee / Location',
    nameFilterPlaceholder: 'Search employee name or site location...',
    statusOptions: [
      { label: 'All Attendance Statuses', value: 'ALL' },
      { label: 'Present', value: 'PRESENT' },
      { label: 'Field Visit', value: 'FIELD VISIT' },
      { label: 'Late Arrival', value: 'LATE' },
      { label: 'Half Day', value: 'HALF DAY' },
      { label: 'Absent', value: 'ABSENT' }
    ]
  },
  {
    id: 'leads',
    label: 'Leads Report',
    shortLabel: 'Leads',
    description: 'CRM inquiry velocity, lead acquisition channels, conversion rates, and pipeline kW capacity',
    nameFilterLabel: 'Lead / City / Source',
    nameFilterPlaceholder: 'Search contact, company or city...',
    statusOptions: [
      { label: 'All Pipeline Stages', value: 'ALL' },
      { label: 'New Lead', value: 'NEW' },
      { label: 'Contacted', value: 'CONTACTED' },
      { label: 'Site Survey Scheduled', value: 'SITE_SURVEY_SCHEDULED' },
      { label: 'Proposal Sent', value: 'PROPOSAL_SENT' },
      { label: 'In Negotiation', value: 'NEGOTIATION' },
      { label: 'Won / Converted', value: 'WON' },
      { label: 'Lost', value: 'LOST' }
    ]
  },
  {
    id: 'projects',
    label: 'Project Report',
    shortLabel: 'Projects',
    description: 'EPC solar installations, stage progression, target completion schedules, and turnkey contract valuations',
    nameFilterLabel: 'Project / Client / City',
    nameFilterPlaceholder: 'Search project title, code, client...',
    statusOptions: [
      { label: 'All Project Stages', value: 'ALL' },
      { label: 'Planning', value: 'PLANNING' },
      { label: 'Site Survey', value: 'SURVEY' },
      { label: 'Design & Approvals', value: 'DESIGN & APPROVALS' },
      { label: 'Civil & Structure', value: 'CIVIL & STRUCTURE' },
      { label: 'Installation', value: 'INSTALLATION' },
      { label: 'Testing & Commissioning', value: 'TESTING & COMMISSIONING' },
      { label: 'Handover', value: 'HANDOVER' },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Delayed', value: 'DELAYED' },
      { label: 'On Hold', value: 'ON HOLD' }
    ]
  }
];
