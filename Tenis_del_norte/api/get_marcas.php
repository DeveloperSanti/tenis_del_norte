<?php
/**
 * get_marcas.php — Devuelve lista de marcas activas
 * Público (lo usan tanto el catálogo como el admin)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT id, nombre FROM marcas ORDER BY nombre ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['id'] = (int)$r['id'];
    }
    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
