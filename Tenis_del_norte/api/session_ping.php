<?php
/* ═══════════════════════════════════════════════════
   api/session_ping.php
   El JS del admin llama a este endpoint cada minuto
   para verificar si la sesión sigue activa.
   Si está activa, renueva last_activity.
   Si expiró (> 15 min), destruye y responde expired.
═══════════════════════════════════════════════════ */
session_start();
header('Content-Type: application/json');

define('SESSION_TIMEOUT', 20 * 60); // 15 minutos en segundos

/* ── Sin sesión válida ─────────────────────────── */
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    echo json_encode(['status' => 'expired']);
    exit;
}

/* ── Verificar inactividad ────────────────────── */
if (isset($_SESSION['last_activity'])) {
    $inactivo = time() - $_SESSION['last_activity'];
    if ($inactivo > SESSION_TIMEOUT) {
        session_unset();
        session_destroy();
        echo json_encode(['status' => 'expired', 'reason' => 'timeout']);
        exit;
    }
}

/* ── Sesión válida: renovar timestamp ─────────── */
$_SESSION['last_activity'] = time();
$remaining = SESSION_TIMEOUT - (time() - $_SESSION['last_activity']);

echo json_encode([
    'status'    => 'active',
    'remaining' => $remaining   // segundos restantes (útil para el countdown en JS)
]);
?>
