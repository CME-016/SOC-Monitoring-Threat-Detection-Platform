<?php
// Utility functions for API

// Handle CORS - Extremely permissive for local development
function handleCORS() {
    // Handled by .htaccess
    // header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept");
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        header("HTTP/1.1 200 OK");
        exit;
    }
}

// Send JSON response
function sendResponse($data, $statusCode = 200) {
    // Handled by .htaccess
    // header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/json', true, $statusCode);
    echo json_encode($data);
    exit;
}

// Generate UUID v4
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Get JSON input
function getJSONInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}
