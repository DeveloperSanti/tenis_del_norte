<?php
/**
 * get_zapatos.php — Tenis del Norte
 * Devuelve tenis con precio y precio_promo incluidos.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

$categoria = $_GET['categoria'] ?? null;
$marca     = $_GET['marca']     ?? null;
$promo     = $_GET['promo']     ?? null;
$limit     = intval($_GET['limit']  ?? 0);
$offset    = intval($_GET['offset'] ?? 0);

$where  = [];
$params = [];

if ($categoria && in_array($categoria, ['hombre','mujer','unisex'])) {
    if ($categoria === 'hombre' || $categoria === 'mujer') {
        $where[]          = "(categoria = :cat OR categoria = 'unisex')";
        $params[':cat']   = $categoria;
    } else {
        $where[] = "categoria = 'unisex'";
    }
}
if ($marca)      { $where[] = 'marca = :marca';    $params[':marca'] = $marca; }
if ($promo==='1') { $where[] = 'promocion = 1'; }

$sql = "SELECT id, referencia, marca, categoria, imagen_url, thumb_url, promocion, precio, precio_promo
        FROM tenis";
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' ORDER BY id DESC';
if ($limit > 0) $sql .= ' LIMIT :limit OFFSET :offset';

try {
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    if ($limit > 0) {
        $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Castear precios a número o null
    foreach ($rows as &$r) {
        $r['precio']       = $r['precio']       !== null ? (int)$r['precio']       : null;
        $r['precio_promo'] = $r['precio_promo'] !== null ? (int)$r['precio_promo'] : null;
    }
    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
