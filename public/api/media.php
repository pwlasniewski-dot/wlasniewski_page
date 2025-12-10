<?php
// public/api/media.php
include_once 'db.php';

// Check Auth (Simplified for now - ideally verify JWT)
$headers = getallheaders();
if(!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(array("error" => "Unauthorized"));
    exit();
}

try {
    $query = "SELECT * FROM media_library ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $media = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array(
        "success" => true,
        "media" => $media
    ));
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => $e->getMessage()));
}
?>
