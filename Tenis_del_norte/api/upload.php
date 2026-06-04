<?php
/**
 * upload.php — Tenis del Norte
 * POST: marca, categoria, promocion, precio, precio_promo, foto
 *
 * - La referencia se genera AUTOMÁTICAMENTE (TN-0001, TN-0002, …)
 * - La imagen se optimiza con GD:
 *     · full  → WebP máx 1080px (para el lightbox)
 *     · thumb → WebP máx 450px  (para las tarjetas del catálogo)
 *   Esto reduce el peso de varios MB a unas decenas de KB.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';
require_once '_img_utils.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success'=>false,'message'=>'Método no permitido.']); exit;
}

$marca     = trim($_POST['marca']     ?? '');
$categoria = trim($_POST['categoria'] ?? '');
$promocion = intval($_POST['promocion'] ?? 0);

// Precio: vacío o cero → NULL
$precioRaw      = trim($_POST['precio']       ?? '');
$precioPromoRaw = trim($_POST['precio_promo'] ?? '');
$precio         = ($precioRaw !== '' && intval($precioRaw) > 0)           ? intval($precioRaw)      : null;
$precio_promo   = ($precioPromoRaw !== '' && intval($precioPromoRaw) > 0) ? intval($precioPromoRaw) : null;
if (!$promocion) $precio_promo = null;   // sin promo → nunca precio_promo

// Validaciones básicas
if (empty($marca)) { echo json_encode(['success'=>false,'message'=>'La marca es obligatoria.']); exit; }
if (!in_array($categoria, ['hombre','mujer','unisex'])) {
    echo json_encode(['success'=>false,'message'=>'Categoría inválida.']); exit;
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
if ($_FILES['foto']['size'] > 12 * 1024 * 1024) {
    echo json_encode(['success'=>false,'message'=>'La foto no puede superar 12 MB.']); exit;
}

// ── Preparar carpeta ─────────────────────────────────
$uploadDir = UPLOADS_PATH;   // viene de config.php (ruta absoluta)
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$base      = 'tenis_' . uniqid('', true);
$useWebp   = function_exists('imagewebp');
$outExt    = $useWebp ? 'webp' : 'jpg';
$fullName  = $base . '.' . $outExt;
$thumbName = $base . '_thumb.' . $outExt;

// ── Generar full + thumb (procesarImagen viene de _img_utils.php) ──
$fullOk  = procesarImagen($_FILES['foto']['tmp_name'], $mime, $uploadDir . $fullName,  1080, 82, $useWebp);
$thumbOk = procesarImagen($_FILES['foto']['tmp_name'], $mime, $uploadDir . $thumbName,  450, 78, $useWebp);

if (!$fullOk) {
    // Fallback: si GD falló, mover el original tal cual
    $origExt  = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION)) ?: 'jpg';
    $fullName = $base . '.' . $origExt;
    if (!move_uploaded_file($_FILES['foto']['tmp_name'], $uploadDir . $fullName)) {
        echo json_encode(['success'=>false,'message'=>'Error al guardar la imagen. Verifica permisos de uploads/ (755).']); exit;
    }
    $thumbName = $fullName;   // sin thumb → usar la misma
}

$imagen_url = 'uploads/' . $fullName;
$thumb_url  = 'uploads/' . ($thumbOk ? $thumbName : $fullName);

// ── Insertar en BD (referencia temporal → luego TN-####) ──
try {
    $tempRef = $base;   // único, evita choque con UNIQUE durante el insert
    $stmt = $pdo->prepare(
        "INSERT INTO tenis (referencia, marca, categoria, promocion, precio, precio_promo, imagen_url, thumb_url)
         VALUES (:ref, :marca, :cat, :promo, :precio, :precio_promo, :img, :thumb)"
    );
    $stmt->execute([
        ':ref'          => $tempRef,
        ':marca'        => $marca,
        ':cat'          => $categoria,
        ':promo'        => $promocion,
        ':precio'       => $precio,
        ':precio_promo' => $precio_promo,
        ':img'          => $imagen_url,
        ':thumb'        => $thumb_url,
    ]);
    $newId = (int)$pdo->lastInsertId();

    // Referencia definitiva, legible y correlativa: TN-0001, TN-0002, …
    $referencia = 'TN-' . str_pad($newId, 4, '0', STR_PAD_LEFT);
    $pdo->prepare("UPDATE tenis SET referencia = :ref WHERE id = :id")
        ->execute([':ref' => $referencia, ':id' => $newId]);

    echo json_encode([
        'success'    => true,
        'id'         => $newId,
        'referencia' => $referencia,
        'imagen_url' => $imagen_url,
        'thumb_url'  => $thumb_url,
    ]);

} catch (PDOException $e) {
    // Limpiar imágenes si falla la BD
    @unlink($uploadDir . $fullName);
    if ($thumbOk) @unlink($uploadDir . $thumbName);
    echo json_encode(['success'=>false,'message'=>'Error BD: '.$e->getMessage()]);
}
