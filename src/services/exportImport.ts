import { storageService } from './storage';
import { validateCustomer, validateEmployee } from './validation';
import { Customer, Employee } from '../types/solar';

export type ExportModule =
  | 'Leads'
  | 'Customers'
  | 'Employees'
  | 'Projects'
  | 'Payments'
  | 'Expenses'
  | 'Attendance'
  | 'Service';

export interface ImportValidationReport {
  module: ExportModule;
  totalRows: number;
  successful: number;
  failed: number;
  duplicate: number;
  errors: string[];
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const escaped = String(cell ?? '').replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getSampleTemplate(module: ExportModule): { headers: string[]; sampleRow: (string | number)[] } {
  switch (module) {
    case 'Leads':
      return {
        headers: ['Customer Name', 'Company Name', 'Phone', 'Email', 'Address', 'City', 'Solar Capacity (kW)', 'Estimated Value (INR)', 'Source', 'Status'],
        sampleRow: ['Apex Plastics', 'Apex Polychem Ltd', '+91 98250 99881', 'info@apexpoly.com', 'Plot 12, GIDC', 'Ahmedabad', 100, 4800000, 'Website', 'QUALIFIED']
      };
    case 'Customers':
      return {
        headers: ['Customer Name', 'Company Name', 'Customer Type', 'Phone', 'Email', 'Site Address', 'City', 'GST Number', 'Sanctioned Load (kW)'],
        sampleRow: ['Gujarat Foundry Corp', 'Gujarat Foundry Pvt Ltd', 'Industrial', '+91 98790 12345', 'purchase@gfc.com', 'Plot 99, Odhav GIDC', 'Ahmedabad', '24AAACG1234H1Z1', 200]
      };
    case 'Employees':
      return {
        headers: ['Employee Code', 'Name', 'Department', 'Designation', 'Phone', 'Email', 'Joining Date', 'Monthly Salary'],
        sampleRow: ['EMP012', 'Kiran Patel', 'Civil', 'Civil Supervisor', '+91 98251 00223', 'kiran.patel@solarpulse.com', '2026-09-01', 45000]
      };
    case 'Payments':
      return {
        headers: ['Receipt Number', 'Customer Name', 'Milestone', 'Amount (INR)', 'Status', 'Due Date', 'Paid Date', 'Payment Mode'],
        sampleRow: ['RCPT-2026-099', 'ABC Industries Ltd.', 'Advance', 2000000, 'PAID', '2026-08-15', '2026-08-16', 'Bank NEFT/RTGS']
      };
    case 'Expenses':
      return {
        headers: ['Expense Number', 'Vendor Name', 'Category', 'Amount (INR)', 'Date', 'Payment Mode', 'Reference No', 'Notes'],
        sampleRow: ['EXP-2026-099', 'Polycab India Ltd', 'Material - Cables & BOS', 240000, '2026-09-02', 'Bank NEFT', 'REF-9921', 'DC 4 sq mm solar cable']
      };
    case 'Attendance':
      return {
        headers: ['Employee Name', 'Date', 'Check In Time', 'Status', 'Site Location'],
        sampleRow: ['Rajesh Kumar', '2026-09-07', '09:00 AM', 'PRESENT', 'Sanand GIDC Solar Site']
      };
    case 'Service':
      return {
        headers: ['Ticket ID', 'Customer Name', 'Issue', 'Category', 'Priority', 'Status'],
        sampleRow: ['SRV-2026-099', 'GreenTech Logistics Hub', 'Inverter offline code 302', 'Inverter Error / Offline', 'HIGH', 'OPEN']
      };
    case 'Projects':
      return {
        headers: ['Project Code', 'Customer Name', 'Title', 'Capacity (kW)', 'Total Value (INR)', 'Status', 'Start Date', 'Expected Completion'],
        sampleRow: ['SOL-2026-099', 'Navkar Precision', '50 kW Rooftop Solar', 50, 2400000, 'INSTALLATION', '2026-09-01', '2026-10-15']
      };
  }
}

export function parseAndValidateCSV(text: string, module: ExportModule): ImportValidationReport {
  const lines = text.trim().split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    return {
      module,
      totalRows: 0,
      successful: 0,
      failed: 0,
      duplicate: 0,
      errors: ['The uploaded CSV file is empty or missing data rows.']
    };
  }

  const rows = lines.slice(1);
  const errors: string[] = [];
  let successful = 0;
  let failed = 0;
  let duplicate = 0;

  // Track batch candidates to catch intra-file duplicates
  const batchCustomers: Customer[] = [...storageService.getCustomers()];
  const batchEmployees: Employee[] = [...storageService.getEmployees()];

  rows.forEach((row, index) => {
    const cols = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    const rowNum = index + 2;

    if (cols.length < 3 || cols.every(c => c === '')) {
      failed++;
      errors.push(`Row ${rowNum}: Insufficient columns or empty row.`);
      return;
    }

    if (module === 'Leads') {
      if (!cols[0]) {
        failed++;
        errors.push(`Row ${rowNum}: Customer name is mandatory.`);
        return;
      }
      if (!cols[2] || cols[2].length < 8) {
        failed++;
        errors.push(`Row ${rowNum}: Valid phone number is required.`);
        return;
      }
    } else if (module === 'Customers') {
      const name = cols[0];
      const phone = cols[3] || '';
      const email = cols[4] || '';
      const gstNumber = cols[7] || '';
      if (!name) {
        failed++;
        errors.push(`Row ${rowNum}: Customer name is mandatory.`);
        return;
      }
      const dupCheck = validateCustomer({ name, phone, email, gstNumber }, batchCustomers);
      if (!dupCheck.valid) {
        duplicate++;
        failed++;
        errors.push(`Row ${rowNum} Duplicate Customer: ${dupCheck.message}`);
        return;
      }
      // Add to batch to prevent duplicates within the same import file
      batchCustomers.push({
        id: `batch-c-${rowNum}`,
        name,
        companyName: cols[1] || '',
        customerType: (cols[2] as Customer['customerType']) || 'Commercial',
        phone,
        email,
        siteAddress: cols[5] || '',
        city: cols[6] || '',
        state: 'Gujarat',
        pincode: '380001',
        gstNumber,
        sanctionedLoadKw: Number(cols[8]) || 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (module === 'Employees') {
      const code = cols[0];
      const name = cols[1];
      const phone = cols[4] || '';
      const email = cols[5] || '';
      if (!code || !name) {
        failed++;
        errors.push(`Row ${rowNum}: Employee code and name are mandatory.`);
        return;
      }
      const dupCheck = validateEmployee({ employeeCode: code, name, phone, email }, batchEmployees);
      if (!dupCheck.valid) {
        duplicate++;
        failed++;
        errors.push(`Row ${rowNum} Duplicate Employee: ${dupCheck.message}`);
        return;
      }
      // Add to batch to prevent duplicates within the same import file
      batchEmployees.push({
        id: `batch-e-${rowNum}`,
        employeeCode: code,
        name,
        department: (cols[2] as Employee['department']) || 'Operations',
        designation: cols[3] || 'Staff',
        phone,
        email,
        joiningDate: cols[6] || new Date().toISOString().slice(0, 10),
        salaryMonthly: Number(cols[7]) || 0,
        status: 'ACTIVE',
        photoUrl: '',
        loginEnabled: false,
        accountStatus: 'PENDING'
      });
    } else if (module === 'Payments') {
      if (!cols[0] || isNaN(Number(cols[3]))) {
        failed++;
        errors.push(`Row ${rowNum}: Valid amount number is required.`);
        return;
      }
    }

    successful++;
  });

  return {
    module,
    totalRows: rows.length,
    successful,
    failed,
    duplicate,
    errors
  };
}
