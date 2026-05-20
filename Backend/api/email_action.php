<?php
// Backend/api/email_action.php
require_once 'config.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    die("Invalid request. No token provided.");
}

$db = getDB();

try {
    // 1. Check if token is valid, unused, and not expired
    $stmt = $db->prepare("SELECT * FROM email_action_tokens WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1");
    $stmt->execute([$token]);
    $tokenRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenRow) {
        die("
        <div style='font-family: Arial, sans-serif; text-align: center; margin-top: 50px;'>
            <h1 style='color: #ef4444;'>❌ Link Expired or Invalid</h1>
            <p>This link is invalid, has already been used, or has expired.</p>
            <p>Security links automatically expire after 2 hours.</p>
        </div>
        ");
    }

    $ip = $tokenRow['ip_address'];
    
    // Hardcoded test user ID since email click doesn't have a login session
    $userId = '9cc010bc-07c9-4576-98b0-c000815083ea'; 

    if ($tokenRow['action'] === 'block') {
        // 2. Block the IP for 7 days
        $blockId = generateUUID();
        $stmt_block = $db->prepare("INSERT INTO blocked_ips (id, user_id, ip_address, blocked_at, unblock_at) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))");
        $stmt_block->execute([$blockId, $userId, $ip]);

        // 3. Mark the token as used
        $stmt_used = $db->prepare("UPDATE email_action_tokens SET used = 1 WHERE token = ?");
        $stmt_used->execute([$token]);

        // 4. Show success message
        echo "
        <div style='font-family: Arial, sans-serif; text-align: center; margin-top: 50px;'>
            <h1 style='color: #10b981;'>✅ IP Blocked Successfully!</h1>
            <p>The IP address <strong>{$ip}</strong> has been manually blocked for 7 days.</p>
            <p>You can safely close this window.</p>
        </div>";
    } else {
        die("Unknown action.");
    }

} catch (PDOException $e) {
    // Ignore duplicate entry errors if they clicked it twice or if it was already manually blocked
    if ($e->getCode() == 23000) {
        // Still mark the token as used so it doesn't stay active
        $stmt_used = $db->prepare("UPDATE email_action_tokens SET used = 1 WHERE token = ?");
        $stmt_used->execute([$token]);
        
        echo "<div style='font-family: Arial, sans-serif; text-align: center; margin-top: 50px;'><h1 style='color: #10b981;'>✅ IP Blocked Successfully!</h1><p>This IP is already in your block list.</p></div>";
    } else {
        die("Database Error: " . $e->getMessage());
    }
}
?>
