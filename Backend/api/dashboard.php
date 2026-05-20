<?php
// Backend/api/dashboard.php
require_once 'config.php';

$db = getDB();
$userId = $_GET['user_id'] ?? '';

if (!$userId) {
    sendResponse(['error' => 'User ID is required'], 400);
}

try {
    // 0. Log Rotation: Auto-delete logs older than 30 days to keep database healthy
    $db->query("DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");

    // 1. Total Requests
    $stmt = $db->prepare("SELECT COUNT(*) FROM logs WHERE user_id = ?");
    $stmt->execute([$userId]);
    $totalRequests = $stmt->fetchColumn();

    // 2. Total Attacks
    $stmt = $db->prepare("SELECT COUNT(*) FROM logs WHERE user_id = ? AND is_attack = 1");
    $stmt->execute([$userId]);
    $totalAttacks = $stmt->fetchColumn();

    // 3. Blocked IPs (Active blocks in firewall)
    $stmt = $db->prepare("SELECT COUNT(*) FROM blocked_ips WHERE unblock_at > NOW()");
    $stmt->execute();
    $blockedRequests = $stmt->fetchColumn();

    // 4. Critical Alerts
    $stmt = $db->prepare("SELECT COUNT(*) FROM alerts WHERE user_id = ? AND severity = 'critical' AND status = 'open'");
    $stmt->execute([$userId]);
    $criticalAlerts = $stmt->fetchColumn();

    // 4b. Active Visitors (Unique IPs in last 5 minutes)
    $stmt = $db->prepare("SELECT COUNT(DISTINCT ip_address) FROM logs WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
    $stmt->execute([$userId]);
    $activeVisitors = $stmt->fetchColumn();

    // 4c. Total Websites Monitored
    $stmt = $db->prepare("SELECT COUNT(*) FROM websites WHERE user_id = ?");
    $stmt->execute([$userId]);
    $totalWebsites = $stmt->fetchColumn();

    // 5. Pie Data (Attack Distribution from Alerts)
    $stmt = $db->prepare("SELECT attack_type as name, COUNT(*) as value FROM alerts WHERE user_id = ? GROUP BY attack_type");
    $stmt->execute([$userId]);
    $pieData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5b. Severity Counts
    $stmt = $db->prepare("SELECT severity, COUNT(*) as count FROM alerts WHERE user_id = ? GROUP BY severity");
    $stmt->execute([$userId]);
    $sevData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $severityCounts = [];
    foreach ($sevData as $row) {
        $severityCounts[$row['severity']] = (int)$row['count'];
    }

    // 6. Chart Data (Last 7 days)
    $stmt = $db->prepare("
        SELECT DATE(created_at) as date, COUNT(*) as requests, SUM(is_attack) as attacks 
        FROM logs 
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $stmt->execute([$userId]);
    $chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 7. Recent Attacks Feed
    $stmt = $db->prepare("SELECT * FROM logs WHERE user_id = ? AND is_attack = 1 ORDER BY created_at DESC LIMIT 8");
    $stmt->execute([$userId]);
    $recentAttacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 8. Recent Alerts Feed
    $stmt = $db->prepare("SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 4");
    $stmt->execute([$userId]);
    $recentAlerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse([
        'total_requests' => (int)$totalRequests,
        'total_attacks' => (int)$totalAttacks,
        'blocked_requests' => (int)$blockedRequests,
        'critical_alerts' => (int)$criticalAlerts,
        'active_visitors' => (int)$activeVisitors,
        'total_websites' => (int)$totalWebsites,
        'pie_data' => $pieData,
        'chart_data' => $chartData,
        'recent_attacks' => $recentAttacks,
        'recent_alerts' => $recentAlerts,
        'severity_counts' => $severityCounts
    ]);

} catch (PDOException $e) {
    sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
