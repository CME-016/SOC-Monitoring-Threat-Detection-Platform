<?php
// setup_email_alerts.php - Visit this file once in your browser to create the table
require_once 'Backend/api/config.php';

$db = getDB();

try {
    $db->exec("CREATE TABLE IF NOT EXISTS `email_action_tokens` (
        `token` VARCHAR(64) PRIMARY KEY,
        `ip_address` VARCHAR(45) NOT NULL,
        `action` VARCHAR(20) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `expires_at` DATETIME NOT NULL,
        `used` TINYINT(1) DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    echo "<h1 style='color: green;'>Success! Email Action Tokens table created successfully.</h1>";
    echo "<p>You can now delete this file.</p>";

} catch (Exception $e) {
    echo "<h1 style='color: red;'>Error creating table:</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
