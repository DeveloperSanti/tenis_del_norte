<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin · Tenis del Norte</title>
  <link rel="icon" href="/assets/favicon.ico">
  <link rel="stylesheet" href="../styles/global.css"/>
  <link rel="stylesheet" href="../styles/admin.css"/>
</head>
<body>

  <header class="admin-header">
    <!-- Logo idéntico al nav principal -->
    <a href="../index" class="admin-logo-link">
      <img src="../assets/logo.png" alt="Tenis del Norte" class="admin-logo-img"/>
      <span class="admin-logo-text">TENIS <span>DEL NORTE</span></span>
      <span class="admin-badge">Admin</span>
    </a>

    <div class="admin-header-right">
      <a href="../index" class="back-link">← Ver sitio</a>
      <button class="btn-logout" id="btnLogout" type="button">
        Cerrar sesión
      </button>
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
            <option value="Armani">Armani</option>
            <option value="Asics">Asics</option>
            <option value="Converse">Converse</option>
            <option value="Bape">Bape</option>
            <option value="Calvin Klein">Calvin Klein</option>
            <option value="Coach">Coach</option>
            <option value="CQ">CQ</option>
            <option value="Diesel">Diesel</option>
            <option value="Dolce Gabbana">Dolce Gabbana</option>
            <option value="Fila">Fila</option>
            <option value="Gucci">Gucci</option>
            <option value="Hoka">Hoka</option>
            <option value="Jordan">Jordan</option>
            <option value="Le Coq Sportif">Le Coq Sportif</option>
            <option value="Louis Vuitton">Louis Vuitton</option>
            <option value="Off White">Off White</option>
            <option value="Skechers">Skechers</option>
            <option value="Timberland">Timberland</option>
            <option value="Valentino">Valentino</option>
            <option value="Alexander Mcqueen">Alexander Mcqueen</option>
            <option value="Guayos">Guayos</option>
            <option value="Hugo Boss">Hugo Boss</option>
            <option value="Hunder Armour">Hunder Armour</option>
            <option value="Lacoste">Lacoste</option>
            <option value="Polo">Polo</option>
            <option value="Vans">Vans</option>
            <option value="Tommy Hilfiger">Vans</option>
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

      <!-- PRECIO NORMAL -->
      <div class="form-group">
        <label for="precio">Precio normal (COP)</label>
        <div class="price-input-wrap">
          <span class="price-symbol">$</span>
          <input type="number" id="precio" placeholder="180000" min="0" step="1000"/>
        </div>
      </div>

      <!-- TOGGLE PROMO -->
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

      <!-- PRECIO PROMO (se muestra solo si promo está activo) -->
      <div class="form-group promo-price-group hidden" id="promoPriceGroup">
        <label for="precioPromo">Precio en promo (COP) <span class="promo-label-badge">⚡ PROMO</span></label>
        <div class="price-input-wrap promo">
          <span class="price-symbol">$</span>
          <input type="number" id="precioPromo" placeholder="149000" min="0" step="1000"/>
        </div>
        <p class="price-hint">El cliente verá el precio normal tachado y este precio destacado.</p>
      </div>

      <!-- FOTO -->
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

  <!-- MODAL PRECIO PROMO (para toggle desde la lista) -->
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
        <button class="btn-cancel"      id="btnCancelPromo">Cancelar</button>
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
        <a href="./logout.php" class="btn-confirm-del" id="btnConfirmLogout"
           style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
          Sí, salir
        </a>
      </div>
    </div>
  </div>

  <script src="../js/admin.js"></script>
</body>
</html>