<?php
/**
 * update_tenis.php — Editar un producto existente
 * POST: id, [precio], [precio_promo], [categoria], [promocion], [marca]
 *
 * Los campos no enviados quedan sin tocar. Sólo se actualiza lo que viene.
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

$id = intval($_POST['id'] ?? 0);
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido.']);
    exit;
}

$fields = [];
$params = [':id' => $id];

/* ── precio ─────────────────────────────────────── */
if (array_key_exists('precio', $_POST)) {
    $raw = trim($_POST['precio']);
    $val = ($raw !== '' && intval($raw) > 0) ? intval($raw) : null;
    $fields[]            = 'precio = :precio';
    $params[':precio']   = $val;
}

/* ── promocion + precio_promo ───────────────────── */
if (array_key_exists('promocion', $_POST)) {
    $promo = intval($_POST['promocion']) === 1 ? 1 : 0;
    $fields[]              = 'promocion = :promo';
    $params[':promo']      = $promo;

    /* precio_promo sólo tiene sentido cuando promo=1 */
    if ($promo === 1) {
        $raw = trim($_POST['precio_promo'] ?? '');
        $pp  = ($raw !== '' && intval($raw) > 0) ? intval($raw) : null;
        $fields[]            = 'precio_promo = :pp';
        $params[':pp']       = $pp;
    } else {
        $fields[]            = 'precio_promo = NULL';
    }
} elseif (array_key_exists('precio_promo', $_POST)) {
    /* permite actualizar solo precio_promo sin tocar promocion */
    $raw = trim($_POST['precio_promo']);
    $pp  = ($raw !== '' && intval($raw) > 0) ? intval($raw) : null;
    $fields[]            = 'precio_promo = :pp';
    $params[':pp']       = $pp;
}

/* ── categoria ──────────────────────────────────── */
if (array_key_exists('categoria', $_POST)) {
    $cat = trim($_POST['categoria']);
    if (!in_array($cat, ['hombre', 'mujer', 'unisex'], true)) {
        echo json_encode(['success' => false, 'message' => 'Categoría inválida.']);
        exit;
    }
    $fields[]            = 'categoria = :cat';
    $params[':cat']      = $cat;
}

/* ── marca ──────────────────────────────────────── */
if (array_key_exists('marca', $_POST)) {
    $marca = trim($_POST['marca']);
    if ($marca === '') {
        echo json_encode(['success' => false, 'message' => 'Marca vacía.']);
        exit;
    }
    $fields[]            = 'marca = :marca';
    $params[':marca']    = $marca;
}

if (empty($fields)) {
    echo json_encode(['success' => false, 'message' => 'No se envió ningún campo a actualizar.']);
    exit;
}

$sql = "UPDATE tenis SET " . implode(', ', $fields) . " WHERE id = :id";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        /* rowCount=0 puede ser: no encontrado O sin cambios reales — distinguimos */
        $chk = $pdo->prepare("SELECT id FROM tenis WHERE id = :id LIMIT 1");
        $chk->execute([':id' => $id]);
        if (!$chk->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado.']);
            exit;
        }
    }
    echo json_encode(['success' => true, 'id' => $id]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
