<?php
// public/api/inquiries.php
include_once 'db.php';

// Check Auth
$headers = getallheaders();
if(!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(array("error" => "Unauthorized"));
    exit();
}

// GET request (List inquiries)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT * FROM inquiries ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $inquiries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(array("success" => true, "inquiries" => $inquiries));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}
?>
