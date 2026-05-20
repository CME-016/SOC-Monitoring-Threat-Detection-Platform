<?php
// Aggressive CORS headers - Must be at the very top
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
} else {
    header("Access-Control-Allow-Origin: *");
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
}

// Disable error reporting output to prevent breaking JSON
error_reporting(0);
ini_set('display_errors', 0);

require_once 'config.php';

$action = $_GET['action'] ?? '';
$db = getDB();

if ($action === 'signup') {
    $input = getJSONInput();
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $fullName = $input['full_name'] ?? '';

    if (!$email || !$password) {
        sendResponse(['error' => 'Email and password are required'], 400);
    }

    // Check if user exists
    $stmt = $db->prepare("SELECT id FROM profiles WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'User already exists'], 400);
    }

    $id = generateUUID();
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $db->prepare("INSERT INTO profiles (id, email, password, full_name) VALUES (?, ?, ?, ?)");
    try {
        $stmt->execute([$id, $email, $hashedPassword, $fullName]);
        
        // Fetch the created profile
        $stmt = $db->prepare("SELECT id, email, full_name, role FROM profiles WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        sendResponse(['user' => $user, 'message' => 'User created successfully']);
    } catch (Exception $e) {
        sendResponse(['error' => 'Failed to create user: ' . $e->getMessage()], 500);
    }
}

if ($action === 'login') {
    $input = getJSONInput();
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        sendResponse(['error' => 'Email and password are required'], 400);
    }

    $stmt = $db->prepare("SELECT id, email, password, full_name, role FROM profiles WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendResponse(['error' => 'Invalid email or password'], 401);
    }

    unset($user['password']);
    
    sendResponse(['user' => $user, 'message' => 'Login successful']);
}

sendResponse(['error' => 'Invalid action'], 400);
