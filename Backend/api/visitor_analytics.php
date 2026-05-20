<?php
// Backend/api/visitor_analytics.php
require_once 'config.php';

$db = getDB();
$userId = $_GET['user_id'] ?? '9cc010bc-07c9-4576-98b0-c000815083ea'; // Hardcoded for testing as requested before

try {
    // 1. Active Now (Last 5 minutes)
    $stmt = $db->prepare("SELECT COUNT(DISTINCT ip_address) FROM logs WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
    $stmt->execute([$userId]);
    $activeNow = $stmt->fetchColumn();

    // 2. Total Visitors
    $stmt = $db->prepare("SELECT COUNT(DISTINCT ip_address) FROM logs WHERE user_id = ?");
    $stmt->execute([$userId]);
    $totalVisitors = $stmt->fetchColumn();

    // 3. Top Pages
    $stmt = $db->prepare("SELECT url as page, COUNT(*) as count FROM logs WHERE user_id = ? GROUP BY url ORDER BY count DESC LIMIT 5");
    $stmt->execute([$userId]);
    $topPages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Live Visitor Stream (Last 8)
    $stmt = $db->prepare("SELECT id, ip_address, user_agent, url as current_page, created_at, is_attack FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 8");
    $stmt->execute([$userId]);
    $liveStream = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Parse User Agents for Live Stream
    foreach ($liveStream as &$visitor) {
        $ua = $visitor['user_agent'];
        $visitor['browser'] = 'Other';
        $visitor['os'] = 'Unknown';
        $visitor['device_type'] = 'desktop';
        $visitor['is_active'] = (strtotime($visitor['created_at']) >= strtotime('-5 minutes'));
        $visitor['country'] = 'Unknown';
        $visitor['pages_viewed'] = 1; // Default fallback

        // Simple Browser Detection
        if (stripos($ua, 'Edg') !== false) $visitor['browser'] = 'Edge';
        elseif (stripos($ua, 'Chrome') !== false) $visitor['browser'] = 'Chrome';
        elseif (stripos($ua, 'Safari') !== false) $visitor['browser'] = 'Safari';
        elseif (stripos($ua, 'Firefox') !== false) $visitor['browser'] = 'Firefox';
        elseif (stripos($ua, 'curl') !== false) $visitor['browser'] = 'Curl (Bot)';

        // Simple OS Detection
        if (stripos($ua, 'Windows') !== false) $visitor['os'] = 'Windows';
        elseif (stripos($ua, 'Android') !== false) $visitor['os'] = 'Android';
        elseif (stripos($ua, 'iPhone') !== false || stripos($ua, 'iPad') !== false) $visitor['os'] = 'iOS';
        elseif (stripos($ua, 'Macintosh') !== false) $visitor['os'] = 'macOS';
        elseif (stripos($ua, 'Linux') !== false) $visitor['os'] = 'Linux';

        // Device Type
        if (stripos($ua, 'Mobi') !== false) $visitor['device_type'] = 'mobile';
        elseif (stripos($ua, 'Tablet') !== false || stripos($ua, 'iPad') !== false) $visitor['device_type'] = 'tablet';
    }

    // 5. Browser & Device Distribution (Based on last 100 logs)
    $stmt = $db->prepare("SELECT user_agent FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100");
    $stmt->execute([$userId]);
    $rawLogs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $browsers = ['Chrome' => 0, 'Safari' => 0, 'Firefox' => 0, 'Edge' => 0, 'Other' => 0];
    $devices = ['desktop' => 0, 'mobile' => 0, 'tablet' => 0];

    foreach ($rawLogs as $row) {
        $ua = $row['user_agent'];
        
        // Browser
        if (stripos($ua, 'Edg') !== false) $browsers['Edge']++;
        elseif (stripos($ua, 'Chrome') !== false) $browsers['Chrome']++;
        elseif (stripos($ua, 'Safari') !== false) $browsers['Safari']++;
        elseif (stripos($ua, 'Firefox') !== false) $browsers['Firefox']++;
        else $browsers['Other']++;
        
        // Device
        if (stripos($ua, 'Mobi') !== false) $devices['mobile']++;
        elseif (stripos($ua, 'Tablet') !== false || stripos($ua, 'iPad') !== false) $devices['tablet']++;
        else $devices['desktop']++;
    }

    $browserData = [];
    foreach ($browsers as $name => $value) {
        if ($value > 0) $browserData[] = ['name' => $name, 'value' => $value];
    }

    // 6. Traffic Trends (Last 14 days)
    $stmt = $db->prepare("
        SELECT DATE(created_at) as date, COUNT(*) as pageviews, COUNT(DISTINCT ip_address) as visitors 
        FROM logs 
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    ");
    $stmt->execute([$userId]);
    $trafficRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $trafficData = [];
    foreach ($trafficRaw as $row) {
        $trafficData[] = [
            'date' => date('M d', strtotime($row['date'])),
            'visitors' => (int)$row['visitors'],
            'pageviews' => (int)$row['pageviews']
        ];
    }

    // 7. Hourly Traffic (Today)
    $stmt = $db->prepare("
        SELECT HOUR(created_at) as hour, COUNT(DISTINCT ip_address) as visitors 
        FROM logs 
        WHERE user_id = ? AND DATE(created_at) = CURDATE() 
        GROUP BY HOUR(created_at)
        ORDER BY hour ASC
    ");
    $stmt->execute([$userId]);
    $hourlyRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $hourlyData = array_fill(0, 24, 0);
    foreach ($hourlyRaw as $row) {
        $hourlyData[(int)$row['hour']] = (int)$row['visitors'];
    }

    $formattedHourlyData = [];
    foreach ($hourlyData as $hour => $visitors) {
        $formattedHourlyData[] = [
            'hour' => sprintf('%02d:00', $hour),
            'visitors' => $visitors
        ];
    }

    sendResponse([
        'active_now' => (int)$activeNow,
        'total_visitors' => (int)$totalVisitors,
        'top_pages' => $topPages,
        'live_stream' => $liveStream,
        'browser_data' => $browserData,
        'device_data' => $devices,
        'traffic_data' => $trafficData,
        'hourly_data' => $formattedHourlyData
    ]);

} catch (PDOException $e) {
    sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
