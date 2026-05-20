<?php
// Backend/api/websites.php
require_once 'config.php';

$db = getDB();
$userId = $_GET['user_id'] ?? '9cc010bc-07c9-4576-98b0-c000815083ea'; // Fallback to our test user

if (!$userId) {
    sendResponse(['error' => 'User ID is required'], 400);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Fetch all websites for the user
        $stmt = $db->prepare("SELECT id, name, url, status, created_at FROM websites WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $websites = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch counts of logs and alerts for each website to display stats in UI
        foreach ($websites as &$site) {
            // Logs count
            $stmt_logs = $db->prepare("SELECT COUNT(*) FROM logs WHERE website_id = ?");
            $stmt_logs->execute([$site['id']]);
            $site['requests_count'] = (int)$stmt_logs->fetchColumn();

            // Alerts count
            $stmt_alerts = $db->prepare("SELECT COUNT(*) FROM alerts WHERE website_id = ?");
            $stmt_alerts->execute([$site['id']]);
            $site['alerts_count'] = (int)$stmt_alerts->fetchColumn();
        }

        sendResponse($websites);

    } elseif ($method === 'POST') {
        // Add a new website
        $input = getJSONInput();
        $name = $input['name'] ?? '';
        $url = $input['url'] ?? '';

        if (empty($name) || empty($url)) {
            sendResponse(['error' => 'Website name and URL are required'], 400);
        }

        $id = generateUUID();
        $status = 'active';

        $domain = parse_url($url, PHP_URL_HOST);
        if (empty($domain)) {
            $domain = $url;
        }

        $stmt = $db->prepare("INSERT INTO websites (id, user_id, name, domain, url, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $userId, $name, $domain, $url, $status]);

        sendResponse([
            'id' => $id,
            'name' => $name,
            'url' => $url,
            'status' => $status,
            'requests_count' => 0,
            'alerts_count' => 0
        ], 201);

    } elseif ($method === 'DELETE') {
        // Delete a website
        $websiteId = $_GET['id'] ?? '';

        if (!$websiteId) {
            sendResponse(['error' => 'Website ID is required'], 400);
        }

        $stmt = $db->prepare("DELETE FROM websites WHERE id = ? AND user_id = ?");
        $stmt->execute([$websiteId, $userId]);

        sendResponse(['success' => true]);

    } else {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
