<?php
// public/api/blog.php
include_once 'db.php';

// GET request (List posts)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT * FROM blog_posts ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(array("success" => true, "posts" => $posts));
    } catch(Exception $e) {
        http_response_code(500);
        echo json_encode(array("error" => $e->getMessage()));
    }
    exit();
}

// POST request (Create post)
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
        $query = "INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, is_published, published_at, meta_title, meta_description, author_id) 
                  VALUES (:title, :slug, :excerpt, :content, :cover, :pub, :pub_at, :m_title, :m_desc, :author)";
        
        $stmt = $conn->prepare($query);
        
        $is_published = isset($data->is_published) && $data->is_published ? 1 : 0;
        $published_at = $is_published ? date('Y-m-d H:i:s') : null;
        // Assuming author_id is 1 for now or decoded from token (simplified)
        $author_id = 1; 

        $stmt->bindParam(':title', $data->title);
        $stmt->bindParam(':slug', $data->slug);
        $stmt->bindParam(':excerpt', $data->excerpt);
        $stmt->bindParam(':content', $data->content);
        $stmt->bindParam(':cover', $data->cover_image);
        $stmt->bindParam(':pub', $is_published);
        $stmt->bindParam(':pub_at', $published_at);
        $stmt->bindParam(':m_title', $data->meta_title);
        $stmt->bindParam(':m_desc', $data->meta_description);
        $stmt->bindParam(':author', $author_id);
        
        if($stmt->execute()) {
            $id = $conn->lastInsertId();
            echo json_encode(array("success" => true, "post" => array("id" => $id, "title" => $data->title)));
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
