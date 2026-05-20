<?php
require_once 'config.php';
require_once 'utils.php';

$db = getDB();
$userId = $_GET['user_id'] ?? '';

if (!$userId) {
    die("Error: Please provide a user_id via URL (e.g. seed_data.php?user_id=YOUR_ID)");
}

$logs = [
    [
        'type' => 'apache',
        'ip' => '192.168.1.105',
        'method' => 'GET',
        'url' => '/index.php',
        'status' => 200,
        'size' => 4500,
        'is_attack' => 0,
        'attack_type' => '',
        'score' => 0
    ],
    [
        'type' => 'firewall',
        'ip' => '45.12.33.19',
        'method' => 'POST',
        'url' => '/login.php',
        'status' => 403,
        'size' => 120,
        'is_attack' => 1,
        'attack_type' => 'SQL Injection',
        'score' => 85
    ],
    [
        'type' => 'php',
        'ip' => '127.0.0.1',
        'method' => 'GET',
        'url' => '/api/auth.php',
        'status' => 200,
        'size' => 850,
        'is_attack' => 0,
        'attack_type' => '',
        'score' => 0
    ],
    [
        'type' => 'nginx',
        'ip' => '104.22.5.1',
        'method' => 'GET',
        'url' => '/wp-admin/config.php',
        'status' => 404,
        'size' => 240,
        'is_attack' => 1,
        'attack_type' => 'Directory Traversal',
        'score' => 95
    ]
];

foreach ($logs as $log) {
    $id = generateUUID();
    $stmt = $db->prepare("INSERT INTO logs (
        id, user_id, log_type, ip_address, method, url, 
        status_code, response_size, is_attack, attack_type, 
        threat_score, raw_log
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $rawLog = "[".date('Y-m-d H:i:s')."] {$log['method']} {$log['url']} HTTP/1.1 {$log['status']} {$log['size']}";
    
    $stmt->execute([
        $id, $userId, $log['type'], $log['ip'], $log['method'], $log['url'],
        $log['status'], $log['size'], $log['is_attack'], $log['attack_type'],
        $log['score'], $rawLog
    ]);
}

echo "Successfully seeded " . count($logs) . " logs for user: $userId";
