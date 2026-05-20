<?php
// Backend/api/alerts.php
require_once 'config.php';

$db = getDB();
$userId = $_GET['user_id'] ?? '';

if (!$userId) {
    sendResponse(['error' => 'User ID is required'], 400);
}

// Fetch the most recent open alerts first
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
    $stmt->execute([$userId]);
    $alerts = $stmt->fetchAll();
    
    sendResponse($alerts);
}

// Optional: Allow marking alerts as resolved
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getJSONInput();
    $alertId = $input['id'] ?? '';
    $status = $input['status'] ?? 'resolved';
    
    if (!$alertId) {
        sendResponse(['error' => 'Alert ID is required'], 400);
    }
    
    try {
        // If status is resolved, set resolved_at. Otherwise leave it null or unchanged.
        if ($status === 'resolved') {
            $stmt = $db->prepare("UPDATE alerts SET status = ?, resolved_at = NOW() WHERE id = ? AND user_id = ?");
        } else {
            $stmt = $db->prepare("UPDATE alerts SET status = ? WHERE id = ? AND user_id = ?");
        }
        
        $stmt->execute([$status, $alertId, $userId]);
        
        sendResponse(['message' => 'Alert updated successfully']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// 3. DELETE: Delete a specific alert or bulk delete
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $alertId = $_GET['id'] ?? '';
    
    try {
        if ($alertId) {
            // Delete specific alert
            $stmt = $db->prepare("DELETE FROM alerts WHERE id = ? AND user_id = ?");
            $stmt->execute([$alertId, $userId]);
            sendResponse(['message' => 'Alert deleted successfully']);
        } else {
            // Bulk delete resolved and false_positive alerts
            $stmt = $db->prepare("DELETE FROM alerts WHERE user_id = ? AND status IN ('resolved', 'false_positive')");
            $stmt->execute([$userId]);
            $count = $stmt->rowCount();
            sendResponse(['message' => "Successfully cleared $count resolved alerts"]);
        }
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>
