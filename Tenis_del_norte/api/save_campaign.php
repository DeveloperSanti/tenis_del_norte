<?php
/**
 * save_campaign.php — Crear o actualizar campaña (solo admin)
 *
 * POST:
 *   [id]          opcional → si viene, actualiza; si no, crea
 *   nombre        string
 *   porcentaje    1-99
 *   scope         'all' | 'brand' | 'gender'
 *   marca         requerido si scope=brand
 *   genero        requerido si scope=gender ('hombre'|'mujer')
 *   mensaje       texto
 *   cta_text      string (opcional, default 'Ver ahora')
 *   activo        0|1
 *   inicia_en     ISO datetime o vacío
 *   expira_en     ISO datetime (requerido)
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
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']); exit;
}

$id         = intval($_POST['id'] ?? 0);
$nombre     = trim($_POST['nombre']     ?? '');
$porcentaje = intval($_POST['porcentaje'] ?? 0);
$scope      = trim($_POST['scope']      ?? 'all');
$marca      = trim($_POST['marca']      ?? '');
$genero     = trim($_POST['genero']     ?? '');
$mensaje    = trim($_POST['mensaje']    ?? '');
$cta_text   = trim($_POST['cta_text']   ?? 'Ver ahora') ?: 'Ver ahora';
$activo     = intval($_POST['activo']   ?? 1) === 1 ? 1 : 0;
$inicia_en  = trim($_POST['inicia_en']  ?? '') ?: null;
$expira_en  = trim($_POST['expira_en']  ?? '');

// ── Validaciones ────────────────────────────────────
if ($nombre === '')                          { echo json_encode(['success'=>false,'message'=>'Falta el nombre.']); exit; }
if ($porcentaje < 1 || $porcentaje > 99)     { echo json_encode(['success'=>false,'message'=>'El porcentaje debe estar entre 1 y 99.']); exit; }
if (!in_array($scope, ['all','brand','gender'], true)){ echo json_encode(['success'=>false,'message'=>'Alcance inválido.']); exit; }
if ($scope === 'brand' && $marca === '')     { echo json_encode(['success'=>false,'message'=>'Selecciona una marca.']); exit; }
if ($scope === 'gender' && !in_array($genero, ['hombre','mujer'], true)) {
    echo json_encode(['success'=>false,'message'=>'Selecciona un género (hombre o mujer).']); exit;
}
// Limpiar campos que no apliquen al scope elegido
if ($scope !== 'brand')  $marca  = null;
if ($scope !== 'gender') $genero = null;
if ($mensaje === '')                         { echo json_encode(['success'=>false,'message'=>'Falta el mensaje del anuncio.']); exit; }
if ($expira_en === '')                       { echo json_encode(['success'=>false,'message'=>'Falta la fecha de expiración.']); exit; }

// Normalizar datetime (acepta YYYY-MM-DDTHH:MM o YYYY-MM-DD HH:MM:SS)
$expira_en = str_replace('T', ' ', $expira_en);
if ($inicia_en) $inicia_en = str_replace('T', ' ', $inicia_en);

try {
    if ($id > 0) {
        $stmt = $pdo->prepare(
            "UPDATE promo_campaigns
             SET nombre=:n, porcentaje=:p, scope=:s, marca=:m, genero=:g, mensaje=:msg,
                 cta_text=:cta, activo=:a, inicia_en=:ini, expira_en=:exp
             WHERE id=:id"
        );
        $stmt->execute([
            ':n'=>$nombre, ':p'=>$porcentaje, ':s'=>$scope, ':m'=>$marca, ':g'=>$genero,
            ':msg'=>$mensaje, ':cta'=>$cta_text, ':a'=>$activo,
            ':ini'=>$inicia_en, ':exp'=>$expira_en, ':id'=>$id,
        ]);
        echo json_encode(['success'=>true, 'id'=>$id]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO promo_campaigns
             (nombre, porcentaje, scope, marca, genero, mensaje, cta_text, activo, inicia_en, expira_en)
             VALUES (:n, :p, :s, :m, :g, :msg, :cta, :a, :ini, :exp)"
        );
        $stmt->execute([
            ':n'=>$nombre, ':p'=>$porcentaje, ':s'=>$scope, ':m'=>$marca, ':g'=>$genero,
            ':msg'=>$mensaje, ':cta'=>$cta_text, ':a'=>$activo,
            ':ini'=>$inicia_en, ':exp'=>$expira_en,
        ]);
        echo json_encode(['success'=>true, 'id'=>(int)$pdo->lastInsertId()]);
    }
} catch (PDOException $e) {
    echo json_encode(['success'=>false, 'message'=>$e->getMessage()]);
}
