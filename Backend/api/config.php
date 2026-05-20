<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'cybersoc_db');

// Include utils early to handle CORS and errors
require_once 'utils.php';
handleCORS();

function getDB() {
    try {
        $db = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $db;
    } catch (PDOException $e) {
        // Since handleCORS() was already called, we can just send the response
        sendResponse(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
    }
}
