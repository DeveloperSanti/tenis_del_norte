<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['usuario']) || !isset($input['password'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$usuario  = trim($input['usuario']);
$password = $input['password'];

if (empty($usuario) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Usuario y contraseña requeridos']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, password FROM usuarios WHERE usuario = ?");
    $stmt->execute([$usuario]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['admin_logged_in']  = true;
        $_SESSION['admin_user_id']    = $user['id'];
        $_SESSION['last_activity']    = time();   // ← marca de tiempo inicial
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos']);
}
?>
