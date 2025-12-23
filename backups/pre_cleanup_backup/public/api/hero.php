<?php
// public/api/hero.php
include_once 'db.php';

// GET request (List slides)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT h.*, m.file_path as image_path FROM hero_slides h LEFT JOIN media_library m ON h.image_id = m.id ORDER BY h.display_order ASC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $slides = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format for frontend (mimic Prisma include)
        foreach ($slides as &$slide) {
            if ($slide['image_path']) {
                $slide['image'] = ['file_path' => $slide['image_path']];
            }
        }

        echo json_encode(array("success" => true, "slides" => $slides));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}

// Check Auth for POST/DELETE
$headers = getallheaders();
if(!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(array("error" => "Unauthorized"));
    exit();
}

// POST request (Create/Update slide)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->image_id)) {
        http_response_code(400);
        echo json_encode(array("error" => "Image ID required"));
        exit();
    }

    try {
        if (isset($data->id)) {
            $query = "UPDATE hero_slides SET title=?, subtitle=?, button_text=?, button_link=?, image_id=?, is_active=? WHERE id=?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$data->title, $data->subtitle, $data->button_text, $data->button_link, $data->image_id, $data->is_active ? 1 : 0, $data->id]);
        } else {
            $query = "INSERT INTO hero_slides (title, subtitle, button_text, button_link, image_id, is_active) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->execute([$data->title, $data->subtitle, $data->button_text, $data->button_link, $data->image_id, $data->is_active ? 1 : 0]);
        }
        echo json_encode(array("success" => true));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}

// DELETE request
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(array("error" => "ID required"));
        exit();
    }

    try {
        $stmt = $conn->prepare("DELETE FROM hero_slides WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(array("success" => true));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}
?>
