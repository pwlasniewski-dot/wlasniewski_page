<?php
// public/api/pages.php
include_once 'db.php';

// GET request (List pages or get by slug)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $slug = isset($_GET['slug']) ? $_GET['slug'] : null;

    try {
        if ($slug) {
            $stmt = $conn->prepare("SELECT * FROM pages WHERE slug = ?");
            $stmt->execute([$slug]);
            $page = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($page) {
                echo json_encode(array("success" => true, "page" => $page));
            } else {
                http_response_code(404);
                echo json_encode(array("error" => "Page not found"));
            }
        } else {
            $stmt = $conn->prepare("SELECT * FROM pages");
            $stmt->execute();
            $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(array("success" => true, "pages" => $pages));
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}

// POST request (Update page)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check Auth
    $headers = getallheaders();
    if(!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(array("error" => "Unauthorized"));
        exit();
    }

    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->slug) || !isset($data->title) || !isset($data->content)) {
        http_response_code(400);
        echo json_encode(array("error" => "Missing required fields"));
        exit();
    }

    try {
        // Check if page exists
        $stmt = $conn->prepare("SELECT id FROM pages WHERE slug = ?");
        $stmt->execute([$data->slug]);
        $exists = $stmt->fetch();

        if ($exists) {
            $query = "UPDATE pages SET title = ?, content = ?, is_published = ? WHERE slug = ?";
            $stmt = $conn->prepare($query);
            $stmt->execute([$data->title, $data->content, $data->is_published ? 1 : 0, $data->slug]);
        } else {
            $query = "INSERT INTO pages (slug, title, content, is_published) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->execute([$data->slug, $data->title, $data->content, $data->is_published ? 1 : 0]);
        }

        echo json_encode(array("success" => true, "message" => "Page updated"));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}
?>
