<?php
/* ═══════════════════════════════════════════════════
   admin/index.php — Panel de administración
   Protegido por sesión PHP — sin sesión válida → login
═══════════════════════════════════════════════════ */
session_start();

define('SESSION_TIMEOUT', 20 * 60); // 20 minutos (igual que session-guard.js)

/* ── Verificar sesión ─────────────────────────────── */
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: /admin/login');
    exit;
}

/* ── Verificar timeout por inactividad ───────────── */
if (isset($_SESSION['last_activity'])) {
    if ((time() - $_SESSION['last_activity']) > SESSION_TIMEOUT) {
        session_unset();
        session_destroy();
        header('Location: /admin/login?reason=inactivity');
        exit;
    }
}
$_SESSION['last_activity'] = time();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin · Tenis del Norte</title>
  <link rel="icon" href="../assets/favicon.ico"/>
  <link rel="stylesheet" href="../styles/global.css"/>
  <link rel="stylesheet" href="../styles/admin.css"/>
</head>
<body>

  <header class="admin-header">
    <a href="../admin/index.php" class="admin-logo-link">
      <img src="../assets/logo.png" alt="Tenis del Norte" class="admin-logo-img"
           onerror="this.outerHTML='<div class=&quot;nav-logo-badge&quot;>TN</div>'"/>
      <span class="admin-logo-text">TENIS <span>DEL NORTE</span></span>
      <span class="admin-badge">Admin</span>
    </a>
    <div class="admin-header-right">
      <a href="/" class="back-link">← Ver sitio</a>
      <button class="btn-logout" id="btnLogout" type="button">Cerrar sesión</button>
    </div>
  </header>

  <div class="admin-body">

    <!-- ── COLUMNA IZQUIERDA: FORMULARIO ── -->
    <div class="a-card">
      <h2>SUBIR REFERENCIA</h2>

      <div class="info-box">
        <p>
          Si marcas como <strong>Unisex</strong>, aparecerá en Hombre y Mujer.
          Si activas <strong>Promo</strong>, aparecerá un campo para el precio especial.
        </p>
      </div>

      <div class="form-group">
        <label for="referencia">Número de referencia *</label>
        <input type="text" id="referencia" placeholder="Ej: NK-2024 o REF-0042"/>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="marca">Marca *</label>
          <select id="marca">
            <option value="Nike">Nike</option>
            <option value="Adidas">Adidas</option>
            <option value="Puma">Puma</option>
            <option value="New Balance">New Balance</option>
            <option value="Jordan">Jordan</option>
            <option value="Reebok">Reebok</option>
            <option value="Vans">Vans</option>
            <option value="Converse">Converse</option>
            <option value="Otra">Otra</option>
          </select>
        </div>
        <div class="form-group">
          <label for="categoria">Categoría *</label>
          <select id="categoria">
            <option value="hombre">👟 Hombre</option>
            <option value="mujer">👠 Mujer</option>
            <option value="unisex">✦ Unisex (Hombre + Mujer)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="precio">Precio normal (COP)</label>
        <div class="price-input-wrap">
          <span class="price-symbol">$</span>
          <input type="number" id="precio" placeholder="180000" min="0" step="1000"/>
        </div>
      </div>

      <div class="form-group">
        <label>¿Promoción?</label>
        <div class="toggle-row">
          <label class="toggle-switch">
            <input type="checkbox" id="promoToggle"/>
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Marcar como ⚡ Promo</span>
        </div>
      </div>

      <div class="form-group promo-price-group hidden" id="promoPriceGroup">
        <label for="precioPromo">Precio en promo (COP) <span class="promo-label-badge">⚡ PROMO</span></label>
        <div class="price-input-wrap promo">
          <span class="price-symbol">$</span>
          <input type="number" id="precioPromo" placeholder="149000" min="0" step="1000"/>
        </div>
        <p class="price-hint">El cliente verá el precio normal tachado y este precio destacado.</p>
      </div>

      <div class="form-group">
        <label>Foto del tenis *</label>
        <div class="file-drop" id="fileDrop">
          <input type="file" id="fotoInput" accept="image/*"/>
          <div class="file-drop-icon">📸</div>
          <p>Arrastra aquí o <span>haz clic para elegir</span></p>
          <img id="previewImg" alt="Preview"/>
        </div>
      </div>

      <button class="btn-submit" id="submitBtn">Subir al catálogo</button>
      <div class="feedback" id="feedback"></div>
    </div>

    <!-- ── COLUMNA DERECHA: LISTA ── -->
    <div class="a-card">
      <h2>REFERENCIAS EN CATÁLOGO</h2>

      <div class="admin-stats">
        <div class="stat-chip"><div class="n" id="sTotal">—</div><div class="l">Total</div></div>
        <div class="stat-chip"><div class="n" id="sHombre">—</div><div class="l">Hombre</div></div>
        <div class="stat-chip"><div class="n" id="sMujer">—</div><div class="l">Mujer</div></div>
        <div class="stat-chip"><div class="n" id="sUnisex">—</div><div class="l">Unisex</div></div>
        <div class="stat-chip"><div class="n" id="sPromo">—</div><div class="l">Promos</div></div>
      </div>

      <div class="admin-filters">
        <input type="text" id="searchInput" placeholder="🔍 Buscar por referencia, marca o código..."/>
        <select id="filterBrand">
          <option value="all">Todas las marcas</option>
          <option value="Nike">Nike</option>
          <option value="Adidas">Adidas</option>
          <option value="Puma">Puma</option>
          <option value="New Balance">New Balance</option>
          <option value="Jordan">Jordan</option>
          <option value="Reebok">Reebok</option>
          <option value="Vans">Vans</option>
          <option value="Converse">Converse</option>
          <option value="Otra">Otra</option>
        </select>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn-action active" data-filter-cat="all"    style="border-color:var(--gold);color:var(--gold);">Todas</button>
        <button class="btn-action"        data-filter-cat="hombre">👟 Hombre</button>
        <button class="btn-action"        data-filter-cat="mujer" >👠 Mujer</button>
        <button class="btn-action"        data-filter-cat="unisex">✦ Unisex</button>
      </div>

      <div class="zapato-list" id="zapatoList">
        <p class="empty-list">Cargando referencias...</p>
      </div>
    </div>
  </div>

  <!-- MODAL PROMO -->
  <div class="modal-overlay hidden" id="promoModal">
    <div class="modal-box">
      <span class="modal-icon">⚡</span>
      <h3>ACTIVAR PROMO</h3>
      <p id="promoModalRef">Agrega el precio especial para esta referencia.</p>
      <div class="form-group" style="margin-bottom:20px;">
        <label>Precio en promo (COP)</label>
        <div class="price-input-wrap promo">
          <span class="price-symbol">$</span>
          <input type="number" id="promoModalPrice" placeholder="149000" min="0" step="1000"/>
        </div>
        <p class="price-hint" style="margin-top:6px;">Deja vacío si no quieres mostrar precio promo.</p>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnCancelPromo">Cancelar</button>
        <button class="btn-confirm-del" id="btnConfirmPromo"
                style="background:var(--gold);color:var(--navy);box-shadow:0 4px 16px rgba(245,197,24,0.35);">
          Activar promo
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL ELIMINAR -->
  <div class="modal-overlay hidden" id="modalOverlay">
    <div class="modal-box">
      <span class="modal-icon">🗑️</span>
      <h3>ELIMINAR REFERENCIA</h3>
      <p>¿Seguro que quieres eliminar <strong id="deleteRefName"></strong>?<br>
         Esta acción borrará la foto y no se puede deshacer.</p>
      <div class="modal-actions">
        <button class="btn-cancel"      id="btnCancelDelete">Cancelar</button>
        <button class="btn-confirm-del" id="btnConfirmDelete">Sí, eliminar</button>
      </div>
    </div>
  </div>

  <!-- MODAL CERRAR SESIÓN -->
  <div class="modal-overlay hidden" id="logoutModal">
    <div class="modal-box">
      <span class="modal-icon">⏻</span>
      <h3>CERRAR SESIÓN</h3>
      <p>¿Seguro que quieres salir del panel de administración?</p>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnCancelLogout">Quedarme</button>
        <a href="../api/logout.php" class="btn-confirm-del" id="btnConfirmLogout"
           style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
          Sí, salir
        </a>
      </div>
    </div>
  </div>

  <script src="../js/admin.js"></script>
  <script src="../js/session-guard.js"></script>
</body>
</html>
