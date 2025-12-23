<?php
// public/api/login.php
include_once 'db.php';

// Obsługa preflight request dla CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(array("error" => "Email and password are required"));
    exit();
}

$email = $data->email;
$password = $data->password;

// 1. Sprawdź czy to pierwsze logowanie (brak użytkowników)
$query = "SELECT COUNT(*) as count FROM admin_users";
$stmt = $conn->prepare($query);
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if($row['count'] == 0) {
    // Hardcoded credentials for first login (z Twojego .env)
    $admin_email = "admin22505_4558816"; // Zaktualizowane z Twojego env
    $admin_pass = "Kie@!st78ar?X";       // Zaktualizowane z Twojego env

    if($email === $admin_email && $password === $admin_pass) {
        // Utwórz użytkownika w bazie
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        
        $insert = "INSERT INTO admin_users (email, password_hash, name) VALUES (:email, :pass, 'Administrator')";
        $stmt = $conn->prepare($insert);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':pass', $password_hash);
        
        if($stmt->execute()) {
            $id = $conn->lastInsertId();
            // Generuj prosty token (w produkcji lepiej użyć JWT biblioteki, tu uproszczony base64 na start)
            $token = base64_encode(json_encode(array("id" => $id, "email" => $email, "exp" => time() + 3600)));
            
            echo json_encode(array(
                "success" => true,
                "token" => $token,
                "user" => array("id" => $id, "email" => $email, "name" => "Administrator"),
                "message" => "First admin created"
            ));
            exit();
        }
    }
}

// 2. Normalne logowanie
$query = "SELECT id, email, password_hash, name FROM admin_users WHERE email = :email LIMIT 1";
$stmt = $conn->prepare($query);
$stmt->bindParam(':email', $email);
$stmt->execute();

if($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if(password_verify($password, $row['password_hash'])) {
        // Update last login
        $update = "UPDATE admin_users SET last_login = NOW() WHERE id = :id";
        $up_stmt = $conn->prepare($update);
        $up_stmt->bindParam(':id', $row['id']);
        $up_stmt->execute();
        
        // Token
        $token = base64_encode(json_encode(array("id" => $row['id'], "email" => $row['email'], "exp" => time() + 3600)));
        
        echo json_encode(array(
            "success" => true,
            "token" => $token,
            "user" => array("id" => $row['id'], "email" => $row['email'], "name" => $row['name'])
        ));
    } else {
        http_response_code(401);
        echo json_encode(array("error" => "Invalid credentials"));
    }
} else {
    http_response_code(401);
    echo json_encode(array("error" => "Invalid credentials"));
}
?>
