<?php
// Backend/api/firewall.php
require_once 'config.php';

$db = getDB();
$userId = trim($_GET['user_id'] ?? '');

if (!$userId) {
    sendResponse(['error' => 'User ID is required'], 400);
}

// 1. GET: Fetch current firewall settings and status
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch settings
    $stmt = $db->prepare("SELECT max_requests, window_seconds, cooldown_seconds FROM firewall_settings WHERE user_id = ?");
    $stmt->execute([$userId]);
    $settings = $stmt->fetch();
    
    if (!$settings) {
        $settings = [
            'max_requests' => 50,
            'window_seconds' => 60,
            'cooldown_seconds' => 300
        ];
    }
    
    // Fetch top IPs sending traffic
    $stmt = $db->prepare("SELECT ip_address, COUNT(*) as total_requests, SUM(is_attack) as total_attacks 
                          FROM logs 
                          WHERE user_id = ? 
                          GROUP BY ip_address 
                          ORDER BY total_requests DESC 
                          LIMIT 5");
    $stmt->execute([$userId]);
    $top_ips = $stmt->fetchAll();
    
    // Fetch currently blocked IPs - use PHP time to avoid timezone mismatch
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare("SELECT id, ip_address, blocked_at, unblock_at 
                          FROM blocked_ips 
                          WHERE user_id = ? AND unblock_at > ? 
                          ORDER BY blocked_at DESC");
    $stmt->execute([$userId, $now]);
    $blocked_ips = $stmt->fetchAll();
    
    sendResponse([
        'settings' => $settings,
        'top_ips' => $top_ips,
        'blocked_ips' => $blocked_ips
    ]);
}

// 2. POST/PUT: Update firewall settings
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getJSONInput();
    
    // Fallback: if user_id is not in GET, check the input body
    if (!$userId && isset($input['user_id'])) {
        $userId = $input['user_id'];
    }
    
    if (!$userId) {
        sendResponse(['error' => 'User ID is required for saving'], 400);
    }

    // NEW: Manual IP Blocking from Threat Dashboard
    if (isset($input['ip_to_block'])) {
        $ip = $input['ip_to_block'];
        $id = generateUUID();
        
        try {
            // Block the IP for 1 hour
            $stmt = $db->prepare("INSERT INTO blocked_ips (id, user_id, ip_address, blocked_at, unblock_at) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR))");
            $stmt->execute([$id, $userId, $ip]);
            
            sendResponse(['message' => 'IP ' . $ip . ' blocked successfully']);
            exit; // Stop execution here!
        } catch (PDOException $e) {
            sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
            exit;
        }
    }
    
    $max_requests = $input['max_requests'] ?? 50;
    $window_seconds = $input['window_seconds'] ?? 60;
    $cooldown_seconds = $input['cooldown_seconds'] ?? 300;
    
    try {
        // Check if settings already exist
        $stmt = $db->prepare("SELECT id FROM firewall_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $stmt = $db->prepare("UPDATE firewall_settings SET max_requests = ?, window_seconds = ?, cooldown_seconds = ? WHERE user_id = ?");
            $stmt->execute([$max_requests, $window_seconds, $cooldown_seconds, $userId]);
        } else {
            $id = generateUUID();
            
            $stmt = $db->prepare("INSERT INTO firewall_settings (id, user_id, max_requests, window_seconds, cooldown_seconds) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$id, $userId, $max_requests, $window_seconds, $cooldown_seconds]);
        }
        
        sendResponse(['message' => 'Firewall settings updated successfully']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// 3. DELETE: Unblock an IP
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $ip = $_GET['ip'] ?? '';
    
    if (!$ip) {
        sendResponse(['error' => 'IP address is required'], 400);
    }
    
    try {
        // Delete the block record for this IP and user
        $stmt = $db->prepare("DELETE FROM blocked_ips WHERE ip_address = ? AND user_id = ?");
        $stmt->execute([$ip, $userId]);
        
        sendResponse(['message' => 'IP unblocked successfully']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>
