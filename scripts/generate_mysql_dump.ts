import fs from 'fs';
import path from 'path';
import { storageService } from '../src/services/storage';
import { DEFAULT_SYSTEM_ACL_CONFIG } from '../src/services/aclDefaults';
import { ROLE_DEFINITIONS, DEMO_ACCOUNTS } from '../src/context/AuthContext';

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/\'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\x00/g, '\\0');
  return `'${str}'`;
}

export function generateFullSql(): string {
  const lines: string[] = [];
  lines.push('-- ==========================================================');
  lines.push('-- SolarPulse EPC ERP & CRM - Complete Production MySQL Database Dump');
  lines.push('-- Generated for Direct Production Server & phpMyAdmin Deployment');
  lines.push('-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci');
  lines.push('-- ==========================================================');
  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS = 0;');
  lines.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
  lines.push('SET time_zone = "+00:00";');
  lines.push('');

  // 1. solar_users
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_users`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_users\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL DEFAULT '123456',
  \`role\` VARCHAR(64) NOT NULL DEFAULT 'Super Admin',
  \`phone\` VARCHAR(32) DEFAULT '',
  \`department\` VARCHAR(64) DEFAULT 'Operations',
  \`designation\` VARCHAR(128) DEFAULT '',
  \`employee_id\` VARCHAR(64) DEFAULT NULL,
  \`customer_id\` VARCHAR(64) DEFAULT NULL,
  \`avatar\` TEXT,
  \`is_field_worker\` TINYINT(1) DEFAULT 0,
  \`status\` VARCHAR(32) DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_users_role\` (\`role\`),
  INDEX \`idx_users_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 2. solar_customers
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_customers`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_customers\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`customer_code\` VARCHAR(32) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`company_name\` VARCHAR(255) DEFAULT '',
  \`customer_type\` VARCHAR(32) DEFAULT 'Residential',
  \`phone\` VARCHAR(32) NOT NULL,
  \`email\` VARCHAR(191) DEFAULT '',
  \`password\` VARCHAR(255) NOT NULL DEFAULT '123456',
  \`site_address\` TEXT NOT NULL,
  \`city\` VARCHAR(128) NOT NULL,
  \`state\` VARCHAR(128) DEFAULT 'Gujarat',
  \`pincode\` VARCHAR(16) DEFAULT '',
  \`gst_number\` VARCHAR(32) DEFAULT '',
  \`electricity_consumer_no\` VARCHAR(64) DEFAULT '',
  \`sanctioned_load_kw\` DECIMAL(10,2) DEFAULT 0.00,
  \`status\` VARCHAR(32) DEFAULT 'ACTIVE',
  \`active_project_id\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_customers_status\` (\`status\`),
  INDEX \`idx_customers_phone\` (\`phone\`),
  INDEX \`idx_customers_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 3. solar_leads
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_leads`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_leads\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`company_name\` VARCHAR(255) DEFAULT '',
  \`phone\` VARCHAR(32) NOT NULL,
  \`email\` VARCHAR(191) DEFAULT '',
  \`address\` TEXT,
  \`city\` VARCHAR(128) DEFAULT '',
  \`solar_capacity_kw\` DECIMAL(10,2) DEFAULT 0.00,
  \`estimated_value\` DECIMAL(14,2) DEFAULT 0.00,
  \`source\` VARCHAR(64) DEFAULT 'Website',
  \`assigned_salesperson_id\` VARCHAR(64) DEFAULT '',
  \`assigned_salesperson_name\` VARCHAR(255) DEFAULT '',
  \`status\` VARCHAR(64) DEFAULT 'NEW',
  \`notes\` TEXT,
  \`next_follow_up_date\` DATE DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_leads_status\` (\`status\`),
  INDEX \`idx_leads_followup\` (\`next_follow_up_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 4. solar_projects
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_projects`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_projects\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`project_code\` VARCHAR(32) NOT NULL UNIQUE,
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`capacity_kw\` DECIMAL(10,2) NOT NULL,
  \`total_value\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`status\` VARCHAR(64) DEFAULT 'PLANNING',
  \`current_stage_key\` VARCHAR(64) DEFAULT 'site_survey',
  \`completion_percentage\` INT DEFAULT 0,
  \`project_manager_id\` VARCHAR(64) DEFAULT '',
  \`project_manager_name\` VARCHAR(255) DEFAULT '',
  \`site_address\` TEXT NOT NULL,
  \`city\` VARCHAR(128) NOT NULL,
  \`inverter_model\` VARCHAR(128) DEFAULT '',
  \`panel_model\` VARCHAR(128) DEFAULT '',
  \`structure_type\` VARCHAR(128) DEFAULT 'Elevated GI Structure',
  \`start_date\` DATE DEFAULT NULL,
  \`expected_completion_date\` DATE DEFAULT NULL,
  \`actual_completion_date\` DATE DEFAULT NULL,
  \`notes\` TEXT,
  \`assignments_json\` LONGTEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_projects_customer\` (\`customer_id\`),
  INDEX \`idx_projects_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 5. solar_project_stages
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_project_stages`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_project_stages\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`project_id\` VARCHAR(64) NOT NULL,
  \`stage_key\` VARCHAR(64) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`stage_order\` INT NOT NULL DEFAULT 1,
  \`department\` VARCHAR(64) NOT NULL,
  \`assigned_role\` VARCHAR(64) NOT NULL,
  \`assigned_employee_id\` VARCHAR(64) DEFAULT '',
  \`assigned_employee_name\` VARCHAR(255) DEFAULT '',
  \`status\` VARCHAR(64) DEFAULT 'NOT STARTED',
  \`priority\` VARCHAR(32) DEFAULT 'MEDIUM',
  \`start_date\` DATE DEFAULT NULL,
  \`due_date\` DATE DEFAULT NULL,
  \`completed_date\` DATE DEFAULT NULL,
  \`checklist_json\` LONGTEXT,
  \`photos_json\` LONGTEXT,
  \`documents_json\` LONGTEXT,
  \`gps_location_json\` LONGTEXT,
  \`notes\` TEXT,
  \`approved_by\` VARCHAR(255) DEFAULT '',
  \`approved_at\` DATETIME DEFAULT NULL,
  \`rejection_reason\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_stages_project\` (\`project_id\`),
  INDEX \`idx_stages_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 6. solar_site_surveys
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_site_surveys`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_site_surveys\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`project_id\` VARCHAR(64) DEFAULT '',
  \`customer_id\` VARCHAR(64) DEFAULT '',
  \`engineer_id\` VARCHAR(64) DEFAULT '',
  \`engineer_name\` VARCHAR(255) NOT NULL,
  \`survey_date\` DATE NOT NULL,
  \`status\` VARCHAR(32) DEFAULT 'DRAFT',
  \`site_address\` TEXT NOT NULL,
  \`latitude\` DECIMAL(10,7) DEFAULT NULL,
  \`longitude\` DECIMAL(10,7) DEFAULT NULL,
  \`location_name\` VARCHAR(255) DEFAULT '',
  \`roof_type\` VARCHAR(64) DEFAULT 'RCC Flat',
  \`roof_area_sqft\` DECIMAL(12,2) DEFAULT 0.00,
  \`shadow_free_area_sqft\` DECIMAL(12,2) DEFAULT 0.00,
  \`shadow_obstacles\` TEXT,
  \`electricity_bill_number\` VARCHAR(64) DEFAULT '',
  \`monthly_avg_consumption\` DECIMAL(10,2) DEFAULT 0.00,
  \`sanctioned_load_kw\` DECIMAL(10,2) DEFAULT 0.00,
  \`tariff_rate\` DECIMAL(8,2) DEFAULT 0.00,
  \`existing_structure_condition\` TEXT,
  \`recommended_capacity_kw\` DECIMAL(10,2) DEFAULT 0.00,
  \`feasibility_score\` VARCHAR(32) DEFAULT 'GOOD',
  \`photos_json\` LONGTEXT,
  \`notes\` TEXT,
  \`reviewed_by\` VARCHAR(255) DEFAULT '',
  \`reviewed_at\` DATETIME DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_surveys_project\` (\`project_id\`),
  INDEX \`idx_surveys_engineer\` (\`engineer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 7. solar_quotations
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_quotations`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_quotations\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`quotation_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`customer_id\` VARCHAR(64) DEFAULT '',
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`project_id\` VARCHAR(64) DEFAULT '',
  \`capacity_kw\` DECIMAL(10,2) NOT NULL,
  \`rate_per_wp\` DECIMAL(10,2) DEFAULT 0.00,
  \`base_amount\` DECIMAL(14,2) DEFAULT 0.00,
  \`tax_amount\` DECIMAL(14,2) DEFAULT 0.00,
  \`panel_brand\` VARCHAR(128) DEFAULT '',
  \`inverter_brand\` VARCHAR(128) DEFAULT '',
  \`structure_type\` VARCHAR(128) DEFAULT '',
  \`items_json\` LONGTEXT,
  \`subtotal\` DECIMAL(14,2) DEFAULT 0.00,
  \`discount_amount\` DECIMAL(14,2) DEFAULT 0.00,
  \`gst_percent\` DECIMAL(5,2) DEFAULT 13.80,
  \`gst_amount\` DECIMAL(14,2) DEFAULT 0.00,
  \`total_amount\` DECIMAL(14,2) NOT NULL,
  \`payment_terms\` TEXT,
  \`warranty_details\` TEXT,
  \`terms_and_conditions\` TEXT,
  \`status\` VARCHAR(32) DEFAULT 'DRAFT',
  \`valid_until\` DATE DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`accepted_at\` DATETIME DEFAULT NULL,
  INDEX \`idx_quotations_customer\` (\`customer_id\`),
  INDEX \`idx_quotations_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 8. solar_payments
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_payments`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_payments\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`receipt_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`project_id\` VARCHAR(64) NOT NULL,
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`milestone\` VARCHAR(128) NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`status\` VARCHAR(32) DEFAULT 'PENDING',
  \`due_date\` DATE DEFAULT NULL,
  \`paid_date\` DATE DEFAULT NULL,
  \`payment_mode\` VARCHAR(64) DEFAULT 'Bank NEFT/RTGS',
  \`transaction_reference\` VARCHAR(128) DEFAULT '',
  \`notes\` TEXT,
  \`tally_sync_status\` VARCHAR(32) DEFAULT 'NOT SYNCED',
  \`tally_reference\` VARCHAR(128) DEFAULT '',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_payments_project\` (\`project_id\`),
  INDEX \`idx_payments_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 9. solar_expenses
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_expenses`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_expenses\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`expense_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`project_id\` VARCHAR(64) DEFAULT '',
  \`project_code\` VARCHAR(64) DEFAULT '',
  \`vendor_name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(128) NOT NULL,
  \`amount\` DECIMAL(14,2) NOT NULL,
  \`expense_date\` DATE NOT NULL,
  \`payment_mode\` VARCHAR(64) DEFAULT 'Bank Payment',
  \`reference_no\` VARCHAR(128) DEFAULT '',
  \`notes\` TEXT,
  \`receipt_url\` TEXT,
  \`approved_by\` VARCHAR(255) DEFAULT '',
  \`tally_sync_status\` VARCHAR(32) DEFAULT 'NOT SYNCED',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_expenses_project\` (\`project_id\`),
  INDEX \`idx_expenses_category\` (\`category\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 10. solar_employees
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_employees`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_employees\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`employee_code\` VARCHAR(32) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`photo_url\` TEXT,
  \`department\` VARCHAR(64) NOT NULL,
  \`designation\` VARCHAR(128) NOT NULL,
  \`phone\` VARCHAR(32) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL,
  \`joining_date\` DATE NOT NULL,
  \`salary_monthly\` DECIMAL(12,2) DEFAULT 0.00,
  \`status\` VARCHAR(32) DEFAULT 'ACTIVE',
  \`current_site_location\` VARCHAR(255) DEFAULT '',
  \`login_enabled\` TINYINT(1) DEFAULT 1,
  \`system_role\` VARCHAR(64) DEFAULT 'Super Admin',
  \`is_field_worker\` TINYINT(1) DEFAULT 0,
  \`account_status\` VARCHAR(32) DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_employees_dept\` (\`department\`),
  INDEX \`idx_employees_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 11. solar_attendance
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_attendance`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_attendance\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`employee_id\` VARCHAR(64) NOT NULL,
  \`employee_name\` VARCHAR(255) NOT NULL,
  \`attendance_date\` DATE NOT NULL,
  \`check_in_time\` VARCHAR(16) NOT NULL,
  \`check_out_time\` VARCHAR(16) DEFAULT NULL,
  \`check_in_gps_json\` LONGTEXT,
  \`check_out_gps_json\` LONGTEXT,
  \`site_project_id\` VARCHAR(64) DEFAULT '',
  \`site_project_title\` VARCHAR(255) DEFAULT '',
  \`status\` VARCHAR(32) DEFAULT 'PRESENT',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_attendance_emp_date\` (\`employee_id\`, \`attendance_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 12. solar_payslips
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_payslips`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_payslips\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`employee_id\` VARCHAR(64) NOT NULL,
  \`employee_name\` VARCHAR(255) NOT NULL,
  \`month\` VARCHAR(32) NOT NULL,
  \`year\` INT NOT NULL,
  \`basic_salary\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`allowances\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`deductions\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`net_salary\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`payment_status\` VARCHAR(32) DEFAULT 'PAID',
  \`payment_date\` DATE DEFAULT NULL,
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_payslips_emp\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 13. solar_holidays
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_holidays`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_holidays\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`holiday_date\` DATE NOT NULL,
  \`type\` VARCHAR(64) DEFAULT 'Mandatory',
  \`description\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 14. solar_service_tickets
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_service_tickets`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_service_tickets\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`ticket_id\` VARCHAR(64) NOT NULL UNIQUE,
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`project_id\` VARCHAR(64) NOT NULL,
  \`project_title\` VARCHAR(255) DEFAULT '',
  \`issue\` TEXT NOT NULL,
  \`category\` VARCHAR(64) DEFAULT 'Inverter Warning',
  \`priority\` VARCHAR(32) DEFAULT 'MEDIUM',
  \`assigned_technician_id\` VARCHAR(64) DEFAULT '',
  \`assigned_technician_name\` VARCHAR(255) DEFAULT '',
  \`status\` VARCHAR(32) DEFAULT 'OPEN',
  \`scheduled_date\` DATE DEFAULT NULL,
  \`resolved_date\` DATE DEFAULT NULL,
  \`notes\` TEXT,
  \`photos_json\` LONGTEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_tickets_customer\` (\`customer_id\`),
  INDEX \`idx_tickets_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 15. solar_amc_contracts
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_amc_contracts`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_amc_contracts\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`amc_code\` VARCHAR(64) NOT NULL UNIQUE,
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`project_id\` VARCHAR(64) NOT NULL,
  \`project_title\` VARCHAR(255) NOT NULL,
  \`plan_name\` VARCHAR(128) NOT NULL,
  \`start_date\` DATE NOT NULL,
  \`end_date\` DATE NOT NULL,
  \`renewal_date\` DATE DEFAULT NULL,
  \`annual_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`visits_completed\` INT DEFAULT 0,
  \`total_visits\` INT DEFAULT 4,
  \`status\` VARCHAR(32) DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_amc_customer\` (\`customer_id\`),
  INDEX \`idx_amc_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 16. solar_notifications
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_notifications`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_notifications\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`user_id\` VARCHAR(64) DEFAULT '',
  \`title\` VARCHAR(255) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`type\` VARCHAR(32) DEFAULT 'INFO',
  \`is_read\` TINYINT(1) DEFAULT 0,
  \`link_type\` VARCHAR(32) DEFAULT NULL,
  \`link_id\` VARCHAR(64) DEFAULT NULL,
  \`customer_id\` VARCHAR(64) DEFAULT NULL,
  \`project_id\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_notif_read\` (\`is_read\`),
  INDEX \`idx_notif_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 17. solar_products
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_products`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_products\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`sku\` VARCHAR(64) NOT NULL UNIQUE,
  \`category\` VARCHAR(64) NOT NULL,
  \`brand\` VARCHAR(128) DEFAULT '',
  \`model\` VARCHAR(128) DEFAULT '',
  \`specifications\` TEXT,
  \`unit\` VARCHAR(32) DEFAULT 'Nos',
  \`hsn_code\` VARCHAR(32) DEFAULT '',
  \`gst_rate\` DECIMAL(5,2) DEFAULT 18.00,
  \`unit_price\` DECIMAL(12,2) DEFAULT 0.00,
  \`current_stock\` DECIMAL(12,2) DEFAULT 0.00,
  \`reorder_level\` DECIMAL(12,2) DEFAULT 0.00,
  \`warehouse_id\` VARCHAR(64) DEFAULT '',
  \`status\` VARCHAR(32) DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_products_category\` (\`category\`),
  INDEX \`idx_products_sku\` (\`sku\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 18. solar_vendors
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_vendors`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_vendors\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`vendor_code\` VARCHAR(32) NOT NULL UNIQUE,
  \`contact_person\` VARCHAR(128) DEFAULT '',
  \`phone\` VARCHAR(32) DEFAULT '',
  \`email\` VARCHAR(191) DEFAULT '',
  \`address\` TEXT,
  \`city\` VARCHAR(128) DEFAULT '',
  \`state\` VARCHAR(128) DEFAULT '',
  \`gst_number\` VARCHAR(32) DEFAULT '',
  \`pan_number\` VARCHAR(32) DEFAULT '',
  \`payment_terms\` VARCHAR(128) DEFAULT '30 Days',
  \`rating\` DECIMAL(3,1) DEFAULT 4.5,
  \`categories_json\` LONGTEXT,
  \`status\` VARCHAR(32) DEFAULT 'ACTIVE',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_vendors_code\` (\`vendor_code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 19. solar_purchase_orders
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_purchase_orders`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_purchase_orders\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`po_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`vendor_id\` VARCHAR(64) NOT NULL,
  \`vendor_name\` VARCHAR(255) NOT NULL,
  \`po_date\` DATE NOT NULL,
  \`expected_delivery_date\` DATE DEFAULT NULL,
  \`project_id\` VARCHAR(64) DEFAULT '',
  \`items_json\` LONGTEXT NOT NULL,
  \`subtotal\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`gst_amount\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`total_amount\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`status\` VARCHAR(32) DEFAULT 'ISSUED',
  \`payment_status\` VARCHAR(32) DEFAULT 'PENDING',
  \`receipts_json\` LONGTEXT,
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_po_vendor\` (\`vendor_id\`),
  INDEX \`idx_po_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 20. solar_boms
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_boms`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_boms\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`bom_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`project_id\` VARCHAR(64) NOT NULL,
  \`project_title\` VARCHAR(255) NOT NULL,
  \`system_capacity_kw\` DECIMAL(10,2) NOT NULL,
  \`version\` VARCHAR(16) DEFAULT '1.0',
  \`status\` VARCHAR(32) DEFAULT 'APPROVED',
  \`items_json\` LONGTEXT NOT NULL,
  \`total_estimated_cost\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`created_by\` VARCHAR(128) DEFAULT '',
  \`approved_by\` VARCHAR(128) DEFAULT '',
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_boms_project\` (\`project_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 21. solar_sales_invoices
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_sales_invoices`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_sales_invoices\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`invoice_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`project_id\` VARCHAR(64) DEFAULT '',
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`invoice_date\` DATE NOT NULL,
  \`due_date\` DATE DEFAULT NULL,
  \`items_json\` LONGTEXT NOT NULL,
  \`subtotal\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`gst_amount\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`total_amount\` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  \`payment_status\` VARCHAR(32) DEFAULT 'UNPAID',
  \`paid_amount\` DECIMAL(14,2) DEFAULT 0.00,
  \`balance_amount\` DECIMAL(14,2) DEFAULT 0.00,
  \`eway_bill_number\` VARCHAR(64) DEFAULT '',
  \`eway_bill_details_json\` LONGTEXT,
  \`warehouse_id\` VARCHAR(64) DEFAULT '',
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_invoices_customer\` (\`customer_id\`),
  INDEX \`idx_invoices_status\` (\`payment_status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 22. solar_warehouses
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_warehouses`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_warehouses\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL UNIQUE,
  \`address\` TEXT NOT NULL,
  \`city\` VARCHAR(128) NOT NULL,
  \`state\` VARCHAR(128) DEFAULT '',
  \`pincode\` VARCHAR(16) DEFAULT '',
  \`manager_name\` VARCHAR(128) DEFAULT '',
  \`manager_phone\` VARCHAR(32) DEFAULT '',
  \`gst_number\` VARCHAR(32) DEFAULT '',
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 23. solar_stock_movements
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_stock_movements`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_stock_movements\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`product_id\` VARCHAR(64) NOT NULL,
  \`product_name\` VARCHAR(255) NOT NULL,
  \`sku\` VARCHAR(64) DEFAULT '',
  \`movement_type\` VARCHAR(64) NOT NULL,
  \`quantity\` DECIMAL(12,2) NOT NULL,
  \`balance_after\` DECIMAL(12,2) NOT NULL,
  \`reference_number\` VARCHAR(64) DEFAULT '',
  \`warehouse_id\` VARCHAR(64) DEFAULT '',
  \`notes\` TEXT,
  \`timestamp\` DATETIME NOT NULL,
  \`performed_by\` VARCHAR(128) DEFAULT '',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_sm_product\` (\`product_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 24. solar_stock_audits
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_stock_audits`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_stock_audits\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`audit_number\` VARCHAR(64) NOT NULL UNIQUE,
  \`warehouse_id\` VARCHAR(64) NOT NULL,
  \`warehouse_name\` VARCHAR(255) NOT NULL,
  \`audit_date\` DATE NOT NULL,
  \`auditor_name\` VARCHAR(128) NOT NULL,
  \`status\` VARCHAR(32) DEFAULT 'COMPLETED',
  \`discrepancies_count\` INT DEFAULT 0,
  \`items_json\` LONGTEXT NOT NULL,
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 25. solar_acl_config
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_acl_config`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_acl_config\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`config_json\` LONGTEXT NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 26. solar_acl_audit_logs
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_acl_audit_logs`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_acl_audit_logs\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`actor_id\` VARCHAR(64) NOT NULL,
  \`actor_name\` VARCHAR(255) NOT NULL,
  \`actor_role\` VARCHAR(64) NOT NULL,
  \`action\` VARCHAR(64) NOT NULL,
  \`target_role\` VARCHAR(64) DEFAULT '',
  \`details\` TEXT NOT NULL,
  \`timestamp\` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 27. solar_system_settings
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_system_settings`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_system_settings\` (
  \`setting_key\` VARCHAR(64) PRIMARY KEY,
  \`setting_value\` LONGTEXT NOT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 28. solar_workforce_locations
  lines.push('-- --------------------------------------------------------');
  lines.push('-- Table structure for table `solar_workforce_locations`');
  lines.push('-- --------------------------------------------------------');
  lines.push(`CREATE TABLE IF NOT EXISTS \`solar_workforce_locations\` (
  \`user_id\` VARCHAR(64) PRIMARY KEY,
  \`employee_code\` VARCHAR(64) DEFAULT '',
  \`name\` VARCHAR(255) DEFAULT '',
  \`email\` VARCHAR(191) DEFAULT '',
  \`role\` VARCHAR(64) DEFAULT '',
  \`latitude\` DECIMAL(10,7) DEFAULT NULL,
  \`longitude\` DECIMAL(10,7) DEFAULT NULL,
  \`accuracy\` DECIMAL(8,2) DEFAULT NULL,
  \`heading\` DECIMAL(8,2) DEFAULT NULL,
  \`speed\` DECIMAL(8,2) DEFAULT NULL,
  \`battery_level\` INT DEFAULT NULL,
  \`activity\` VARCHAR(128) DEFAULT '',
  \`is_online\` TINYINT(1) DEFAULT 0,
  \`is_sharing_location\` TINYINT(1) DEFAULT 0,
  \`status\` VARCHAR(32) DEFAULT 'offline',
  \`last_seen_at\` DATETIME DEFAULT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push('-- ==========================================================');
  lines.push('-- DATA MIGRATION: POPULATING ALL EXISTING PRODUCTION DATA');
  lines.push('-- ==========================================================');
  lines.push('');

  // --- Seed solar_users ---
  lines.push('-- Pushing users data into solar_users');
  DEMO_ACCOUNTS.forEach(account => {
    lines.push(`INSERT INTO \`solar_users\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`phone\`, \`department\`, \`designation\`, \`employee_id\`, \`is_field_worker\`, \`status\`)
VALUES (${escapeSql(account.profile.id)}, ${escapeSql(account.name)}, ${escapeSql(account.email)}, ${escapeSql(account.password)}, ${escapeSql(account.role)}, ${escapeSql(account.profile.phone || '+91 98000 00000')}, ${escapeSql(account.department)}, ${escapeSql(account.profile.designation || account.role)}, ${escapeSql(account.profile.employeeId)}, ${account.isFieldWorker ? 1 : 0}, 'ACTIVE')
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`role\` = VALUES(\`role\`), \`password\` = VALUES(\`password\`);`);
  });
  lines.push('');

  // --- Seed solar_customers ---
  const customers = storageService.getCustomers();
  lines.push(`-- Pushing ${customers.length} records into solar_customers`);
  customers.forEach(c => {
    lines.push(`INSERT INTO \`solar_customers\` (\`id\`, \`customer_code\`, \`name\`, \`company_name\`, \`customer_type\`, \`phone\`, \`email\`, \`password\`, \`site_address\`, \`city\`, \`state\`, \`pincode\`, \`gst_number\`, \`electricity_consumer_no\`, \`sanctioned_load_kw\`, \`status\`, \`active_project_id\`)
VALUES (${escapeSql(c.id)}, ${escapeSql(c.customerCode || c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.companyName || '')}, ${escapeSql(c.customerType || 'Residential')}, ${escapeSql(c.phone)}, ${escapeSql(c.email || '')}, ${escapeSql(c.password || '123456')}, ${escapeSql(c.siteAddress)}, ${escapeSql(c.city)}, ${escapeSql(c.state || 'Gujarat')}, ${escapeSql(c.pincode || '')}, ${escapeSql(c.gstNumber || '')}, ${escapeSql(c.electricityConsumerNo || '')}, ${Number(c.sanctionedLoadKw) || 0}, ${escapeSql(c.status || 'ACTIVE')}, ${escapeSql(c.activeProjectId || null)})
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`phone\` = VALUES(\`phone\`), \`password\` = VALUES(\`password\`), \`email\` = VALUES(\`email\`);`);
  });
  lines.push('');

  // --- Seed solar_leads ---
  const leads = storageService.getLeads();
  lines.push(`-- Pushing ${leads.length} records into solar_leads`);
  leads.forEach(l => {
    lines.push(`INSERT INTO \`solar_leads\` (\`id\`, \`customer_name\`, \`company_name\`, \`phone\`, \`email\`, \`address\`, \`city\`, \`solar_capacity_kw\`, \`estimated_value\`, \`source\`, \`assigned_salesperson_id\`, \`assigned_salesperson_name\`, \`status\`, \`notes\`, \`next_follow_up_date\`)
VALUES (${escapeSql(l.id)}, ${escapeSql(l.customerName)}, ${escapeSql(l.companyName || '')}, ${escapeSql(l.phone)}, ${escapeSql(l.email || '')}, ${escapeSql(l.address || '')}, ${escapeSql(l.city || '')}, ${Number(l.solarCapacityKw) || 0}, ${Number(l.estimatedValue) || 0}, ${escapeSql(l.source || 'Website')}, ${escapeSql(l.assignedSalespersonId || '')}, ${escapeSql(l.assignedSalespersonName || '')}, ${escapeSql(l.status || 'NEW')}, ${escapeSql(l.notes || '')}, ${l.nextFollowUpDate ? escapeSql(l.nextFollowUpDate.split('T')[0]) : 'NULL'})
ON DUPLICATE KEY UPDATE \`customer_name\` = VALUES(\`customer_name\`), \`status\` = VALUES(\`status\`);`);
  });
  lines.push('');

  // --- Seed solar_projects & project stages ---
  const projects = storageService.getProjects();
  lines.push(`-- Pushing ${projects.length} records into solar_projects and stages`);
  projects.forEach(p => {
    lines.push(`INSERT INTO \`solar_projects\` (\`id\`, \`project_code\`, \`customer_id\`, \`customer_name\`, \`title\`, \`capacity_kw\`, \`total_value\`, \`status\`, \`current_stage_key\`, \`completion_percentage\`, \`project_manager_id\`, \`project_manager_name\`, \`site_address\`, \`city\`, \`inverter_model\`, \`panel_model\`, \`structure_type\`, \`start_date\`, \`expected_completion_date\`, \`notes\`, \`assignments_json\`)
VALUES (${escapeSql(p.id)}, ${escapeSql(p.projectCode || p.id)}, ${escapeSql(p.customerId)}, ${escapeSql(p.customerName)}, ${escapeSql(p.title)}, ${Number(p.capacityKw) || 0}, ${Number(p.totalValue) || 0}, ${escapeSql(p.status || 'PLANNING')}, ${escapeSql(p.currentStageKey || 'site_survey')}, ${Number(p.completionPercentage) || 0}, ${escapeSql(p.projectManagerId || '')}, ${escapeSql(p.projectManagerName || '')}, ${escapeSql(p.siteAddress)}, ${escapeSql(p.city)}, ${escapeSql(p.inverterModel || '')}, ${escapeSql(p.panelModel || '')}, ${escapeSql(p.structureType || 'Elevated GI Structure')}, ${p.startDate ? escapeSql(p.startDate.split('T')[0]) : 'NULL'}, ${p.expectedCompletionDate ? escapeSql(p.expectedCompletionDate.split('T')[0]) : 'NULL'}, ${escapeSql(p.notes || '')}, ${escapeSql(p.assignments || [])})
ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`status\` = VALUES(\`status\`), \`completion_percentage\` = VALUES(\`completion_percentage\`);`);

    if (Array.isArray(p.stages)) {
      p.stages.forEach((st, sidx) => {
        lines.push(`INSERT INTO \`solar_project_stages\` (\`id\`, \`project_id\`, \`stage_key\`, \`title\`, \`stage_order\`, \`department\`, \`assigned_role\`, \`assigned_employee_id\`, \`assigned_employee_name\`, \`status\`, \`priority\`, \`start_date\`, \`due_date\`, \`completed_date\`, \`checklist_json\`, \`photos_json\`, \`documents_json\`, \`notes\`, \`approved_by\`)
VALUES (${escapeSql(st.id || `${p.id}_st_${sidx}`)}, ${escapeSql(p.id)}, ${escapeSql(st.key || st.stageKey || 'stage')}, ${escapeSql(st.title || st.name)}, ${sidx + 1}, ${escapeSql(st.department || 'Operations')}, ${escapeSql(st.assignedRole || 'Project Manager')}, ${escapeSql(st.assignedEmployeeId || '')}, ${escapeSql(st.assignedEmployeeName || '')}, ${escapeSql(st.status || 'NOT STARTED')}, ${escapeSql(st.priority || 'MEDIUM')}, ${st.startDate ? escapeSql(st.startDate.split('T')[0]) : 'NULL'}, ${st.dueDate ? escapeSql(st.dueDate.split('T')[0]) : 'NULL'}, ${st.completedDate ? escapeSql(st.completedDate.split('T')[0]) : 'NULL'}, ${escapeSql(st.checklist || [])}, ${escapeSql(st.photos || [])}, ${escapeSql(st.documents || [])}, ${escapeSql(st.notes || '')}, ${escapeSql(st.approvedBy || '')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`);
      });
    }
  });
  lines.push('');

  // --- Seed solar_employees ---
  const employees = storageService.getEmployees();
  lines.push(`-- Pushing ${employees.length} records into solar_employees`);
  employees.forEach(e => {
    lines.push(`INSERT INTO \`solar_employees\` (\`id\`, \`employee_code\`, \`name\`, \`photo_url\`, \`department\`, \`designation\`, \`phone\`, \`email\`, \`joining_date\`, \`salary_monthly\`, \`status\`, \`current_site_location\`, \`login_enabled\`, \`system_role\`, \`is_field_worker\`, \`account_status\`)
VALUES (${escapeSql(e.id)}, ${escapeSql(e.employeeCode || e.id)}, ${escapeSql(e.name)}, ${escapeSql(e.photoUrl || '')}, ${escapeSql(e.department)}, ${escapeSql(e.designation)}, ${escapeSql(e.phone)}, ${escapeSql(e.email)}, ${e.joiningDate ? escapeSql(e.joiningDate.split('T')[0]) : "'2025-01-01'"}, ${Number(e.salaryMonthly) || 0}, ${escapeSql(e.status || 'ACTIVE')}, ${escapeSql(e.currentSiteLocation || '')}, ${e.loginEnabled !== false ? 1 : 0}, ${escapeSql(e.systemRole || 'Super Admin')}, ${e.isFieldWorker ? 1 : 0}, ${escapeSql(e.accountStatus || 'ACTIVE')})
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`phone\` = VALUES(\`phone\`), \`department\` = VALUES(\`department\`);`);
  });
  lines.push('');

  // --- Seed solar_payments ---
  const payments = storageService.getPayments();
  lines.push(`-- Pushing ${payments.length} records into solar_payments`);
  payments.forEach(pay => {
    lines.push(`INSERT INTO \`solar_payments\` (\`id\`, \`receipt_number\`, \`project_id\`, \`customer_id\`, \`customer_name\`, \`milestone\`, \`amount\`, \`status\`, \`due_date\`, \`paid_date\`, \`payment_mode\`, \`transaction_reference\`, \`notes\`, \`tally_sync_status\`)
VALUES (${escapeSql(pay.id)}, ${escapeSql(pay.receiptNumber || pay.id)}, ${escapeSql(pay.projectId)}, ${escapeSql(pay.customerId)}, ${escapeSql(pay.customerName)}, ${escapeSql(pay.milestone)}, ${Number(pay.amount) || 0}, ${escapeSql(pay.status || 'PENDING')}, ${pay.dueDate ? escapeSql(pay.dueDate.split('T')[0]) : 'NULL'}, ${pay.paidDate ? escapeSql(pay.paidDate.split('T')[0]) : 'NULL'}, ${escapeSql(pay.paymentMode || 'Bank NEFT/RTGS')}, ${escapeSql(pay.transactionReference || '')}, ${escapeSql(pay.notes || '')}, ${escapeSql(pay.tallySyncStatus || 'NOT SYNCED')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`amount\` = VALUES(\`amount\`);`);
  });
  lines.push('');

  // --- Seed solar_expenses ---
  const expenses = storageService.getExpenses();
  lines.push(`-- Pushing ${expenses.length} records into solar_expenses`);
  expenses.forEach(ex => {
    lines.push(`INSERT INTO \`solar_expenses\` (\`id\`, \`expense_number\`, \`project_id\`, \`project_code\`, \`vendor_name\`, \`category\`, \`amount\`, \`expense_date\`, \`payment_mode\`, \`reference_no\`, \`notes\`, \`approved_by\`, \`tally_sync_status\`)
VALUES (${escapeSql(ex.id)}, ${escapeSql(ex.expenseNumber || ex.id)}, ${escapeSql(ex.projectId || '')}, ${escapeSql(ex.projectCode || '')}, ${escapeSql(ex.vendorName)}, ${escapeSql(ex.category)}, ${Number(ex.amount) || 0}, ${ex.expenseDate ? escapeSql(ex.expenseDate.split('T')[0]) : "'2026-08-01'"}, ${escapeSql(ex.paymentMode || 'Bank Payment')}, ${escapeSql(ex.referenceNo || '')}, ${escapeSql(ex.notes || '')}, ${escapeSql(ex.approvedBy || '')}, ${escapeSql(ex.tallySyncStatus || 'NOT SYNCED')})
ON DUPLICATE KEY UPDATE \`amount\` = VALUES(\`amount\`);`);
  });
  lines.push('');

  // --- Seed solar_attendance ---
  const attendance = storageService.getAttendance();
  lines.push(`-- Pushing ${attendance.length} records into solar_attendance`);
  attendance.forEach(att => {
    lines.push(`INSERT INTO \`solar_attendance\` (\`id\`, \`employee_id\`, \`employee_name\`, \`attendance_date\`, \`check_in_time\`, \`check_out_time\`, \`check_in_gps_json\`, \`check_out_gps_json\`, \`site_project_id\`, \`site_project_title\`, \`status\`)
VALUES (${escapeSql(att.id)}, ${escapeSql(att.employeeId)}, ${escapeSql(att.employeeName)}, ${escapeSql(att.attendanceDate)}, ${escapeSql(att.checkInTime)}, ${escapeSql(att.checkOutTime || null)}, ${escapeSql(att.checkInGps || null)}, ${escapeSql(att.checkOutGps || null)}, ${escapeSql(att.siteProjectId || '')}, ${escapeSql(att.siteProjectTitle || '')}, ${escapeSql(att.status || 'PRESENT')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`);
  });
  lines.push('');

  // --- Seed solar_payslips ---
  const payslips = storageService.getPayslips();
  lines.push(`-- Pushing ${payslips.length} records into solar_payslips`);
  payslips.forEach(ps => {
    lines.push(`INSERT INTO \`solar_payslips\` (\`id\`, \`employee_id\`, \`employee_name\`, \`month\`, \`year\`, \`basic_salary\`, \`allowances\`, \`deductions\`, \`net_salary\`, \`payment_status\`, \`payment_date\`, \`notes\`)
VALUES (${escapeSql(ps.id)}, ${escapeSql(ps.employeeId)}, ${escapeSql(ps.employeeName)}, ${escapeSql(ps.month)}, ${Number(ps.year) || 2026}, ${Number(ps.basicSalary) || 0}, ${Number(ps.allowances) || 0}, ${Number(ps.deductions) || 0}, ${Number(ps.netSalary) || 0}, ${escapeSql(ps.paymentStatus || 'PAID')}, ${ps.paymentDate ? escapeSql(ps.paymentDate.split('T')[0]) : 'NULL'}, ${escapeSql(ps.notes || '')})
ON DUPLICATE KEY UPDATE \`payment_status\` = VALUES(\`payment_status\`);`);
  });
  lines.push('');

  // --- Seed solar_holidays ---
  const holidays = storageService.getHolidays();
  lines.push(`-- Pushing ${holidays.length} records into solar_holidays`);
  holidays.forEach(h => {
    lines.push(`INSERT INTO \`solar_holidays\` (\`id\`, \`name\`, \`holiday_date\`, \`type\`, \`description\`)
VALUES (${escapeSql(h.id)}, ${escapeSql(h.name)}, ${escapeSql(h.date || h.holidayDate)}, ${escapeSql(h.type || 'Mandatory')}, ${escapeSql(h.description || '')})
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);`);
  });
  lines.push('');

  // --- Seed solar_service_tickets ---
  const tickets = storageService.getServiceTickets();
  lines.push(`-- Pushing ${tickets.length} records into solar_service_tickets`);
  tickets.forEach(tk => {
    lines.push(`INSERT INTO \`solar_service_tickets\` (\`id\`, \`ticket_id\`, \`customer_id\`, \`customer_name\`, \`project_id\`, \`project_title\`, \`issue\`, \`category\`, \`priority\`, \`assigned_technician_id\`, \`assigned_technician_name\`, \`status\`, \`scheduled_date\`, \`resolved_date\`, \`notes\`, \`photos_json\`)
VALUES (${escapeSql(tk.id)}, ${escapeSql(tk.ticketId || tk.id)}, ${escapeSql(tk.customerId)}, ${escapeSql(tk.customerName)}, ${escapeSql(tk.projectId)}, ${escapeSql(tk.projectTitle || '')}, ${escapeSql(tk.issue)}, ${escapeSql(tk.category || 'Inverter Warning')}, ${escapeSql(tk.priority || 'MEDIUM')}, ${escapeSql(tk.assignedTechnicianId || '')}, ${escapeSql(tk.assignedTechnicianName || '')}, ${escapeSql(tk.status || 'OPEN')}, ${tk.scheduledDate ? escapeSql(tk.scheduledDate.split('T')[0]) : 'NULL'}, ${tk.resolvedDate ? escapeSql(tk.resolvedDate.split('T')[0]) : 'NULL'}, ${escapeSql(tk.notes || '')}, ${escapeSql(tk.photos || [])})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`);
  });
  lines.push('');

  // --- Seed solar_amc_contracts ---
  const amcContracts = storageService.getAMCContracts();
  lines.push(`-- Pushing ${amcContracts.length} records into solar_amc_contracts`);
  amcContracts.forEach(amc => {
    lines.push(`INSERT INTO \`solar_amc_contracts\` (\`id\`, \`amc_code\`, \`customer_id\`, \`customer_name\`, \`project_id\`, \`project_title\`, \`plan_name\`, \`start_date\`, \`end_date\`, \`annual_amount\`, \`visits_completed\`, \`total_visits\`, \`status\`)
VALUES (${escapeSql(amc.id)}, ${escapeSql(amc.amcCode || amc.id)}, ${escapeSql(amc.customerId)}, ${escapeSql(amc.customerName)}, ${escapeSql(amc.projectId)}, ${escapeSql(amc.projectTitle || '')}, ${escapeSql(amc.planName || 'Comprehensive AMC')}, ${escapeSql(amc.startDate.split('T')[0])}, ${escapeSql(amc.endDate.split('T')[0])}, ${Number(amc.annualAmount) || 0}, ${Number(amc.visitsCompleted) || 0}, ${Number(amc.totalVisits) || 4}, ${escapeSql(amc.status || 'ACTIVE')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`);
  });
  lines.push('');

  // --- Seed solar_products ---
  const products = storageService.getProducts();
  lines.push(`-- Pushing ${products.length} records into solar_products`);
  products.forEach(prod => {
    lines.push(`INSERT INTO \`solar_products\` (\`id\`, \`name\`, \`sku\`, \`category\`, \`brand\`, \`model\`, \`specifications\`, \`unit\`, \`hsn_code\`, \`gst_rate\`, \`unit_price\`, \`current_stock\`, \`reorder_level\`, \`warehouse_id\`, \`status\`)
VALUES (${escapeSql(prod.id)}, ${escapeSql(prod.name)}, ${escapeSql(prod.sku)}, ${escapeSql(prod.category)}, ${escapeSql(prod.brand || '')}, ${escapeSql(prod.model || '')}, ${escapeSql(prod.specifications || '')}, ${escapeSql(prod.unit || 'Nos')}, ${escapeSql(prod.hsnCode || '')}, ${Number(prod.gstRate) || 18}, ${Number(prod.unitPrice) || 0}, ${Number(prod.currentStock) || 0}, ${Number(prod.reorderLevel) || 0}, ${escapeSql(prod.warehouseId || '')}, ${escapeSql(prod.status || 'ACTIVE')})
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`current_stock\` = VALUES(\`current_stock\`), \`unit_price\` = VALUES(\`unit_price\`);`);
  });
  lines.push('');

  // --- Seed solar_vendors ---
  const vendors = storageService.getVendors();
  lines.push(`-- Pushing ${vendors.length} records into solar_vendors`);
  vendors.forEach(v => {
    lines.push(`INSERT INTO \`solar_vendors\` (\`id\`, \`name\`, \`vendor_code\`, \`contact_person\`, \`phone\`, \`email\`, \`address\`, \`city\`, \`state\`, \`gst_number\`, \`pan_number\`, \`payment_terms\`, \`rating\`, \`categories_json\`, \`status\`)
VALUES (${escapeSql(v.id)}, ${escapeSql(v.name)}, ${escapeSql(v.vendorCode || v.id)}, ${escapeSql(v.contactPerson || '')}, ${escapeSql(v.phone || '')}, ${escapeSql(v.email || '')}, ${escapeSql(v.address || '')}, ${escapeSql(v.city || '')}, ${escapeSql(v.state || '')}, ${escapeSql(v.gstNumber || '')}, ${escapeSql(v.panNumber || '')}, ${escapeSql(v.paymentTerms || '30 Days')}, ${Number(v.rating) || 4.5}, ${escapeSql(v.categories || [])}, ${escapeSql(v.status || 'ACTIVE')})
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`phone\` = VALUES(\`phone\`);`);
  });
  lines.push('');

  // --- Seed solar_purchase_orders ---
  const purchaseOrders = storageService.getPurchaseOrders();
  lines.push(`-- Pushing ${purchaseOrders.length} records into solar_purchase_orders`);
  purchaseOrders.forEach(po => {
    lines.push(`INSERT INTO \`solar_purchase_orders\` (\`id\`, \`po_number\`, \`vendor_id\`, \`vendor_name\`, \`po_date\`, \`expected_delivery_date\`, \`project_id\`, \`items_json\`, \`subtotal\`, \`gst_amount\`, \`total_amount\`, \`status\`, \`payment_status\`, \`receipts_json\`, \`notes\`)
VALUES (${escapeSql(po.id)}, ${escapeSql(po.poNumber || po.id)}, ${escapeSql(po.vendorId)}, ${escapeSql(po.vendorName)}, ${po.poDate ? escapeSql(po.poDate.split('T')[0]) : "'2026-08-01'"}, ${po.expectedDeliveryDate ? escapeSql(po.expectedDeliveryDate.split('T')[0]) : 'NULL'}, ${escapeSql(po.projectId || '')}, ${escapeSql(po.items || [])}, ${Number(po.subtotal) || 0}, ${Number(po.gstAmount) || 0}, ${Number(po.totalAmount) || 0}, ${escapeSql(po.status || 'ISSUED')}, ${escapeSql(po.paymentStatus || 'PENDING')}, ${escapeSql(po.receipts || [])}, ${escapeSql(po.notes || '')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`total_amount\` = VALUES(\`total_amount\`);`);
  });
  lines.push('');

  // --- Seed solar_boms ---
  const boms = storageService.getBOMs();
  lines.push(`-- Pushing ${boms.length} records into solar_boms`);
  boms.forEach(bom => {
    lines.push(`INSERT INTO \`solar_boms\` (\`id\`, \`bom_number\`, \`project_id\`, \`project_title\`, \`system_capacity_kw\`, \`version\`, \`status\`, \`items_json\`, \`total_estimated_cost\`, \`created_by\`, \`approved_by\`, \`notes\`)
VALUES (${escapeSql(bom.id)}, ${escapeSql(bom.bomNumber || bom.id)}, ${escapeSql(bom.projectId)}, ${escapeSql(bom.projectTitle)}, ${Number(bom.systemCapacityKw) || 0}, ${escapeSql(bom.version || '1.0')}, ${escapeSql(bom.status || 'APPROVED')}, ${escapeSql(bom.items || [])}, ${Number(bom.totalEstimatedCost) || 0}, ${escapeSql(bom.createdBy || '')}, ${escapeSql(bom.approvedBy || '')}, ${escapeSql(bom.notes || '')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`);
  });
  lines.push('');

  // --- Seed solar_sales_invoices ---
  const salesInvoices = storageService.getSalesInvoices();
  lines.push(`-- Pushing ${salesInvoices.length} records into solar_sales_invoices`);
  salesInvoices.forEach(inv => {
    lines.push(`INSERT INTO \`solar_sales_invoices\` (\`id\`, \`invoice_number\`, \`project_id\`, \`customer_id\`, \`customer_name\`, \`invoice_date\`, \`due_date\`, \`items_json\`, \`subtotal\`, \`gst_amount\`, \`total_amount\`, \`payment_status\`, \`paid_amount\`, \`balance_amount\`, \`eway_bill_number\`, \`eway_bill_details_json\`, \`warehouse_id\`, \`notes\`)
VALUES (${escapeSql(inv.id)}, ${escapeSql(inv.invoiceNumber || inv.id)}, ${escapeSql(inv.projectId || '')}, ${escapeSql(inv.customerId)}, ${escapeSql(inv.customerName)}, ${inv.invoiceDate ? escapeSql(inv.invoiceDate.split('T')[0]) : "'2026-08-01'"}, ${inv.dueDate ? escapeSql(inv.dueDate.split('T')[0]) : 'NULL'}, ${escapeSql(inv.items || [])}, ${Number(inv.subtotal) || 0}, ${Number(inv.gstAmount) || 0}, ${Number(inv.totalAmount) || 0}, ${escapeSql(inv.paymentStatus || 'UNPAID')}, ${Number(inv.paidAmount) || 0}, ${Number(inv.balanceAmount) || 0}, ${escapeSql(inv.ewayBillNumber || '')}, ${escapeSql(inv.ewayBillDetails || null)}, ${escapeSql(inv.warehouseId || '')}, ${escapeSql(inv.notes || '')})
ON DUPLICATE KEY UPDATE \`payment_status\` = VALUES(\`payment_status\`);`);
  });
  lines.push('');

  // --- Seed solar_warehouses ---
  const warehouses = storageService.getWarehouses();
  lines.push(`-- Pushing ${warehouses.length} records into solar_warehouses`);
  warehouses.forEach(wh => {
    lines.push(`INSERT INTO \`solar_warehouses\` (\`id\`, \`name\`, \`code\`, \`address\`, \`city\`, \`state\`, \`pincode\`, \`manager_name\`, \`manager_phone\`, \`gst_number\`, \`is_active\`)
VALUES (${escapeSql(wh.id)}, ${escapeSql(wh.name)}, ${escapeSql(wh.code)}, ${escapeSql(wh.address)}, ${escapeSql(wh.city)}, ${escapeSql(wh.state || '')}, ${escapeSql(wh.pincode || '')}, ${escapeSql(wh.managerName || '')}, ${escapeSql(wh.managerPhone || '')}, ${escapeSql(wh.gstNumber || '')}, ${wh.isActive !== false ? 1 : 0})
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`code\` = VALUES(\`code\`);`);
  });
  lines.push('');

  // --- Seed solar_stock_movements ---
  const stockMovements = storageService.getStockMovements();
  lines.push(`-- Pushing ${stockMovements.length} records into solar_stock_movements`);
  stockMovements.forEach(sm => {
    lines.push(`INSERT INTO \`solar_stock_movements\` (\`id\`, \`product_id\`, \`product_name\`, \`sku\`, \`movement_type\`, \`quantity\`, \`balance_after\`, \`reference_number\`, \`warehouse_id\`, \`notes\`, \`timestamp\`, \`performed_by\`)
VALUES (${escapeSql(sm.id)}, ${escapeSql(sm.productId)}, ${escapeSql(sm.productName)}, ${escapeSql(sm.sku || '')}, ${escapeSql(sm.movementType)}, ${Number(sm.quantity) || 0}, ${Number(sm.balanceAfter) || 0}, ${escapeSql(sm.referenceNumber || '')}, ${escapeSql(sm.warehouseId || '')}, ${escapeSql(sm.notes || '')}, ${escapeSql(sm.timestamp)}, ${escapeSql(sm.performedBy || '')})
ON DUPLICATE KEY UPDATE \`balance_after\` = VALUES(\`balance_after\`);`);
  });
  lines.push('');

  // --- Seed solar_stock_audits ---
  const stockAudits = storageService.getStockAudits();
  lines.push(`-- Pushing ${stockAudits.length} records into solar_stock_audits`);
  stockAudits.forEach(sa => {
    lines.push(`INSERT INTO \`solar_stock_audits\` (\`id\`, \`audit_number\`, \`warehouse_id\`, \`warehouse_name\`, \`audit_date\`, \`auditor_name\`, \`status\`, \`discrepancies_count\`, \`items_json\`, \`notes\`)
VALUES (${escapeSql(sa.id)}, ${escapeSql(sa.auditNumber || sa.id)}, ${escapeSql(sa.warehouseId)}, ${escapeSql(sa.warehouseName)}, ${escapeSql(sa.auditDate)}, ${escapeSql(sa.auditorName)}, ${escapeSql(sa.status || 'COMPLETED')}, ${Number(sa.discrepanciesCount) || 0}, ${escapeSql(sa.items || [])}, ${escapeSql(sa.notes || '')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`);
  });
  lines.push('');

  // --- Seed solar_quotations ---
  const quotations = storageService.getQuotations();
  lines.push(`-- Pushing ${quotations.length} records into solar_quotations`);
  quotations.forEach(q => {
    lines.push(`INSERT INTO \`solar_quotations\` (\`id\`, \`quotation_number\`, \`customer_id\`, \`customer_name\`, \`project_id\`, \`capacity_kw\`, \`rate_per_wp\`, \`base_amount\`, \`tax_amount\`, \`panel_brand\`, \`inverter_brand\`, \`structure_type\`, \`items_json\`, \`subtotal\`, \`discount_amount\`, \`gst_percent\`, \`gst_amount\`, \`total_amount\`, \`status\`, \`valid_until\`)
VALUES (${escapeSql(q.id)}, ${escapeSql(q.quotationNumber || q.id)}, ${escapeSql(q.customerId || '')}, ${escapeSql(q.customerName)}, ${escapeSql(q.projectId || '')}, ${Number(q.capacityKw) || 0}, ${Number(q.ratePerWp) || 0}, ${Number(q.baseAmount) || 0}, ${Number(q.taxAmount) || 0}, ${escapeSql(q.panelBrand || '')}, ${escapeSql(q.inverterBrand || '')}, ${escapeSql(q.structureType || '')}, ${escapeSql(q.items || [])}, ${Number(q.subtotal) || 0}, ${Number(q.discountAmount) || 0}, ${Number(q.gstPercent) || 13.8}, ${Number(q.gstAmount) || 0}, ${Number(q.totalAmount) || 0}, ${escapeSql(q.status || 'DRAFT')}, ${q.validUntil ? escapeSql(q.validUntil.split('T')[0]) : 'NULL'})
ON DUPLICATE KEY UPDATE \`total_amount\` = VALUES(\`total_amount\`);`);
  });
  lines.push('');

  // --- Seed solar_site_surveys ---
  const surveys = storageService.getSurveys();
  lines.push(`-- Pushing ${surveys.length} records into solar_site_surveys`);
  surveys.forEach(sur => {
    lines.push(`INSERT INTO \`solar_site_surveys\` (\`id\`, \`project_id\`, \`customer_id\`, \`engineer_id\`, \`engineer_name\`, \`survey_date\`, \`status\`, \`site_address\`, \`latitude\`, \`longitude\`, \`location_name\`, \`roof_type\`, \`roof_area_sqft\`, \`shadow_free_area_sqft\`, \`recommended_capacity_kw\`, \`feasibility_score\`, \`photos_json\`, \`notes\`)
VALUES (${escapeSql(sur.id)}, ${escapeSql(sur.projectId || '')}, ${escapeSql(sur.customerId || '')}, ${escapeSql(sur.engineerId || '')}, ${escapeSql(sur.engineerName)}, ${escapeSql(sur.surveyDate ? sur.surveyDate.split('T')[0] : '2026-08-01')}, ${escapeSql(sur.status || 'DRAFT')}, ${escapeSql(sur.siteAddress)}, ${sur.latitude ?? 'NULL'}, ${sur.longitude ?? 'NULL'}, ${escapeSql(sur.locationName || '')}, ${escapeSql(sur.roofType || 'RCC Flat')}, ${Number(sur.roofAreaSqft) || 0}, ${Number(sur.shadowFreeAreaSqft) || 0}, ${Number(sur.recommendedCapacityKw) || 0}, ${escapeSql(sur.feasibilityScore || 'GOOD')}, ${escapeSql(sur.photos || [])}, ${escapeSql(sur.notes || '')})
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);`);
  });
  lines.push('');

  // --- Seed solar_acl_config ---
  lines.push('-- Pushing system ACL config');
  lines.push(`INSERT INTO \`solar_acl_config\` (\`id\`, \`config_json\`)
VALUES ('master_acl_config', ${escapeSql(DEFAULT_SYSTEM_ACL_CONFIG)})
ON DUPLICATE KEY UPDATE \`config_json\` = VALUES(\`config_json\`);`);
  lines.push('');

  // --- Seed solar_system_settings ---
  const settings = storageService.getSettings();
  lines.push('-- Pushing system settings');
  lines.push(`INSERT INTO \`solar_system_settings\` (\`setting_key\`, \`setting_value\`)
VALUES ('global_settings', ${escapeSql(settings)})
ON DUPLICATE KEY UPDATE \`setting_value\` = VALUES(\`setting_value\`);`);
  lines.push('');

  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  lines.push('');
  lines.push('-- ==========================================================');
  lines.push('-- End of SolarPulse Production MySQL Dump');
  lines.push('-- ==========================================================');

  return lines.join('\n');
}

// Generate files
const sql = generateFullSql();
fs.writeFileSync(path.join(process.cwd(), 'database.sql'), sql, 'utf-8');
fs.writeFileSync(path.join(process.cwd(), 'public/api/schema.sql'), sql, 'utf-8');
fs.writeFileSync(path.join(process.cwd(), 'public/api/solar_mysql_dump.sql'), sql, 'utf-8');
console.log('Successfully generated database.sql, public/api/schema.sql, and public/api/solar_mysql_dump.sql! Length:', sql.length);
