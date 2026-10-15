<?php
/**
 * Hostinger Shared Hosting MySQL Status & DB Connectivity Check
 * SolarPulse EPC ERP & CRM
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: '';
$dbUser = getenv('DB_USER') ?: '';
$dbPass = getenv('DB_PASS') ?: '';

// Search in .env files if not found in environment
if (!$dbName) {
    $searchPaths = [
        __DIR__ . '/../../.env',
        __DIR__ . '/../.env',
        dirname(__DIR__, 2) . '/.env'
    ];
    foreach ($searchPaths as $path) {
        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (preg_match('/^\s*DB_HOST\s*=\s*(.+)$/', $line, $m)) $dbHost = trim($m[1], "\"' \r\n");
                if (preg_match('/^\s*DB_NAME\s*=\s*(.+)$/', $line, $m)) $dbName = trim($m[1], "\"' \r\n");
                if (preg_match('/^\s*DB_USER\s*=\s*(.+)$/', $line, $m)) $dbUser = trim($m[1], "\"' \r\n");
                if (preg_match('/^\s*DB_PASS\s*=\s*(.+)$/', $line, $m)) $dbPass = trim($m[1], "\"' \r\n");
            }
            if ($dbName) break;
        }
    }
}

if (!$dbName) {
    echo json_encode([
        'status' => 'STANDBY',
        'message' => 'The ERP is operating in high-performance local persistence mode with complete JSON backup/restore tools.',
        'database_configured' => false
    ]);
    exit;
}

try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ]);

    echo json_encode([
        'status' => 'CONNECTED',
        'database' => $dbName,
        'host' => $dbHost,
        'message' => 'Hostinger MySQL database connection successful.'
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'ERROR',
        'error' => $e->getMessage(),
        'message' => 'Could not connect to Hostinger MySQL with provided credentials.'
    ]);
}
