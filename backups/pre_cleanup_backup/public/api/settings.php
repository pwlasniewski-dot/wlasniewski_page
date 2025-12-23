<?php
// public/api/settings.php
include_once 'db.php';

// GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT setting_key, setting_value FROM settings";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $settings = array();
        foreach($rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }

        echo json_encode(array("success" => true, "settings" => $settings));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}

// POST request (Update)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check Auth
    $headers = getallheaders();
    if(!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(array("error" => "Unauthorized"));
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $conn->beginTransaction();
        
        $query = "INSERT INTO settings (setting_key, setting_value) VALUES (:key, :val) ON DUPLICATE KEY UPDATE setting_value = :val";
        $stmt = $conn->prepare($query);
        
        foreach($data as $key => $value) {
            $valStr = (string)$value;
            $stmt->bindParam(':key', $key);
            $stmt->bindParam(':val', $valStr);
            $stmt->execute();
        }
        
        $conn->commit();
        echo json_encode(array("success" => true, "message" => "Settings updated"));
    } catch(Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}
?>
