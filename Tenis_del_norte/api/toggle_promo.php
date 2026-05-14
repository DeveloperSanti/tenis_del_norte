<?php
/**
 * toggle_promo.php — Tenis del Norte
 * POST: id, promocion (0|1), precio_promo (opcional, solo cuando promocion=1)
 */

session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Acceso no autorizado']); exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success'=>false,'message'=>'Método no permitido.']); exit;
}

$id        = intval($_POST['id']        ?? 0);
$promocion = intval($_POST['promocion'] ?? 0);
$precio_promo = null;

if ($promocion === 1 && isset($_POST['precio_promo']) && $_POST['precio_promo'] !== '') {
    $precio_promo = intval($_POST['precio_promo']);
    if ($precio_promo <= 0) $precio_promo = null;
}
// Al desactivar promo, siempre limpiar precio_promo
if ($promocion === 0) $precio_promo = null;

if ($id <= 0) {
    echo json_encode(['success'=>false,'message'=>'ID inválido.']); exit;
}

try {
    $stmt = $pdo->prepare(
        "UPDATE tenis SET promocion = :promo, precio_promo = :pp WHERE id = :id"
    );
    $stmt->execute([':promo'=>$promocion, ':pp'=>$precio_promo, ':id'=>$id]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(['success'=>false,'message'=>'Referencia no encontrada.']);
    } else {
        echo json_encode(['success'=>true,'id'=>$id,'promocion'=>$promocion,'precio_promo'=>$precio_promo]);
    }
} catch (PDOException $e) {
    echo json_encode(['success'=>false,'message'=>$e->getMessage()]);
}
