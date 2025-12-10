<?php
// public/api/test-db.php
include_once 'db.php';

try {
    // Count users
    $query = "SELECT COUNT(*) as count FROM admin_users";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $userCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // Count settings
    $query = "SELECT COUNT(*) as count FROM settings";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $settingsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    echo json_encode(array(
        "success" => true,
        "message" => "Database connection successful (PHP + MySQL)",
        "userCount" => $userCount,
        "settingsCount" => $settingsCount
    ));
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => $e->getMessage()));
}
?>
