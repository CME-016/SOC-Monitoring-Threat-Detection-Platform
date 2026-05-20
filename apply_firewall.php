<?php
// apply_firewall.php - Visit this file once in your browser to create the tables
require_once 'Backend/api/config.php';

$db = getDB();

try {
    // 1. Create Firewall Settings Table
    $db->exec("CREATE TABLE IF NOT EXISTS `firewall_settings` (
        `id` VARCHAR(36) PRIMARY KEY,
        `user_id` VARCHAR(36) NOT NULL,
        `max_requests` INT DEFAULT 50,
        `window_seconds` INT DEFAULT 60,
        `cooldown_seconds` INT DEFAULT 300,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    // 2. Create Blocked IPs Table
    $db->exec("CREATE TABLE IF NOT EXISTS `blocked_ips` (
        `id` VARCHAR(36) PRIMARY KEY,
        `user_id` VARCHAR(36) NOT NULL,
        `ip_address` VARCHAR(45) NOT NULL,
        `blocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `unblock_at` DATETIME NOT NULL,
        FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 3. Insert default settings for your test user if they don't exist
    $test_user_id = '9cc010bc-07c9-4576-98b0-c000815083ea';
    
    $stmt = $db->prepare("SELECT id FROM firewall_settings WHERE user_id = ?");
    $stmt->execute([$test_user_id]);
    
    if (!$stmt->fetch()) {
        $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
        
        $stmt = $db->prepare("INSERT INTO firewall_settings (id, user_id, max_requests, window_seconds, cooldown_seconds) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $test_user_id, 50, 60, 300]);
    }

    echo "<h1 style='color: green;'>Success! Firewall tables created successfully.</h1>";
    echo "<p>You can now delete this file or ignore it.</p>";

} catch (Exception $e) {
    echo "<h1 style='color: red;'>Error creating tables:</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
