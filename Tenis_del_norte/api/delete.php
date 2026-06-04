<?php
/**
 * delete.php
 * Elimina un tenis de la base de datos y borra su imagen del servidor.
 */

session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
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

$id = intval($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido.']);
    exit;
}

try {
    // Buscar las imágenes antes de borrar
    $stmt = $pdo->prepare("SELECT imagen_url, thumb_url FROM tenis WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['success' => false, 'message' => 'Tenis no encontrado.']);
        exit;
    }

    // Borrar el registro
    $del = $pdo->prepare("DELETE FROM tenis WHERE id = :id");
    $del->execute([':id' => $id]);

    // Borrar los archivos de imagen (full + thumb, evitando borrar dos veces si son el mismo)
    $borrados = [];
    foreach ([$row['imagen_url'], $row['thumb_url']] as $rel) {
        if (!$rel || in_array($rel, $borrados, true)) continue;
        $path = __DIR__ . '/../' . $rel;
        if (file_exists($path)) unlink($path);
        $borrados[] = $rel;
    }

    echo json_encode(['success' => true, 'message' => "Tenis #$id eliminado."]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}