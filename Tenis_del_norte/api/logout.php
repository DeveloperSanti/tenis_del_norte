<?php
/* ═══════════════════════════════════════
   logout.php — Cierre de sesión admin
═══════════════════════════════════════ */
session_start();
session_unset();
session_destroy();

/* Pasar razón opcional a la página de login */
$reason = isset($_GET['reason']) ? preg_replace('/[^a-z_]/', '', $_GET['reason']) : '';
$redirect = '/admin/login' . ($reason ? '?reason=' . $reason : '');
header('Location: ' . $redirect);
exit;
