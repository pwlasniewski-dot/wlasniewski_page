<?php
// public/api/portfolio.php
include_once 'db.php';

// GET request (List sessions)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT * FROM portfolio_sessions ORDER BY session_date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(array("success" => true, "sessions" => $sessions));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}

// POST request (Create session)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check Auth
    $headers = getallheaders();
    if(!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(array("error" => "Unauthorized"));
        exit();
    }

    $data = json_decode(file_get_contents("php://input"));
    
    if(!isset($data->title) || !isset($data->slug)) {
        http_response_code(400);
        echo json_encode(array("error" => "Title and slug are required"));
        exit();
    }

    try {
        $query = "INSERT INTO portfolio_sessions (title, slug, category, description, cover_image, gallery_images, session_date, is_published, meta_title, meta_description) 
                  VALUES (:title, :slug, :cat, :desc, :cover, :imgs, :date, :pub, :m_title, :m_desc)";
        
        $stmt = $conn->prepare($query);
        
        $is_published = isset($data->is_published) && $data->is_published ? 1 : 0;
        $session_date = isset($data->session_date) ? $data->session_date : date('Y-m-d');
        $gallery_images = isset($data->gallery_images) ? $data->gallery_images : '[]';

        $stmt->bindParam(':title', $data->title);
        $stmt->bindParam(':slug', $data->slug);
        $stmt->bindParam(':cat', $data->category);
        $stmt->bindParam(':desc', $data->description);
        $stmt->bindParam(':cover', $data->cover_image);
        $stmt->bindParam(':imgs', $gallery_images);
        $stmt->bindParam(':date', $session_date);
        $stmt->bindParam(':pub', $is_published);
        $stmt->bindParam(':m_title', $data->meta_title);
        $stmt->bindParam(':m_desc', $data->meta_description);
        
        if($stmt->execute()) {
            $id = $conn->lastInsertId();
            echo json_encode(array("success" => true, "session" => array("id" => $id, "title" => $data->title)));
        } else {
            throw new Exception("Insert failed");
        }
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}
?>
