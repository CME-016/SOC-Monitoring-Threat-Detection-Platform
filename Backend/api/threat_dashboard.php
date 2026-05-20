<?php
// Backend/api/threat_dashboard.php
require_once 'config.php';

$db = getDB();
// $userId = $_GET['user_id'] ?? '';
$userId = '9cc010bc-07c9-4576-98b0-c000815083ea';

if (!$userId) {
    sendResponse(['error' => 'User ID is required'], 400);
}

try {
    // 1. Critical and High Threat Counts
    $stmt = $db->prepare("SELECT COUNT(*) FROM alerts WHERE user_id = ? AND severity = 'critical' AND status = 'open'");
    $stmt->execute([$userId]);
    $criticalCount = $stmt->fetchColumn();

    $stmt = $db->prepare("SELECT COUNT(*) FROM alerts WHERE user_id = ? AND severity = 'high' AND status = 'open'");
    $stmt->execute([$userId]);
    $highCount = $stmt->fetchColumn();

    // 2. IPs Blocked (Active)
    $stmt = $db->prepare("SELECT COUNT(*) FROM blocked_ips WHERE unblock_at > NOW()");
    $stmt->execute();
    $blockedCount = $stmt->fetchColumn();

    // 3. Top Attacking IPs
    $stmt = $db->prepare("
        SELECT ip_address, COUNT(*) as count, MAX(attack_type) as attack_type 
        FROM logs 
        WHERE user_id = ? AND is_attack = 1 
        GROUP BY ip_address 
        ORDER BY count DESC 
        LIMIT 8
    ");
    $stmt->execute([$userId]);
    $topIPsRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate severity in PHP since it's not in the logs table
    $topIPs = [];
    foreach ($topIPsRaw as $row) {
        $type = $row['attack_type'];
        $severity = ($type === 'SQL Injection') ? 'critical' : 'high';
        
        $topIPs[] = [
            'ip' => $row['ip_address'],
            'count' => (int)$row['count'],
            'attack_type' => $type,
            'severity' => $severity,
            'country' => 'Unknown' // We don't have country in logs
        ];
    }

    // 4. Radar Chart Data (Attack Distribution)
    $stmt = $db->prepare("SELECT attack_type as name, COUNT(*) as value FROM alerts WHERE user_id = ? GROUP BY attack_type");
    $stmt->execute([$userId]);
    $radarData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Timeline Data (Last 7 days)
    // Fetch raw data
    $stmt = $db->prepare("
        SELECT DATE(created_at) as date, attack_type, COUNT(*) as count 
        FROM logs 
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_attack = 1
        GROUP BY DATE(created_at), attack_type
        ORDER BY date ASC
    ");
    $stmt->execute([$userId]);
    $timelineRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format for Recharts (Pivot table)
    $timelineData = [];
    $days = [];
    
    // Initialize last 7 days
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $days[$date] = [
            'date' => date('M d', strtotime($date)),
            'sql' => 0,
            'xss' => 0,
            'brute' => 0,
            'ddos' => 0,
            'bot' => 0
        ];
    }

    foreach ($timelineRaw as $row) {
        $date = $row['date'];
        if (isset($days[$date])) {
            $type = $row['attack_type'];
            $count = (int)$row['count'];
            
            if (stripos($type, 'SQL') !== false) $days[$date]['sql'] += $count;
            elseif (stripos($type, 'XSS') !== false) $days[$date]['xss'] += $count;
            elseif (stripos($type, 'Brute') !== false) $days[$date]['brute'] += $count;
            elseif (stripos($type, 'DDoS') !== false) $days[$date]['ddos'] += $count;
            elseif (stripos($type, 'Bot') !== false) $days[$date]['bot'] += $count;
        }
    }

    // 6. Recent Attack Details
    $stmt = $db->prepare("SELECT * FROM logs WHERE user_id = ? AND is_attack = 1 ORDER BY created_at DESC LIMIT 5");
    $stmt->execute([$userId]);
    $recentAttacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse([
        'critical_count' => (int)$criticalCount,
        'high_count' => (int)$highCount,
        'blocked_count' => (int)$blockedCount,
        'top_ips' => $topIPs,
        'radar_data' => $radarData,
        'timeline_data' => array_values($days),
        'recent_attacks' => $recentAttacks
    ]);

} catch (PDOException $e) {
    sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
