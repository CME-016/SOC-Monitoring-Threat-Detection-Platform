<?php
// Backend/api/profile.php
require_once 'config.php';

$db = getDB();
$userId = $_GET['user_id'] ?? '';

if (!$userId) {
    sendResponse(['error' => 'User ID is required'], 400);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Fetch profile settings
        $stmt = $db->prepare("SELECT id, email, full_name, role, avatar_url, phone, timezone, notifications_email, notifications_browser, notifications_telegram, telegram_chat_id, two_factor_enabled FROM profiles WHERE id = ?");
        $stmt->execute([$userId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$profile) {
            sendResponse(['error' => 'Profile not found'], 404);
        }

        // Convert tinyint to boolean for frontend compatibility
        $profile['notifications_email'] = (bool)$profile['notifications_email'];
        $profile['notifications_browser'] = (bool)$profile['notifications_browser'];
        $profile['notifications_telegram'] = (bool)$profile['notifications_telegram'];
        $profile['two_factor_enabled'] = (bool)$profile['two_factor_enabled'];

        sendResponse($profile);

    } elseif ($method === 'POST' || $method === 'PUT') {
        // Update profile settings
        $input = getJSONInput();
        
        // Prepare dynamic update query to only update provided fields
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'full_name', 'phone', 'timezone', 'telegram_chat_id',
            'notifications_email', 'notifications_browser', 'notifications_telegram',
            'two_factor_enabled'
        ];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $fields[] = "`$field` = ?";
                // Handle booleans for tinyint columns
                if (in_array($field, ['notifications_email', 'notifications_browser', 'notifications_telegram', 'two_factor_enabled'])) {
                    $params[] = $input[$field] ? 1 : 0;
                } else {
                    $params[] = $input[$field];
                }
            }
        }

        if (empty($fields)) {
            sendResponse(['error' => 'No fields to update'], 400);
        }

        $params[] = $userId;
        $sql = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Fetch updated profile to return
        $stmt = $db->prepare("SELECT id, email, full_name, role, avatar_url, phone, timezone, notifications_email, notifications_browser, notifications_telegram, telegram_chat_id, two_factor_enabled FROM profiles WHERE id = ?");
        $stmt->execute([$userId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        $profile['notifications_email'] = (bool)$profile['notifications_email'];
        $profile['notifications_browser'] = (bool)$profile['notifications_browser'];
        $profile['notifications_telegram'] = (bool)$profile['notifications_telegram'];
        $profile['two_factor_enabled'] = (bool)$profile['two_factor_enabled'];

        sendResponse($profile);

    } else {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
