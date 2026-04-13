<?php
/**
 * upload.php — Tenis del Norte
 * POST: referencia, marca, categoria, promocion, precio, precio_promo, foto
 * UBICACIÓN: api/upload.php  (el JS llama a ../api/upload.php desde admin/)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success'=>false,'message'=>'Método no permitido.']); exit;
}

$referencia   = trim($_POST['referencia']   ?? '');
$marca        = trim($_POST['marca']        ?? '');
$categoria    = trim($_POST['categoria']    ?? '');
$promocion    = intval($_POST['promocion']  ?? 0);

// Precio: vacío o cero → NULL
$precioRaw      = trim($_POST['precio']       ?? '');
$precioPromoRaw = trim($_POST['precio_promo'] ?? '');
$precio         = ($precioRaw !== '' && intval($precioRaw) > 0)      ? intval($precioRaw)      : null;
$precio_promo   = ($precioPromoRaw !== '' && intval($precioPromoRaw) > 0) ? intval($precioPromoRaw) : null;
if (!$promocion) $precio_promo = null;   // sin promo → nunca precio_promo

// Validaciones básicas
if (empty($referencia)) { echo json_encode(['success'=>false,'message'=>'El número de referencia es obligatorio.']); exit; }
if (empty($marca))      { echo json_encode(['success'=>false,'message'=>'La marca es obligatoria.']); exit; }
if (!in_array($categoria, ['hombre','mujer','unisex'])) {
    echo json_encode(['success'=>false,'message'=>'Categoría inválida.']); exit;
}

// ── Verificar referencia duplicada ───────────────────
try {
    $chk = $pdo->prepare("SELECT id FROM tenis WHERE referencia = :ref LIMIT 1");
    $chk->execute([':ref' => $referencia]);
    if ($chk->fetch()) {
        echo json_encode(['success'=>false,'message'=>"La referencia \"$referencia\" ya existe en el catálogo. Usa otra."]); exit;
    }
} catch (PDOException $e) {
    echo json_encode(['success'=>false,'message'=>'Error BD: '.$e->getMessage()]); exit;
}

// ── Validar foto ─────────────────────────────────────
if (empty($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    $errMsg = [
        1 => 'La foto supera el tamaño permitido por el servidor.',
        2 => 'La foto supera el tamaño permitido por el formulario.',
        3 => 'La foto se subió de forma incompleta.',
        4 => 'No se seleccionó ninguna foto.',
    ][$_FILES['foto']['error'] ?? 4] ?? 'Error al recibir la foto.';
    echo json_encode(['success'=>false,'message'=>$errMsg]); exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($_FILES['foto']['tmp_name']);
if (!in_array($mime, ['image/jpeg','image/png','image/webp','image/jpg'])) {
    echo json_encode(['success'=>false,'message'=>'Solo se aceptan imágenes JPG, PNG o WEBP.']); exit;
}
if ($_FILES['foto']['size'] > 8 * 1024 * 1024) {
    echo json_encode(['success'=>false,'message'=>'La foto no puede superar 8 MB.']); exit;
}

// ── Guardar imagen ────────────────────────────────────
$ext       = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION));
if ($ext === 'jpg') $ext = 'jpg';
$filename  = 'tenis_' . uniqid('', true) . '.' . $ext;
// UPLOADS_PATH y UPLOADS_URL vienen de config.php — rutas absolutas y confiables
$uploadDir = UPLOADS_PATH;
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

if (!move_uploaded_file($_FILES['foto']['tmp_name'], $uploadDir . $filename)) {
    echo json_encode(['success'=>false,'message'=>'Error al guardar la imagen. Verifica permisos de la carpeta uploads/ (debe ser 755).']); exit;
}

$imagen_url = 'uploads/' . $filename;   // relativa al dominio

// ── Insertar en BD ────────────────────────────────────
try {
    $stmt = $pdo->prepare(
        "INSERT INTO tenis (referencia, marca, categoria, promocion, precio, precio_promo, imagen_url)
         VALUES (:ref, :marca, :cat, :promo, :precio, :precio_promo, :img)"
    );
    $stmt->execute([
        ':ref'          => $referencia,
        ':marca'        => $marca,
        ':cat'          => $categoria,
        ':promo'        => $promocion,
        ':precio'       => $precio,
        ':precio_promo' => $precio_promo,
        ':img'          => $imagen_url,
    ]);
    echo json_encode(['success'=>true, 'id'=>$pdo->lastInsertId(), 'imagen_url'=>$imagen_url]);

} catch (PDOException $e) {
    unlink($uploadDir . $filename); // limpiar imagen si falla BD
    // Detectar duplicado a nivel BD (por si acaso)
    if (strpos($e->getMessage(), 'Duplicate') !== false || $e->getCode() == 23000) {
        echo json_encode(['success'=>false,'message'=>"La referencia \"$referencia\" ya existe en el catálogo."]);
    } else {
        echo json_encode(['success'=>false,'message'=>'Error BD: '.$e->getMessage()]);
    }
}