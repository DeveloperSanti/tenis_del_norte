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
      <button class="btn-campaigns" id="btnCampaigns" type="button">📢 Campañas</button>
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
          <div class="marca-input-wrap">
            <select id="marca">
              <option value="">Cargando marcas…</option>
            </select>
            <button type="button" class="btn-add-marca" id="btnAddMarca" title="Añadir nueva marca">+</button>
          </div>
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

  <!-- MODAL EDITAR PRODUCTO -->
  <div class="modal-overlay hidden" id="editModal">
    <div class="modal-box modal-edit">
      <span class="modal-icon">✏️</span>
      <h3>EDITAR REFERENCIA</h3>
      <p id="editModalRef">Modifica los campos que necesites.</p>

      <div class="form-group">
        <label for="editMarca">Marca</label>
        <select id="editMarca"></select>
      </div>

      <div class="form-group">
        <label for="editCategoria">Categoría</label>
        <select id="editCategoria">
          <option value="hombre">👟 Hombre</option>
          <option value="mujer">👠 Mujer</option>
          <option value="unisex">✦ Unisex (Hombre + Mujer)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="editPrecio">Precio normal (COP)</label>
        <div class="price-input-wrap">
          <span class="price-symbol">$</span>
          <input type="number" id="editPrecio" placeholder="180000" min="0" step="1000"/>
        </div>
      </div>

      <div class="form-group">
        <label>¿Promoción?</label>
        <div class="toggle-row">
          <label class="toggle-switch">
            <input type="checkbox" id="editPromoToggle"/>
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-label">Marcar como ⚡ Promo</span>
        </div>
      </div>

      <div class="form-group promo-price-group hidden" id="editPromoPriceGroup">
        <label for="editPrecioPromo">Precio en promo (COP) <span class="promo-label-badge">⚡ PROMO</span></label>
        <div class="price-input-wrap promo">
          <span class="price-symbol">$</span>
          <input type="number" id="editPrecioPromo" placeholder="149000" min="0" step="1000"/>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel"      id="btnCancelEdit">Cancelar</button>
        <button class="btn-confirm-del" id="btnConfirmEdit"
                style="background:var(--gold);color:var(--navy);box-shadow:0 4px 16px rgba(245,197,24,0.35);">
          Guardar cambios
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL AÑADIR MARCA -->
  <div class="modal-overlay hidden" id="addMarcaModal">
    <div class="modal-box">
      <span class="modal-icon">🏷️</span>
      <h3>NUEVA MARCA</h3>
      <p>Añade una marca que no esté en la lista.</p>
      <div class="form-group" style="margin-bottom:20px;">
        <label for="newMarcaName">Nombre de la marca</label>
        <input type="text" id="newMarcaName" placeholder="Ej: Lacoste" maxlength="100"/>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnCancelMarca">Cancelar</button>
        <button class="btn-confirm-del" id="btnConfirmMarca"
                style="background:var(--gold);color:var(--navy);box-shadow:0 4px 16px rgba(245,197,24,0.35);">
          Añadir
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

  <!-- MODAL CAMPAÑAS MASIVAS -->
  <div class="modal-overlay hidden" id="campaignsModal">
    <div class="modal-box modal-campaigns">
      <button class="modal-close-x" id="btnCloseCampaigns" aria-label="Cerrar">✕</button>
      <span class="modal-icon">📢</span>
      <h3>CAMPAÑAS MASIVAS</h3>
      <p>Aplica un descuento porcentual a todo el catálogo o a una marca específica. El anuncio aparece automáticamente en el sitio.</p>

      <!-- Lista de campañas -->
      <div class="campaigns-list" id="campaignsList">
        <p class="empty-list">Cargando…</p>
      </div>

      <div class="campaigns-divider"></div>

      <!-- Formulario crear / editar -->
      <h4 id="campaignFormTitle" style="font-family:var(--font-d);letter-spacing:2px;color:var(--gold);margin-bottom:14px;">+ NUEVA CAMPAÑA</h4>

      <input type="hidden" id="campaignId" value=""/>

      <div class="form-group">
        <label for="campaignNombre">Nombre interno *</label>
        <input type="text" id="campaignNombre" placeholder="Ej: Black Friday 2026" maxlength="150"/>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="campaignPorcentaje">Descuento % *</label>
          <input type="number" id="campaignPorcentaje" placeholder="10" min="1" max="99"/>
        </div>
        <div class="form-group">
          <label for="campaignScope">Aplica a *</label>
          <select id="campaignScope">
            <option value="all">✦ Todo el catálogo</option>
            <option value="brand">🏷️ Una marca</option>
          </select>
        </div>
      </div>

      <div class="form-group hidden" id="campaignMarcaGroup">
        <label for="campaignMarca">Marca</label>
        <select id="campaignMarca"></select>
      </div>

      <div class="form-group">
        <label for="campaignMensaje">Mensaje del anuncio *</label>
        <textarea id="campaignMensaje" rows="2"
                  placeholder="Ej: 🔥 ¡10% OFF en todo el catálogo este fin de semana!"
                  maxlength="500"></textarea>
        <p class="price-hint">Puedes usar HTML básico: &lt;strong&gt;texto&lt;/strong&gt;</p>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="campaignCta">Texto del botón</label>
          <input type="text" id="campaignCta" placeholder="Ver ahora" maxlength="60"/>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <div class="toggle-row">
            <label class="toggle-switch">
              <input type="checkbox" id="campaignActivo" checked/>
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">Activa</span>
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="campaignInicia">Inicia (opcional)</label>
          <input type="datetime-local" id="campaignInicia"/>
        </div>
        <div class="form-group">
          <label for="campaignExpira">Expira *</label>
          <input type="datetime-local" id="campaignExpira"/>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" id="btnCancelCampaign">Limpiar</button>
        <button class="btn-confirm-del" id="btnSaveCampaign"
                style="background:var(--gold);color:var(--navy);box-shadow:0 4px 16px rgba(245,197,24,0.35);">
          Guardar campaña
        </button>
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
