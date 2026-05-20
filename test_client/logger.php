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

        // ---- NEW: SEND EMAIL ALERT ----
        // 0. Check User Notification Settings: Only send if notifications_email is enabled (1) in database
        $stmt_user_settings = $pdo->prepare("SELECT notifications_email FROM profiles WHERE id = ?");
        $stmt_user_settings->execute([$user_id]);
        $notifications_email_enabled = $stmt_user_settings->fetchColumn();

        if ($notifications_email_enabled == 1) {
            // 1. Throttling: Check if we already sent an email for this IP in the last 1 minute (Lowered for testing!)
            $stmt_check_email = $pdo->prepare("SELECT COUNT(*) FROM email_action_tokens WHERE ip_address = ? AND created_at > (NOW() - INTERVAL 1 MINUTE)");
            $stmt_check_email->execute([$ip]);
            $recent_emails = $stmt_check_email->fetchColumn();

            if ($recent_emails == 0) {
            // 2. Generate a secure token
            $token = bin2hex(random_bytes(32)); // 64 char token
            
            // 3. Save token to database (expires in 2 hours)
            $stmt_token = $pdo->prepare("INSERT INTO email_action_tokens (token, ip_address, action, expires_at) VALUES (?, ?, 'block', DATE_ADD(NOW(), INTERVAL 2 HOUR))");
            $stmt_token->execute([$token, $ip]);

            // 4. Send Email
            // Locate the mailer script dynamically based on the project root
            $rootPath = realpath(__DIR__ . '/..'); 
            $mailerPath = $rootPath . '/Backend/api/smtp_mailer.php';
            
            if (file_exists($mailerPath)) { 
                require_once $mailerPath; 
            } else {
                // Absolute fallback just in case
                @include_once 'd:/SOC/Backend/api/smtp_mailer.php';
            }

            if (function_exists('sendSOCEmail')) {
                $subject = "🚨 CRITICAL SOC ALERT: " . $attack_type . " Detected";
                $block_link = "http://localhost/Backend/api/email_action.php?token=" . $token;
                
                $bodyHTML = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #334155; border-radius: 8px; overflow: hidden; background-color: #0f172a; color: #e2e8f0;'>
                    <div style='background-color: #ef4444; padding: 20px; text-align: center;'>
                        <h1 style='color: white; margin: 0; font-size: 24px;'>🚨 Critical Security Alert</h1>
                    </div>
                    <div style='padding: 30px;'>
                        <p style='font-size: 16px; margin-top: 0;'>Your CyberSOC system has intercepted a critical threat targeting your infrastructure.</p>
                        
                        <div style='background-color: #1e293b; padding: 15px; border-radius: 6px; margin: 20px 0;'>
                            <table style='width: 100%; border-collapse: collapse;'>
                                <tr>
                                    <td style='padding: 8px 0; color: #94a3b8; width: 120px;'><strong>Attack Type:</strong></td>
                                    <td style='padding: 8px 0; color: #f87171; font-weight: bold;'>{$attack_type}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; color: #94a3b8;'><strong>Attacker IP:</strong></td>
                                    <td style='padding: 8px 0; color: #38bdf8; font-family: monospace;'>{$ip}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px 0; color: #94a3b8;'><strong>Target URL:</strong></td>
                                    <td style='padding: 8px 0;'>{$url}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p style='color: #94a3b8; font-size: 14px; margin-bottom: 25px;'>
                            The automated firewall rules did not block this IP yet. You can manually block it now using the button below. This link expires in 2 hours.
                        </p>
                        
                        <div style='text-align: center;'>
                            <a href='{$block_link}' style='display: inline-block; background-color: #ef4444; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;'>BLOCK IP ADDRESS</a>
                        </div>
                    </div>
                </div>";
                
                // Set to your actual receiving email address
                $admin_email = 'dupana.chiranjeevi2008@gmail.com'; 
                sendSOCEmail($admin_email, $subject, $bodyHTML);
            }
        }
        }
        // --------------------------------
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
