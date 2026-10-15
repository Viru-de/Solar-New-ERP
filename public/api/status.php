<?php
/**
 * Hostinger Shared Hosting Health & Environment Status Check
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

$envFile = __DIR__ . '/../../.env';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/../.env';
}
if (!file_exists($envFile)) {
    $envFile = dirname(__DIR__, 2) . '/.env';
}

$geminiConfigured = !empty(getenv('GEMINI_API_KEY'));
if (!$geminiConfigured && file_exists($envFile)) {
    $envContent = file_get_contents($envFile);
    if (preg_match('/^\s*GEMINI_API_KEY\s*=\s*(.+)$/m', $envContent, $matches)) {
        $key = trim($matches[1], "\"' \r\n");
        $geminiConfigured = !empty($key);
    }
}

echo json_encode([
    'status' => 'ONLINE',
    'app' => 'SolarPulse EPC ERP & CRM',
    'version' => '1.0.0',
    'server_type' => $_SERVER['SERVER_SOFTWARE'] ?? 'Hostinger Web Server',
    'php_version' => PHP_VERSION,
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
    'features' => [
        'apache_spa_routing' => true,
        'gemini_proxy' => $geminiConfigured,
        'mysql_pdo_supported' => extension_loaded('pdo_mysql')
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
