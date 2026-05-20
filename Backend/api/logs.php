<?php
require_once 'config.php';

$db = getDB();
$userId = $_GET['user_id'] ?? '';

if (!$userId) {
    sendResponse(['error' => 'User ID is required'], 400);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 1. Fetch the latest 100 logs
    $stmt = $db->prepare("SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100");
    $stmt->execute([$userId]);
    $logs = $stmt->fetchAll();
    
    // 2. Fetch the grand total count of all logs
    $stmt_count = $db->prepare("SELECT COUNT(*) FROM logs WHERE user_id = ?");
    $stmt_count->execute([$userId]);
    $total = $stmt_count->fetchColumn();
    
    sendResponse([
        'logs' => $logs,
        'total' => $total
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJSONInput();
    $id = generateUUID();
    
    $stmt = $db->prepare("INSERT INTO logs (
        id, user_id, website_id, log_type, ip_address, method, url, 
        status_code, response_size, user_agent, is_attack, attack_type, 
        threat_score, raw_log
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    try {
        $stmt->execute([
            $id,
            $userId,
            $input['website_id'] ?? null,
            $input['log_type'] ?? 'apache',
            $input['ip_address'] ?? null,
            $input['method'] ?? 'GET',
            $input['url'] ?? '',
            $input['status_code'] ?? 200,
            $input['response_size'] ?? 0,
            $input['user_agent'] ?? '',
            $input['is_attack'] ?? 0,
            $input['attack_type'] ?? '',
            $input['threat_score'] ?? 0,
            $input['raw_log'] ?? ''
        ]);
        sendResponse(['id' => $id, 'message' => 'Log created']);
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// 3. DELETE: Delete a specific log
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $log_id = $_GET['id'] ?? '';
    
    if (!$log_id) {
        sendResponse(['error' => 'Log ID is required'], 400);
    }
    
    try {
        $stmt = $db->prepare("DELETE FROM logs WHERE id = ? AND user_id = ?");
        $stmt->execute([$log_id, $userId]);
        
        sendResponse(['message' => 'Log deleted successfully']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>
