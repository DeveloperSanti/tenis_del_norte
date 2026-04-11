/* ═══════════════════════════════════════════════════
   admin.js — Panel de administración
   admin/index.html → rutas con ../
═══════════════════════════════════════════════════ */

const API      = '../api/';
const IMG_BASE = '../uploads/';

/* ── ESTADO ──────────────────────────────────────── */
let allRefs         = [];
let filterCat       = 'all';
let filterBrand     = 'all';
let pendingDeleteId = null;
let pendingPromoId  = null;

/* ── Formatear COP ───────────────────────────────── */
function formatCOP(val) {
  if (!val || val <= 0) return null;
  return '$ ' + Number(val).toLocaleString('es-CO');
}

/* ── showFeedback ────────────────────────────────── */
function showFeedback(msg, ok) {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  feedback.textContent   = msg;
  feedback.className     = 'feedback ' + (ok ? 'ok' : 'err');
  feedback.style.display = 'block';
  setTimeout(() => { feedback.style.display = 'none'; }, 6000);
}

/* ════════════════════════════════════════════════════
   INIT — todo dentro de DOMContentLoaded
   (evita referencias null al DOM)
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── DOM refs ──────────────────────────────────── */
  const fotoInput       = document.getElementById('fotoInput');
  const previewImg      = document.getElementById('previewImg');
  const fileDrop        = document.getElementById('fileDrop');
  const submitBtn       = document.getElementById('submitBtn');
  const zapatoList      = document.getElementById('zapatoList');
  const modalOverlay    = document.getElementById('modalOverlay');
  const searchInput     = document.getElementById('searchInput');
  const promoToggle     = document.getElementById('promoToggle');
  const promoPriceGroup = document.getElementById('promoPriceGroup');
  const promoModal      = document.getElementById('promoModal');

  /* ════════════════════════════════════════════════
     FORMULARIO: TOGGLE PROMO → mostrar campo precio
  ════════════════════════════════════════════════ */
  promoToggle?.addEventListener('change', () => {
    if (promoToggle.checked) {
      promoPriceGroup?.classList.remove('hidden');
    } else {
      promoPriceGroup?.classList.add('hidden');
      const pp = document.getElementById('precioPromo');
      if (pp) pp.value = '';
    }
  });

  /* ── Preview imagen ────────────────────────────── */
  fotoInput?.addEventListener('change', () => {
    const f = fotoInput.files[0];
    if (f && previewImg) {
      previewImg.src = URL.createObjectURL(f);
      previewImg.style.display = 'block';
    }
  });

  fileDrop?.addEventListener('dragover',  e => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  fileDrop?.addEventListener('dragleave', ()  => fileDrop.classList.remove('drag-over'));
  fileDrop?.addEventListener('drop', e => {
    e.preventDefault();
    fileDrop.classList.remove('drag-over');
    if (fotoInput) {
      fotoInput.files = e.dataTransfer.files;
      fotoInput.dispatchEvent(new Event('change'));
    }
  });

  /* ════════════════════════════════════════════════
     SUBIR REFERENCIA
  ════════════════════════════════════════════════ */
  submitBtn?.addEventListener('click', async () => {
    const referencia  = document.getElementById('referencia')?.value.trim();
    const marca       = document.getElementById('marca')?.value;
    const categoria   = document.getElementById('categoria')?.value;
    const isPromo     = promoToggle?.checked ? 1 : 0;
    const precio      = document.getElementById('precio')?.value.trim();
    const precioPromo = document.getElementById('precioPromo')?.value.trim();
    const foto        = fotoInput?.files[0];

    // Validación front
    if (!referencia) { showFeedback('⚠️ Ingresa el número de referencia.', false); return; }
    if (!foto)       { showFeedback('⚠️ Selecciona una foto antes de subir.', false); return; }

    const fd = new FormData();
    fd.append('referencia',   referencia);
    fd.append('marca',        marca);
    fd.append('categoria',    categoria);
    fd.append('promocion',    isPromo);
    fd.append('precio',       precio || '');
    fd.append('precio_promo', (isPromo && precioPromo) ? precioPromo : '');
    fd.append('foto',         foto);

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Subiendo...';

    try {
      const res  = await fetch(API + 'upload.php', { method: 'POST', body: fd });

      // Detectar respuesta no-JSON (error de servidor/PHP)
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Respuesta del servidor:', text);
        showFeedback('❌ Error en el servidor. Revisa la consola (F12) para ver el detalle.', false);
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Subir al catálogo';
        return;
      }

      if (data.success) {
        showFeedback(`✅ Referencia "${referencia}" subida con código #${data.id}`, true);
        // Limpiar formulario
        document.getElementById('referencia').value  = '';
        const precioEl = document.getElementById('precio');
        const ppEl     = document.getElementById('precioPromo');
        if (precioEl) precioEl.value = '';
        if (ppEl)     ppEl.value     = '';
        if (fotoInput)   fotoInput.value = '';
        if (previewImg)  previewImg.style.display = 'none';
        if (promoToggle) promoToggle.checked = false;
        promoPriceGroup?.classList.add('hidden');
        loadList();
      } else {
        showFeedback('❌ ' + data.message, false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showFeedback('❌ No se pudo conectar con el servidor. ¿Está XAMPP corriendo?', false);
    }

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Subir al catálogo';
  });

  /* ════════════════════════════════════════════════
     LISTA
  ════════════════════════════════════════════════ */
  async function loadList() {
    if (zapatoList) zapatoList.innerHTML = '<p class="empty-list">Cargando...</p>';
    try {
      const res  = await fetch(API + 'get_zapatos.php');
      const data = await res.json();
      allRefs = Array.isArray(data) ? data : [];
    } catch {
      allRefs = [];
      if (zapatoList) zapatoList.innerHTML = '<p class="empty-list">Error cargando referencias.</p>';
      return;
    }
    updateStats();
    renderList();
  }

  function updateStats() {
    const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    s('sTotal',  allRefs.length);
    s('sHombre', allRefs.filter(z => z.categoria === 'hombre').length);
    s('sMujer',  allRefs.filter(z => z.categoria === 'mujer').length);
    s('sUnisex', allRefs.filter(z => z.categoria === 'unisex').length);
    s('sPromo',  allRefs.filter(z => z.promocion == 1).length);
  }

  function getListFiltered() {
    const search = (searchInput?.value || '').toLowerCase().trim();
    return allRefs.filter(z => {
      const catOk   = filterCat   === 'all' || z.categoria === filterCat;
      const brandOk = filterBrand === 'all' || z.marca     === filterBrand;
      const searchOk = !search ||
        z.referencia.toLowerCase().includes(search) ||
        z.marca.toLowerCase().includes(search) ||
        String(z.id).includes(search);
      return catOk && brandOk && searchOk;
    });
  }

  function renderList() {
    if (!zapatoList) return;
    const items = getListFiltered();
    if (!items.length) {
      zapatoList.innerHTML = '<p class="empty-list">Sin referencias que coincidan 👟</p>';
      return;
    }

    const fallbackSVG = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='52' height='52'><rect width='52' height='52' fill='%231c2f5e'/><text x='26' y='34' font-size='22' text-anchor='middle'>👟</text></svg>`;

    zapatoList.innerHTML = items.map(z => {
      const rawImg = z.imagen_url || '';
      const imgSrc = rawImg ? IMG_BASE + rawImg.replace('uploads/', '') : fallbackSVG;

      let precioHTML = '';
      if (z.precio) {
        if (z.promocion == 1 && z.precio_promo) {
          precioHTML = `
            <span class="z-precio-original">${formatCOP(z.precio)}</span>
            <span class="z-precio-promo">${formatCOP(z.precio_promo)}</span>`;
        } else {
          precioHTML = `<span class="z-precio">${formatCOP(z.precio)}</span>`;
        }
      }

      return `
      <div class="zapato-row" data-id="${z.id}">
        <img class="zapato-thumb" src="${imgSrc}" alt="${z.marca}"
             onerror="this.src='${fallbackSVG}'"/>
        <div class="zapato-info">
          <div class="z-top">
            <span class="z-marca">${z.marca}</span>
            <span class="z-ref">${z.referencia}</span>
          </div>
          <div class="z-meta">
            <span class="z-tag ${z.categoria}">${z.categoria}</span>
            ${z.promocion == 1 ? '<span class="z-tag promo">⚡ promo</span>' : ''}
            <span style="font-size:10px;color:var(--muted);font-family:monospace;">#${z.id}</span>
          </div>
          ${precioHTML ? `<div class="z-precios">${precioHTML}</div>` : ''}
        </div>
        <div class="row-actions">
          <button class="btn-action btn-promo"
                  onclick="handleTogglePromo(${z.id}, ${z.promocion}, '${z.referencia.replace(/'/g,"\\'")}', ${z.precio||0})">
            ${z.promocion == 1 ? '⚡ Quitar promo' : '+ Promo'}
          </button>
          <button class="btn-action btn-del"
                  onclick="confirmDelete(${z.id}, '${z.referencia.replace(/'/g,"\\'")}')">
            Eliminar
          </button>
        </div>
      </div>`;
    }).join('');
  }

  /* Filtros categoría */
  document.querySelectorAll('[data-filter-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-cat]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterCat = btn.dataset.filterCat;
      renderList();
    });
  });

  /* Filtro marca */
  document.getElementById('filterBrand')?.addEventListener('change', e => {
    filterBrand = e.target.value; renderList();
  });

  /* Búsqueda */
  searchInput?.addEventListener('input', () => renderList());

  /* ════════════════════════════════════════════════
     TOGGLE PROMO CON MODAL
  ════════════════════════════════════════════════ */

  // Exponer globalmente porque viene de onclick inline
  window.handleTogglePromo = function(id, currentPromo, ref, precioNormal) {
    if (currentPromo == 1) {
      doTogglePromo(id, 0, null);
    } else {
      pendingPromoId = id;
      const refEl = document.getElementById('promoModalRef');
      if (refEl) {
        refEl.innerHTML = `<strong style="color:var(--gold)">${ref}</strong> · Precio normal: ${precioNormal ? formatCOP(precioNormal) : 'sin precio'}`;
      }
      const ppInput = document.getElementById('promoModalPrice');
      if (ppInput) ppInput.value = '';
      promoModal?.classList.remove('hidden');
    }
  };

  document.getElementById('btnCancelPromo')?.addEventListener('click', () => {
    pendingPromoId = null;
    promoModal?.classList.add('hidden');
  });

  document.getElementById('btnConfirmPromo')?.addEventListener('click', () => {
    const pp = document.getElementById('promoModalPrice')?.value.trim();
    promoModal?.classList.add('hidden');
    doTogglePromo(pendingPromoId, 1, pp || null);
    pendingPromoId = null;
  });

  async function doTogglePromo(id, newPromo, precio_promo) {
    const fd = new FormData();
    fd.append('id',        id);
    fd.append('promocion', newPromo);
    if (precio_promo) fd.append('precio_promo', precio_promo);
    try {
      const res  = await fetch(API + 'toggle_promo.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) loadList();
      else showFeedback('❌ Error: ' + data.message, false);
    } catch { showFeedback('❌ Error de conexión.', false); }
  }

  /* ════════════════════════════════════════════════
     ELIMINAR
  ════════════════════════════════════════════════ */

  window.confirmDelete = function(id, ref) {
    pendingDeleteId = id;
    const el = document.getElementById('deleteRefName');
    if (el) el.textContent = `"${ref}" (#${id})`;
    modalOverlay?.classList.remove('hidden');
  };

  document.getElementById('btnCancelDelete')?.addEventListener('click', () => {
    pendingDeleteId = null;
    modalOverlay?.classList.add('hidden');
  });

  document.getElementById('btnConfirmDelete')?.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    modalOverlay?.classList.add('hidden');
    const fd = new FormData();
    fd.append('id', pendingDeleteId);
    try {
      const res  = await fetch(API + 'delete.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { showFeedback(`✅ Referencia #${pendingDeleteId} eliminada.`, true); loadList(); }
      else showFeedback('❌ Error: ' + data.message, false);
    } catch { showFeedback('❌ Error de conexión.', false); }
    pendingDeleteId = null;
  });

  modalOverlay?.addEventListener('click', e => {
    if (e.target === modalOverlay) { pendingDeleteId = null; modalOverlay.classList.add('hidden'); }
  });
  promoModal?.addEventListener('click', e => {
    if (e.target === promoModal) { pendingPromoId = null; promoModal.classList.add('hidden'); }
  });

  /* ── INIT ────────────────────────────────────────── */
  loadList();

  /* ════════════════════════════════════════════════
     MODAL CERRAR SESIÓN
  ════════════════════════════════════════════════ */
  const logoutModal      = document.getElementById('logoutModal');
  const btnLogout        = document.getElementById('btnLogout');
  const btnCancelLogout  = document.getElementById('btnCancelLogout');

  btnLogout?.addEventListener('click', () => {
    logoutModal?.classList.remove('hidden');
  });

  btnCancelLogout?.addEventListener('click', () => {
    logoutModal?.classList.add('hidden');
  });

  // Cerrar al hacer click en el overlay (fuera del modal-box)
  logoutModal?.addEventListener('click', e => {
    if (e.target === logoutModal) logoutModal.classList.add('hidden');
  });

  // Cerrar con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !logoutModal?.classList.contains('hidden')) {
      logoutModal.classList.add('hidden');
    }
  });

}); // fin DOMContentLoaded