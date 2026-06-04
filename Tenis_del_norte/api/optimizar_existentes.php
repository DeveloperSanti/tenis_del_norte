<?php
/**
 * optimizar_existentes.php — Reprocesa imágenes ya subidas
 *
 * Recorre los productos cuya imagen aún no tiene miniatura optimizada
 * (thumb_url NULL/vacío) y genera:
 *   · full  WebP máx 1080px  → reemplaza imagen_url
 *   · thumb WebP máx 450px   → nuevo thumb_url
 * Luego borra el archivo original pesado.
 *
 * Seguro para Hostinger: procesa en LOTES con auto-refresh para no
 * exceder el max_execution_time. Idempotente: lo puedes correr varias veces.
 *
 * Uso: abre  /api/optimizar_existentes.php  estando logueado en el admin.
 *      (opcional) ?batch=10 para cambiar el tamaño del lote.
 */

session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    header('Content-Type: text/html; charset=utf-8');
    echo '<p style="font-family:sans-serif">⛔ Acceso no autorizado. Inicia sesión en el <a href="/admin/login">panel admin</a> primero.</p>';
    exit;
}

require_once 'config.php';
require_once '_img_utils.php';

@set_time_limit(0);   // best-effort; en compartido puede estar capado

$batch     = max(1, min(50, intval($_GET['batch'] ?? 12)));
$uploadDir = rtrim(UPLOADS_PATH, '/\\') . '/';
$useWebp   = function_exists('imagewebp');

$finfo = new finfo(FILEINFO_MIME_TYPE);

/* ── Conteos ─────────────────────────────────────── */
$totalPend = (int)$pdo->query(
    "SELECT COUNT(*) FROM tenis WHERE thumb_url IS NULL OR thumb_url = ''"
)->fetchColumn();

/* ── Lote a procesar ─────────────────────────────── */
$stmt = $pdo->prepare(
    "SELECT id, imagen_url FROM tenis
     WHERE thumb_url IS NULL OR thumb_url = ''
     ORDER BY id ASC
     LIMIT :lim"
);
$stmt->bindValue(':lim', $batch, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$log         = [];
$okCount     = 0;
$failCount   = 0;

$updThumbFull = $pdo->prepare("UPDATE tenis SET imagen_url = :img, thumb_url = :thumb WHERE id = :id");
$updFallback  = $pdo->prepare("UPDATE tenis SET thumb_url = :thumb WHERE id = :id");

foreach ($rows as $r) {
    $id     = (int)$r['id'];
    $relOld = $r['imagen_url'];                      // ej: uploads/tenis_x.jpg
    $oldPath = $uploadDir . basename($relOld);

    if (!$relOld || !is_file($oldPath)) {
        // Imagen ausente: marcar para no reintentar en bucle (usa la full como thumb)
        $updFallback->execute([':thumb' => $relOld ?: '', ':id' => $id]);
        $failCount++;
        $log[] = ['id'=>$id, 'estado'=>'sin archivo', 'detalle'=>htmlspecialchars($relOld ?? '')];
        continue;
    }

    $mime = $finfo->file($oldPath);
    if (!in_array($mime, ['image/jpeg','image/jpg','image/png','image/webp'], true)) {
        $updFallback->execute([':thumb' => $relOld, ':id' => $id]);
        $failCount++;
        $log[] = ['id'=>$id, 'estado'=>'formato no soportado', 'detalle'=>htmlspecialchars($mime)];
        continue;
    }

    $base      = pathinfo(basename($relOld), PATHINFO_FILENAME); // tenis_x
    $outExt    = $useWebp ? 'webp' : 'jpg';
    $fullName  = $base . '.' . $outExt;
    $thumbName = $base . '_thumb.' . $outExt;
    $fullPath  = $uploadDir . $fullName;
    $thumbPath = $uploadDir . $thumbName;

    // Thumb primero (lee el original intacto), luego full
    $thumbOk = procesarImagen($oldPath, $mime, $thumbPath, 450,  78, $useWebp);
    $fullOk  = procesarImagen($oldPath, $mime, $fullPath,  1080, 82, $useWebp);

    if ($fullOk && $thumbOk) {
        $newFullRel  = 'uploads/' . $fullName;
        $newThumbRel = 'uploads/' . $thumbName;
        $updThumbFull->execute([':img'=>$newFullRel, ':thumb'=>$newThumbRel, ':id'=>$id]);

        // Borrar original viejo solo si cambió de nombre (evita borrar el recién escrito)
        if (realpath($oldPath) && realpath($oldPath) !== realpath($fullPath)) {
            @unlink($oldPath);
        }
        $okCount++;
        $log[] = ['id'=>$id, 'estado'=>'optimizada ✅', 'detalle'=>$fullName.' + thumb'];
    } else {
        // Falló GD: dejar la full como thumb para no reprocesar en bucle
        @unlink($thumbPath); @unlink($fullPath);
        $updFallback->execute([':thumb' => $relOld, ':id' => $id]);
        $failCount++;
        $log[] = ['id'=>$id, 'estado'=>'error GD', 'detalle'=>'no se pudo convertir'];
    }
}

$restantes = $totalPend - count($rows);
$procesadosTotal = $totalPend > 0 ? ($totalPend - $restantes) : 0;
$pct = $totalPend > 0 ? round((($totalPend - $restantes) / $totalPend) * 100) : 100;
$hayMas = $restantes > 0 && count($rows) > 0;

/* ── Salida HTML ─────────────────────────────────── */
header('Content-Type: text/html; charset=utf-8');
$refresh = $hayMas ? '<meta http-equiv="refresh" content="1;url=optimizar_existentes.php?batch='.$batch.'">' : '';
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="robots" content="noindex"/>
  <?= $refresh ?>
  <title>Optimizar imágenes · Tenis del Norte</title>
  <style>
    body { font-family: system-ui, sans-serif; background:#1e2f58; color:#f0f4ff; padding:32px; max-width:760px; margin:0 auto; }
    h1 { font-size:22px; margin-bottom:6px; }
    .muted { color:#8a9ec8; font-size:14px; }
    .bar { height:18px; background:rgba(255,255,255,.08); border-radius:100px; overflow:hidden; margin:20px 0 8px; }
    .bar > div { height:100%; background:linear-gradient(90deg,#f5c518,#ffd84d); width:<?= $pct ?>%; transition:width .3s; }
    .stats { display:flex; gap:18px; flex-wrap:wrap; margin:18px 0; }
    .chip { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:10px 16px; }
    .chip b { font-size:20px; display:block; }
    table { width:100%; border-collapse:collapse; margin-top:16px; font-size:13px; }
    td,th { text-align:left; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,.06); }
    .done { background:#25D366; color:#04210f; }
    .btn { display:inline-block; margin-top:20px; background:#f5c518; color:#1e2f58; text-decoration:none; font-weight:800; padding:12px 24px; border-radius:100px; }
    a { color:#f5c518; }
  </style>
</head>
<body>
  <h1>🖼️ Optimización de imágenes</h1>
  <p class="muted">
    <?php if (!$useWebp): ?>⚠️ Tu servidor no tiene WebP — se generan JPG optimizados (igual livianos).<br><?php endif; ?>
    <?php if ($hayMas): ?>
      Procesando por lotes de <?= $batch ?>… esta página se recarga sola hasta terminar.
    <?php else: ?>
      <?= $totalPend === 0 ? '¡No quedan imágenes pendientes! 🎉' : 'Proceso completado.' ?>
    <?php endif; ?>
  </p>

  <div class="bar"><div></div></div>
  <div class="muted"><?= $pct ?>% · faltan <?= max(0,$restantes) ?> de <?= $totalPend ?></div>

  <div class="stats">
    <div class="chip"><b><?= $okCount ?></b> optimizadas (este lote)</div>
    <div class="chip"><b><?= $failCount ?></b> con aviso</div>
    <div class="chip"><b><?= max(0,$restantes) ?></b> restantes</div>
  </div>

  <?php if (!$hayMas): ?>
    <div class="chip done" style="display:block;text-align:center;padding:16px;">
      ✅ Listo. Todas las imágenes existentes fueron procesadas.
    </div>
    <a class="btn" href="/admin/">← Volver al panel</a>
  <?php endif; ?>

  <?php if ($log): ?>
  <table>
    <tr><th>ID</th><th>Estado</th><th>Detalle</th></tr>
    <?php foreach ($log as $l): ?>
      <tr><td>#<?= $l['id'] ?></td><td><?= $l['estado'] ?></td><td class="muted"><?= $l['detalle'] ?></td></tr>
    <?php endforeach; ?>
  </table>
  <?php endif; ?>
</body>
</html>
