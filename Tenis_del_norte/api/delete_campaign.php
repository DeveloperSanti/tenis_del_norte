<?php
/**
 * delete_campaign.php — Elimina una campaña (solo admin)
 * POST: id
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

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido.']); exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM promo_campaigns WHERE id = :id");
    $stmt->execute([':id' => $id]);
    echo json_encode(['success' => true, 'id' => $id]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
