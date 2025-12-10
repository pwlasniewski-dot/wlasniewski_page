<?php
// public/api/media-upload.php
include_once 'db.php';

// Check Auth
$headers = getallheaders();
if(!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(array("error" => "Unauthorized"));
    exit();
}

if(!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(array("error" => "No file uploaded"));
    exit();
}

try {
    $file = $_FILES['file'];
    $fileName = strtolower(str_replace(' ', '-', $file['name']));
    $uniqueName = time() . '-' . $fileName;
    
    // Upload directory: ../uploads/ (relative to public/api/)
    $uploadDir = '../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $targetPath = $uploadDir . $uniqueName;
    
    if(move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Get file info
        $fileSize = $file['size'];
        $mimeType = $file['type'];
        
        // Insert into DB
        $query = "INSERT INTO media_library (file_name, original_name, file_path, file_size, mime_type, folder) VALUES (:name, :orig, :path, :size, :mime, 'uploads')";
        $stmt = $conn->prepare($query);
        
        // Public path is /uploads/filename
        $publicPath = '/uploads/' . $uniqueName;
        
        $stmt->bindParam(':name', $uniqueName);
        $stmt->bindParam(':orig', $file['name']);
        $stmt->bindParam(':path', $publicPath);
        $stmt->bindParam(':size', $fileSize);
        $stmt->bindParam(':mime', $mimeType);
        
        if($stmt->execute()) {
            $id = $conn->lastInsertId();
            
            // Return the new media object
            echo json_encode(array(
                "success" => true,
                "media" => array(
                    "id" => $id,
                    "file_name" => $uniqueName,
                    "file_path" => $publicPath,
                    "mime_type" => $mimeType
                )
            ));
        } else {
            throw new Exception("Database insert failed");
        }
    } else {
        throw new Exception("File move failed");
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array("error" => $e->getMessage()));
}
?>
