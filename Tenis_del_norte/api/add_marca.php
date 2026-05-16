<?php
/**
 * add_marca.php — Agrega una marca nueva (solo admin)
 * POST: nombre
 */

session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$nombre = trim($_POST['nombre'] ?? '');

if ($nombre === '') {
    echo json_encode(['success' => false, 'message' => 'El nombre de la marca es obligatorio.']);
    exit;
}
if (mb_strlen($nombre) > 100) {
    echo json_encode(['success' => false, 'message' => 'El nombre es demasiado largo (máx. 100 caracteres).']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO marcas (nombre) VALUES (:n)");
    $stmt->execute([':n' => $nombre]);
    echo json_encode([
        'success' => true,
        'id'      => (int)$pdo->lastInsertId(),
        'nombre'  => $nombre,
    ]);
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate') !== false || $e->getCode() == 23000) {
        echo json_encode(['success' => false, 'message' => "La marca \"$nombre\" ya existe."]);
    } else {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
