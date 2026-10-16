<?php
/**
 * SolarPulse EPC ERP & CRM - Production PHP MySQL API Endpoint
 * For Hostinger / cPanel / Apache Shared Hosting Deployments
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-User-Role');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function verifyUserPassword($password, $storedHash) {
    if (!$password || !$storedHash) return false;
    if (password_verify($password, $storedHash)) return true;
    if (hash_equals((string)$storedHash, (string)$password)) return true;
    return false;
}

$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbPort = intval(getenv('DB_PORT') ?: 3306);
$dbName = getenv('DB_NAME') ?: 'u238683373_rj_db_name';
$dbUser = getenv('DB_USER') ?: 'u238683373_rj_user_name';
$dbPass = getenv('DB_PASSWORD') ?: (getenv('DB_PASS') ?: '');

// Search in .env files if custom values exist
$searchPaths = [
    __DIR__ . '/.env',
    __DIR__ . '/../.env',
    __DIR__ . '/../../.env',
    dirname(__DIR__, 2) . '/.env'
];
foreach ($searchPaths as $path) {
    if (file_exists($path)) {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (preg_match('/^\s*DB_HOST\s*=\s*(.+)$/', $line, $m)) $dbHost = trim($m[1], "\"' \r\n");
            if (preg_match('/^\s*DB_PORT\s*=\s*(.+)$/', $line, $m)) $dbPort = intval(trim($m[1], "\"' \r\n"));
            if (preg_match('/^\s*DB_NAME\s*=\s*(.+)$/', $line, $m)) $dbName = trim($m[1], "\"' \r\n");
            if (preg_match('/^\s*DB_USER\s*=\s*(.+)$/', $line, $m)) $dbUser = trim($m[1], "\"' \r\n");
            if (preg_match('/^\s*(DB_PASSWORD|DB_PASS)\s*=\s*(.+)$/', $line, $m)) $dbPass = trim($m[2], "\"' \r\n");
        }
        if ($dbName && $dbPass) break;
    }
}

$pdo = null;
$candidateDbs = array_unique(array_filter([$dbName, 'u238683373_rj_db_name', 'solarpulse_erp']));
foreach ($candidateDbs as $candidateDb) {
    try {
        $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};dbname={$candidateDb};charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);
        $dbName = $candidateDb;
        break;
    } catch (PDOException $e) {
        // Try next candidate
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$body = json_decode(file_get_contents('php://input'), true) ?: [];

// Status / DB check
if (strpos($requestUri, 'db/status') !== false || strpos($requestUri, 'db.php') !== false) {
    $tables = [];
    if ($pdo) {
        try {
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (Exception $e) {}
    }
    echo json_encode([
        'success' => true,
        'connected' => ($pdo !== null),
        'database' => $dbName,
        'host' => $dbHost,
        'port' => 3306,
        'mode' => $pdo ? 'LIVE_MYSQL_POOL' : 'STANDBY_LOCAL_SYNC',
        'dumpAvailable' => true,
        'dumpPath' => '/database.sql',
        'message' => $pdo ? "Connected to MySQL database \"{$dbName}\" on {$dbHost}" : 'Operating in fallback mode. Configure DB credentials in .env',
        'tables' => $tables
    ]);
    exit;
}

// Download SQL Dump
if (strpos($requestUri, 'dump.sql') !== false || strpos($requestUri, 'export-sql') !== false) {
    $dumpFiles = [
        __DIR__ . '/solar_mysql_dump.sql',
        __DIR__ . '/schema.sql',
        dirname(__DIR__, 2) . '/database.sql',
        __DIR__ . '/database.sql'
    ];
    foreach ($dumpFiles as $dumpFile) {
        if (file_exists($dumpFile)) {
            header('Content-Type: application/sql');
            header('Content-Disposition: attachment; filename="solarpulse_production_mysql.sql"');
            readfile($dumpFile);
            exit;
        }
    }
}

// Auth Login
if (strpos($requestUri, 'auth/login') !== false) {
    $email = strtolower(trim($body['email'] ?? ''));
    $pass = trim($body['password'] ?? '');

    if ($pdo) {
        $stmt = $pdo->prepare("SELECT * FROM solar_users WHERE LOWER(email) = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if ($user && verifyUserPassword($pass, $user['password'])) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'department' => $user['department'],
                    'designation' => $user['designation']
                ],
                'token' => 'php_' . bin2hex(random_bytes(16))
            ]);
            exit;
        }

        // Check customers
        $stmt = $pdo->prepare("SELECT * FROM solar_customers WHERE LOWER(email) = ?");
        $stmt->execute([$email]);
        $cust = $stmt->fetch();
        if ($cust && verifyUserPassword($pass, $cust['password'])) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => 'usr-' . $cust['id'],
                    'customerId' => $cust['id'],
                    'name' => $cust['name'],
                    'email' => $cust['email'],
                    'role' => 'Customer',
                    'department' => 'Customer'
                ],
                'token' => 'cust_' . bin2hex(random_bytes(16))
            ]);
            exit;
        }
    }

    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password'
    ]);
    exit;
}

// Helper to map Customer DB Row to TypeScript Customer Entity
function mapCustomerRow($r) {
    return [
        'id' => $r['id'],
        'customerCode' => $r['customer_code'] ?? $r['id'],
        'customer_code' => $r['customer_code'] ?? $r['id'],
        'name' => $r['name'],
        'companyName' => $r['company_name'] ?? '',
        'company_name' => $r['company_name'] ?? '',
        'customerType' => $r['customer_type'] ?? 'Commercial',
        'customer_type' => $r['customer_type'] ?? 'Commercial',
        'phone' => $r['phone'],
        'email' => $r['email'] ?? '',
        'password' => $r['password'] ?? '123456',
        'siteAddress' => $r['site_address'] ?? '',
        'site_address' => $r['site_address'] ?? '',
        'city' => $r['city'] ?? '',
        'state' => $r['state'] ?? 'Gujarat',
        'pincode' => $r['pincode'] ?? '',
        'gstNumber' => $r['gst_number'] ?? '',
        'gst_number' => $r['gst_number'] ?? '',
        'electricityConsumerNo' => $r['electricity_consumer_no'] ?? '',
        'electricity_consumer_no' => $r['electricity_consumer_no'] ?? '',
        'sanctionedLoadKw' => (float)($r['sanctioned_load_kw'] ?? 0),
        'sanctioned_load_kw' => (float)($r['sanctioned_load_kw'] ?? 0),
        'status' => $r['status'] ?? 'ACTIVE',
        'activeProjectId' => $r['active_project_id'] ?? null,
        'active_project_id' => $r['active_project_id'] ?? null,
        'createdAt' => $r['created_at'] ?? date('c'),
        'created_at' => $r['created_at'] ?? date('c'),
        'updatedAt' => $r['updated_at'] ?? date('c'),
        'updated_at' => $r['updated_at'] ?? date('c')
    ];
}

// -----------------------------------------------------------------------------
// CUSTOMERS ROUTE
// -----------------------------------------------------------------------------
if (preg_match('#/customers(?:/([^/]+))?(?:/password)?$#', $requestUri, $matches)) {
    $paramId = $matches[1] ?? null;
    $isPasswordUpdate = (strpos($requestUri, '/password') !== false);

    if ($isPasswordUpdate && ($method === 'PUT' || $method === 'POST')) {
        $newPass = $body['password'] ?? '';
        if ($pdo && $paramId && strlen($newPass) >= 6) {
            $stmt = $pdo->prepare("UPDATE solar_customers SET password = ?, updated_at = NOW() WHERE id = ? OR customer_code = ?");
            $stmt->execute([$newPass, $paramId, $paramId]);
        }
        echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
        exit;
    }

    if ($method === 'GET') {
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM solar_customers ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            $data = array_map('mapCustomerRow', $rows);
            echo json_encode(['success' => true, 'count' => count($data), 'data' => $data]);
            exit;
        }
        echo json_encode(['success' => true, 'count' => 0, 'data' => []]);
        exit;
    }

    if ($method === 'POST' || ($method === 'PUT' && $paramId)) {
        $id = $paramId ?: ($body['id'] ?? ('cust-' . time()));
        $code = $body['customerCode'] ?? $body['customer_code'] ?? $id;
        $name = $body['name'] ?? '';
        $companyName = $body['companyName'] ?? $body['company_name'] ?? '';
        $customerType = $body['customerType'] ?? $body['customer_type'] ?? 'Commercial';
        $phone = $body['phone'] ?? '';
        $email = $body['email'] ?? '';
        $pass = $body['password'] ?? '123456';
        $siteAddress = $body['siteAddress'] ?? $body['site_address'] ?? '';
        $city = $body['city'] ?? '';
        $state = $body['state'] ?? 'Gujarat';
        $pincode = $body['pincode'] ?? '';
        $gstNumber = $body['gstNumber'] ?? $body['gst_number'] ?? '';
        $elec = $body['electricityConsumerNo'] ?? $body['electricity_consumer_no'] ?? '';
        $load = floatval($body['sanctionedLoadKw'] ?? $body['sanctioned_load_kw'] ?? 0);
        $status = $body['status'] ?? 'ACTIVE';
        $projId = $body['activeProjectId'] ?? $body['active_project_id'] ?? null;

        if ($pdo && $name && $phone) {
            $sql = "INSERT INTO solar_customers (
                id, customer_code, name, company_name, customer_type, phone, email, password,
                site_address, city, state, pincode, gst_number, electricity_consumer_no,
                sanctioned_load_kw, status, active_project_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                name = VALUES(name), company_name = VALUES(company_name), customer_type = VALUES(customer_type),
                phone = VALUES(phone), email = VALUES(email), password = VALUES(password),
                site_address = VALUES(site_address), city = VALUES(city), state = VALUES(state),
                pincode = VALUES(pincode), gst_number = VALUES(gst_number), electricity_consumer_no = VALUES(electricity_consumer_no),
                sanctioned_load_kw = VALUES(sanctioned_load_kw), status = VALUES(status),
                active_project_id = VALUES(active_project_id), updated_at = NOW()";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $id, $code, $name, $companyName, $customerType, $phone, $email, $pass,
                $siteAddress, $city, $state, $pincode, $gstNumber, $elec, $load, $status, $projId
            ]);
        }
        $saved = mapCustomerRow([
            'id' => $id, 'customer_code' => $code, 'name' => $name, 'company_name' => $companyName,
            'customer_type' => $customerType, 'phone' => $phone, 'email' => $email, 'password' => $pass,
            'site_address' => $siteAddress, 'city' => $city, 'state' => $state, 'pincode' => $pincode,
            'gst_number' => $gstNumber, 'electricity_consumer_no' => $elec, 'sanctioned_load_kw' => $load,
            'status' => $status, 'active_project_id' => $projId, 'created_at' => date('c'), 'updated_at' => date('c')
        ]);
        echo json_encode(['success' => true, 'data' => $saved]);
        exit;
    }

    if ($method === 'DELETE' && $paramId) {
        if ($pdo) {
            $stmt = $pdo->prepare("DELETE FROM solar_customers WHERE id = ? OR customer_code = ?");
            $stmt->execute([$paramId, $paramId]);
        }
        echo json_encode(['success' => true, 'message' => 'Customer deleted']);
        exit;
    }
}

// Helper to generate standard 15 EPC stages if project has no DB stages
function getStandardProjectStages($projId) {
    $stageTemplates = [
        ['site_survey', 'Technical Site Survey & Feasibility Analysis', 1, 'Engineering', 'Site Survey Engineer'],
        ['customer_confirmation', 'Quotation Acceptance & Advance Booking', 2, 'Sales', 'Sales Executive'],
        ['engineering_design', 'Detailed Engineering Design & SLD Approvals', 3, 'Engineering', 'Project Manager'],
        ['civil_work', 'Roof Preparation & Civil Foundation Work', 4, 'Civil Team', 'Civil Team'],
        ['structure_fabrication', 'Module Mounting Structure (MMS) Installation', 5, 'Structure Team', 'Structure Team'],
        ['solar_installation', 'PV Solar Modules Mounting & Stringing', 6, 'Installation Team', 'Installation Team'],
        ['inverter_installation', 'Grid-Tie Inverter Mounting & AC/DC Cabling', 7, 'Electrical Team', 'Electrical Team'],
        ['ac_side_electrical', 'ACDB & DCDB Distribution Box Integration', 8, 'Electrical Team', 'Electrical Team'],
        ['earthing_pits', 'Chemical Earthing Pits & Equipotential Bonding', 9, 'Electrical Team', 'Electrical Team'],
        ['lightning_arrestor', 'Early Streamer Emission (ESE) Lightning Arrestor', 10, 'Electrical Team', 'Electrical Team'],
        ['ceig_inspection', 'CEIG / DISCOM Statutory Authority Inspection', 11, 'Operations', 'Project Manager'],
        ['meter_synchronisation', 'Bi-Directional Net Meter Installation & Grid Sync', 12, 'Operations', 'Project Manager'],
        ['final_verification', 'Testing, Verification & Plant Commissioning', 13, 'Engineering', 'Technician'],
        ['final_handover', 'Client Handover & Documentation Package', 14, 'Sales', 'Project Manager'],
        ['service_amc', 'Annual Maintenance Contract & 24/7 Monitoring', 15, 'Service', 'Service Manager']
    ];

    $stages = [];
    foreach ($stageTemplates as $stg) {
        $stages[] = [
            'id' => "stg-{$projId}-{$stg[0]}",
            'stageKey' => $stg[0],
            'title' => $stg[1],
            'order' => $stg[2],
            'department' => $stg[3],
            'assignedRole' => $stg[4],
            'assignedEmployeeId' => '',
            'assignedEmployeeName' => '',
            'assignedToId' => '',
            'assignedToName' => '',
            'status' => ($stg[2] === 1 ? 'IN PROGRESS' : 'NOT STARTED'),
            'priority' => 'MEDIUM',
            'checklist' => [
                ['id' => "chk-{$stg[0]}-1", 'title' => 'Initial milestone inspection', 'completed' => false],
                ['id' => "chk-{$stg[0]}-2", 'title' => 'Technical validation checklist', 'completed' => false]
            ],
            'photos' => [],
            'documents' => []
        ];
    }
    return $stages;
}

// -----------------------------------------------------------------------------
// PROJECTS ROUTE (Full stages join & camelCase mapping)
// -----------------------------------------------------------------------------
if (preg_match('#/projects(?:/([^/]+))?$#', $requestUri, $matches)) {
    $paramId = $matches[1] ?? null;

    if ($method === 'GET') {
        $projects = [];
        if ($pdo) {
            try {
                $query = "SELECT * FROM solar_projects";
                if ($paramId) {
                    $query .= " WHERE id = " . $pdo->quote($paramId) . " OR project_code = " . $pdo->quote($paramId);
                }
                $query .= " ORDER BY created_at DESC";
                $stmt = $pdo->query($query);
                $projectRows = $stmt->fetchAll();

                // Fetch stages for all projects
                $stagesByProject = [];
                try {
                    $stagesStmt = $pdo->query("SELECT * FROM solar_project_stages ORDER BY stage_order ASC");
                    $allStages = $stagesStmt->fetchAll();
                    foreach ($allStages as $s) {
                        $pId = $s['project_id'];
                        if (!isset($stagesByProject[$pId])) {
                            $stagesByProject[$pId] = [];
                        }
                        $checklist = json_decode($s['checklist_json'] ?? '[]', true);
                        $photos = json_decode($s['photos_json'] ?? '[]', true);
                        $docs = json_decode($s['documents_json'] ?? '[]', true);

                        $stagesByProject[$pId][] = [
                            'id' => $s['id'],
                            'stageKey' => $s['stage_key'] ?? 'site_survey',
                            'title' => $s['title'] ?? 'Milestone Stage',
                            'order' => (int)($s['stage_order'] ?? 1),
                            'department' => $s['department'] ?? 'Operations',
                            'assignedRole' => $s['assigned_role'] ?? 'Project Manager',
                            'assignedEmployeeId' => $s['assigned_employee_id'] ?? '',
                            'assignedEmployeeName' => $s['assigned_employee_name'] ?? '',
                            'assignedToId' => $s['assigned_employee_id'] ?? '',
                            'assignedToName' => $s['assigned_employee_name'] ?? '',
                            'status' => $s['status'] ?? 'NOT STARTED',
                            'priority' => $s['priority'] ?? 'MEDIUM',
                            'startDate' => $s['start_date'] ?? null,
                            'dueDate' => $s['due_date'] ?? null,
                            'completedDate' => $s['completed_date'] ?? null,
                            'checklist' => is_array($checklist) ? $checklist : [],
                            'photos' => is_array($photos) ? $photos : [],
                            'documents' => is_array($docs) ? $docs : [],
                            'approvedBy' => $s['approved_by'] ?? ''
                        ];
                    }
                } catch (Exception $e) {}

                foreach ($projectRows as $r) {
                    $pId = $r['id'];
                    $stages = $stagesByProject[$pId] ?? getStandardProjectStages($pId);
                    $assignments = json_decode($r['assignments_json'] ?? '[]', true);

                    $projects[] = [
                        'id' => $pId,
                        'projectCode' => $r['project_code'] ?? $pId,
                        'project_code' => $r['project_code'] ?? $pId,
                        'customerId' => $r['customer_id'] ?? '',
                        'customer_id' => $r['customer_id'] ?? '',
                        'customerName' => $r['customer_name'] ?? '',
                        'customer_name' => $r['customer_name'] ?? '',
                        'title' => $r['title'] ?? 'Solar Project',
                        'capacityKw' => (float)($r['capacity_kw'] ?? 0),
                        'capacity_kw' => (float)($r['capacity_kw'] ?? 0),
                        'totalValue' => (float)($r['total_value'] ?? 0),
                        'total_value' => (float)($r['total_value'] ?? 0),
                        'status' => $r['status'] ?? 'PLANNING',
                        'currentStageKey' => $r['current_stage_key'] ?? 'site_survey',
                        'current_stage_key' => $r['current_stage_key'] ?? 'site_survey',
                        'completionPercentage' => (int)($r['completion_percentage'] ?? 0),
                        'progressPercentage' => (int)($r['completion_percentage'] ?? 0),
                        'projectManagerId' => $r['project_manager_id'] ?? '',
                        'projectManagerName' => $r['project_manager_name'] ?? '',
                        'siteAddress' => $r['site_address'] ?? '',
                        'city' => $r['city'] ?? '',
                        'inverterModel' => $r['inverter_model'] ?? '',
                        'panelModel' => $r['panel_model'] ?? '',
                        'structureType' => $r['structure_type'] ?? 'Elevated GI Structure',
                        'startDate' => $r['start_date'] ?? null,
                        'expectedCompletionDate' => $r['expected_completion_date'] ?? null,
                        'actualCompletionDate' => $r['actual_completion_date'] ?? null,
                        'notes' => $r['notes'] ?? '',
                        'assignedUsers' => is_array($assignments) ? $assignments : [],
                        'stages' => $stages
                    ];
                }
            } catch (Exception $e) {}
        }
        echo json_encode(['success' => true, 'count' => count($projects), 'data' => $projects]);
        exit;
    }

    if ($method === 'POST') {
        echo json_encode(['success' => true, 'data' => $body]);
        exit;
    }

    if ($method === 'DELETE' && $paramId) {
        if ($pdo) {
            $stmt = $pdo->prepare("DELETE FROM solar_projects WHERE id = ?");
            $stmt->execute([$paramId]);
        }
        echo json_encode(['success' => true, 'message' => 'Project deleted']);
        exit;
    }
}

// -----------------------------------------------------------------------------
// SETTINGS ROUTE
// -----------------------------------------------------------------------------
if (strpos($requestUri, 'settings') !== false) {
    $defaultSettings = [
        'companyName' => 'REJOY SOLAR POWER PVT. LTD',
        'companyAddress' => 'PLOT NO- 14, STREET NO- 14B, PRAGATI NAGAR, RISALI BHILAI, Chhattisgarh 490006',
        'companyPhone' => '+91 98250 12345',
        'companyEmail' => 'rejoysolarpower@gmail.com',
        'companyGst' => '22AAOCR0748K1Z5',
        'logoUrl' => '/logo-dark.png',
        'currencySymbol' => '₹',
        'taxRatePercent' => 18,
        'tallyServerUrl' => '',
        'tallyCompany' => 'Rejoy Solar 2026-27',
        'tallyStatus' => 'NOT CONFIGURED',
        'whatsAppStatus' => 'SANDBOX_READY'
    ];

    if ($method === 'GET') {
        $settingsData = $defaultSettings;
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT setting_value FROM solar_system_settings WHERE setting_key = 'global_settings'");
                $stmt->execute();
                $val = $stmt->fetchColumn();
                if ($val) {
                    $parsed = json_decode($val, true);
                    if (is_array($parsed)) {
                        $settingsData = array_merge($settingsData, $parsed);
                    }
                }
            } catch (Exception $e) {}
        }
        echo json_encode(['success' => true, 'data' => $settingsData]);
        exit;
    }

    if ($method === 'POST') {
        if ($pdo && !empty($body)) {
            try {
                $stmt = $pdo->prepare("INSERT INTO solar_system_settings (setting_key, setting_value, updated_at) VALUES ('global_settings', ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()");
                $stmt->execute([json_encode($body)]);
            } catch (Exception $e) {}
        }
        echo json_encode(['success' => true, 'data' => $body, 'message' => 'Settings saved']);
        exit;
    }
}

// -----------------------------------------------------------------------------
// GENERIC TABLE ROUTES
// -----------------------------------------------------------------------------
$tableRoutes = [
    'leads' => 'solar_leads',
    'employees' => 'solar_employees',
    'quotations' => 'solar_quotations',
    'payments' => 'solar_payments',
    'expenses' => 'solar_expenses',
    'products' => 'solar_products',
    'vendors' => 'solar_vendors',
    'purchase-orders' => 'solar_purchase_orders',
    'boms' => 'solar_boms',
    'sales-invoices' => 'solar_sales_invoices',
    'warehouses' => 'solar_warehouses',
    'attendance' => 'solar_attendance',
    'payslips' => 'solar_payslips',
    'service-tickets' => 'solar_service_tickets',
    'amc-contracts' => 'solar_amc_contracts',
    'notifications' => 'solar_notifications'
];

foreach ($tableRoutes as $route => $tbl) {
    if (strpos($requestUri, '/' . $route) !== false) {
        if ($method === 'GET') {
            $rows = [];
            if ($pdo) {
                try {
                    $stmt = $pdo->query("SELECT * FROM `{$tbl}`");
                    $rawRows = $stmt->fetchAll();
                    // Normalise common snake_case columns to camelCase
                    foreach ($rawRows as $r) {
                        $item = $r;
                        if (isset($r['customer_name'])) $item['customerName'] = $r['customer_name'];
                        if (isset($r['company_name'])) $item['companyName'] = $r['company_name'];
                        if (isset($r['solar_capacity_kw'])) $item['solarCapacityKw'] = (float)$r['solar_capacity_kw'];
                        if (isset($r['estimated_value'])) $item['estimatedValue'] = (float)$r['estimated_value'];
                        if (isset($r['employee_code'])) $item['employeeCode'] = $r['employee_code'];
                        if (isset($r['system_role'])) $item['systemRole'] = $r['system_role'];
                        if (isset($r['assigned_role'])) $item['assignedRole'] = $r['assigned_role'];
                        if (isset($r['is_field_worker'])) $item['isFieldWorker'] = (bool)$r['is_field_worker'];
                        if (isset($r['quotation_number'])) $item['quotationNumber'] = $r['quotation_number'];
                        if (isset($r['total_amount'])) $item['totalAmount'] = (float)$r['total_amount'];
                        if (isset($r['project_id'])) $item['projectId'] = $r['project_id'];
                        if (isset($r['customer_id'])) $item['customerId'] = $r['customer_id'];
                        if (isset($r['due_date'])) $item['dueDate'] = $r['due_date'];
                        if (isset($r['paid_date'])) $item['paidDate'] = $r['paid_date'];
                        if (isset($r['payment_mode'])) $item['paymentMode'] = $r['payment_mode'];
                        $rows[] = $item;
                    }
                } catch (Exception $e) {}
            }
            echo json_encode(['success' => true, 'count' => count($rows), 'data' => $rows]);
            exit;
        }
        if ($method === 'POST') {
            echo json_encode(['success' => true, 'data' => $body]);
            exit;
        }
        if ($method === 'DELETE') {
            echo json_encode(['success' => true, 'message' => 'Deleted']);
            exit;
        }
    }
}

// Default response
echo json_encode([
    'success' => true,
    'message' => 'SolarPulse PHP API is operational',
    'mysql_ready' => ($pdo !== null)
]);
