<?php
/**
 * get_campaigns.php — Lista campañas
 * Por defecto: solo activas y vigentes (público — para catálogo + anuncio).
 * ?all=1 (con sesión admin): devuelve todas, incluso inactivas/expiradas.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

session_start();
$isAdmin = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
$showAll = $isAdmin && (($_GET['all'] ?? '') === '1');

try {
    if ($showAll) {
        $stmt = $pdo->query(
            "SELECT id, nombre, porcentaje, scope, marca, genero, mensaje, cta_text, activo,
                    inicia_en, expira_en, creado_en
             FROM promo_campaigns
             ORDER BY activo DESC, expira_en DESC"
        );
    } else {
        $stmt = $pdo->prepare(
            "SELECT id, nombre, porcentaje, scope, marca, genero, mensaje, cta_text,
                    inicia_en, expira_en
             FROM promo_campaigns
             WHERE activo = 1
               AND expira_en > NOW()
               AND (inicia_en IS NULL OR inicia_en <= NOW())
             ORDER BY expira_en ASC"
        );
        $stmt->execute();
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['id']         = (int)$r['id'];
        $r['porcentaje'] = (int)$r['porcentaje'];
        if (isset($r['activo'])) $r['activo'] = (int)$r['activo'];
    }
    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
