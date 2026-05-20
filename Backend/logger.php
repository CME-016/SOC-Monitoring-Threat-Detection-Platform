<?php
// logger.php - Place this on the CLIENT website

// 1. Database Configuration (Matched to your cybersoc_db)
$host = 'localhost';
$db   = 'cybersoc_db'; 
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (\PDOException $e) {
    // Fail silently if DB is not ready so the website doesn't crash
    return; 
}

// 2. Capture the visitor's data
$ip = $_SERVER['REMOTE_ADDR'];
$url = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

// NEW: Check if IP is currently blocked
$stmt_check = $pdo->prepare("SELECT unblock_at FROM blocked_ips WHERE ip_address = ? AND unblock_at > NOW() LIMIT 1");
$stmt_check->execute([$ip]);
$blocked = $stmt_check->fetch();

if ($blocked) {
    header('HTTP/1.1 429 Too Many Requests');
    echo "<div style='text-align: center; font-family: sans-serif; margin-top: 100px;'>";
    echo "<h1 style='color: #ef4444; font-size: 2.5rem; margin-bottom: 10px;'>Access Denied</h1>";
    echo "<p style='color: #64748b; font-size: 1.1rem;'>Your IP has been temporarily blocked due to excessive requests.</p>";
    echo "<p style='color: #94a3b8; font-size: 0.9rem;'>Unblock Time: " . $blocked['unblock_at'] . "</p>";
    echo "</div>";
    exit;
}

// 3. Smart Threat Detection (Robust & Decoded)
$is_attack = 0;
$attack_type = '';
$threat_score = 0;

// Combine URL, GET, POST data and User Agent and DECODE it!
$decoded_url = urldecode($url);
$get_data = json_encode($_GET);
$post_data = json_encode($_POST);
$full_payload = $decoded_url . " | GET: " . $get_data . " | POST: " . $post_data . " | UA: " . $agent;

$malicious_patterns = [
    // Detects quotes, comments, keywords and patterns like OR 1=1
    'SQL Injection' => '/(UNION\s+SELECT|SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET|DELETE\s+FROM|DROP\s+TABLE|\'|"|--|#|\bOR\s+\d+=\d+|\bAND\s+\d+=\d+)/i',
    // Detects script tags, alerts and event handlers
    'XSS' => '/(<script|alert\(|onerror=|onload=|javascript:)/i',
    'Directory Traversal' => '/(\.\.\/|\.\.\\)/i',
    // Detects common automated hacking tools and scripts
    'Bot Scanner' => '/(curl|python|postman|wget|nmap|nikto|dirbuster|sqlmap)/i'
];

foreach ($malicious_patterns as $type => $pattern) {
    if (preg_match($pattern, $full_payload)) {
        $is_attack = 1;
        $attack_type = $type;
        $threat_score = ($type === 'Bot Scanner') ? 50 : (($type === 'SQL Injection') ? 85 : 70);
        break;
    }
}

// Generate a random UUID for the log ID
$id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
    mt_rand(0, 0xffff),
    mt_rand(0, 0x0fff) | 0x4000,
    mt_rand(0, 0x3fff) | 0x8000,
    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
);

// 4. Insert directly into YOUR 'logs' table
try {
    // Hardcode the user ID you are using in React for testing
    $user_id = '9cc010bc-07c9-4576-98b0-c000815083ea';
    $website_id = null; // Set to null for testing so it bypasses the foreign key check
    
    $stmt = $pdo->prepare("INSERT INTO logs (id, user_id, website_id, log_type, ip_address, method, url, user_agent, is_attack, attack_type, threat_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $id,
        $user_id,
        $website_id,
        'php',
        $ip,
        $method,
        $url,
        $agent,
        $is_attack,
        $attack_type,
        $threat_score
    ]);

    // NEW: If it is an attack, automatically create an Alert!
    if ($is_attack === 1) {
        // Generate a new UUID for the alert ID
        $alert_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $stmt_alert = $pdo->prepare("INSERT INTO alerts (id, user_id, website_id, log_id, title, description, severity, attack_type, ip_address, url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt_alert->execute([
            $alert_id,
            $user_id,
            $website_id,
            $id, // Link this alert to the log we just created!
            "Critical Threat: " . $attack_type,
            "An unauthorized access attempt was detected originating from IP " . $ip,
            ($attack_type === 'SQL Injection') ? 'critical' : 'high',
            $attack_type,
            $ip,
            $url,
            'open'
        ]);
    }

    // NEW: Dynamic Rate Limiting & Auto-Blocking
    $stmt_settings = $pdo->prepare("SELECT max_requests, window_seconds, cooldown_seconds FROM firewall_settings WHERE user_id = ? LIMIT 1");
    $stmt_settings->execute([$user_id]);
    $settings = $stmt_settings->fetch();

    if ($settings) {
        $max_requests = $settings['max_requests'];
        $window_seconds = $settings['window_seconds'];
        $cooldown_seconds = $settings['cooldown_seconds'];

        // Count requests from this IP in the time window
        $stmt_count = $pdo->prepare("SELECT COUNT(*) FROM logs WHERE ip_address = ? AND created_at > (NOW() - INTERVAL ? SECOND)");
        $stmt_count->execute([$ip, $window_seconds]);
        $request_count = $stmt_count->fetchColumn();

        if ($request_count > $max_requests) {
            // Block the IP
            $block_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );

            $stmt_block = $pdo->prepare("INSERT INTO blocked_ips (id, user_id, ip_address, unblock_at) VALUES (?, ?, ?, NOW() + INTERVAL ? SECOND)");
            $stmt_block->execute([$block_id, $user_id, $ip, $cooldown_seconds]);

            // Create an Alert for the auto-block
            $alert_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );

            $stmt_alert = $pdo->prepare("INSERT INTO alerts (id, user_id, website_id, log_id, title, description, severity, attack_type, ip_address, url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt_alert->execute([
                $alert_id,
                $user_id,
                $website_id,
                $id,
                "IP Automatically Blocked",
                "IP $ip has been blocked for exceeding the rate limit of $max_requests requests in $window_seconds seconds.",
                'critical',
                'Rate Limiting',
                $ip,
                $url,
                'open'
            ]);
        }
    }

} catch (Exception $e) {
    // Write error to a file instead of failing silently
    file_put_contents(__DIR__ . '/error_log.txt', date('[Y-m-d H:i:s] ') . $e->getMessage() . PHP_EOL, FILE_APPEND);
}
?>
