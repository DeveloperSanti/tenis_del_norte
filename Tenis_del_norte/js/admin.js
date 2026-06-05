/* ═══════════════════════════════════════════════════
   admin.js — Panel de administración
   admin/index.html → rutas con ../
═══════════════════════════════════════════════════ */

const API      = '../api/';
const IMG_BASE = '../uploads/';

/* ── ESTADO ──────────────────────────────────────── */
let allRefs         = [];
let allMarcas       = [];
let filterCat       = 'all';
let filterBrand     = 'all';
let pendingDeleteId = null;
let pendingPromoId  = null;
let pendingEditId   = null;

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
  const editModal       = document.getElementById('editModal');
  const addMarcaModal   = document.getElementById('addMarcaModal');
  const marcaSelect     = document.getElementById('marca');
  const filterBrandEl   = document.getElementById('filterBrand');

  /* ════════════════════════════════════════════════
     MARCAS — cargar desde BD y poblar selects
  ════════════════════════════════════════════════ */
  async function loadMarcas() {
    try {
      const res  = await fetch(API + 'get_marcas.php');
      const data = await res.json();
      allMarcas  = Array.isArray(data) ? data : [];
    } catch {
      allMarcas = [];
    }
    populateMarcaSelects();
  }

  function populateMarcaSelects() {
    /* Select de alta */
    if (marcaSelect) {
      marcaSelect.innerHTML = allMarcas.length
        ? allMarcas.map(m => `<option value="${m.nombre}">${m.nombre}</option>`).join('')
        : '<option value="">Sin marcas — añade una con el botón +</option>';
    }
    /* Filtro de la lista */
    if (filterBrandEl) {
      const prev = filterBrandEl.value;
      filterBrandEl.innerHTML =
        '<option value="all">Todas las marcas</option>' +
        allMarcas.map(m => `<option value="${m.nombre}">${m.nombre}</option>`).join('');
      filterBrandEl.value = prev || 'all';
    }
    /* Select del modal de edición */
    const editMarca = document.getElementById('editMarca');
    if (editMarca) {
      editMarca.innerHTML = allMarcas.map(m => `<option value="${m.nombre}">${m.nombre}</option>`).join('');
    }
  }

  /* Botón + para añadir marca → abre modal */
  document.getElementById('btnAddMarca')?.addEventListener('click', () => {
    const input = document.getElementById('newMarcaName');
    if (input) input.value = '';
    addMarcaModal?.classList.remove('hidden');
    setTimeout(() => input?.focus(), 50);
  });

  document.getElementById('btnCancelMarca')?.addEventListener('click', () => {
    addMarcaModal?.classList.add('hidden');
  });

  document.getElementById('btnConfirmMarca')?.addEventListener('click', async () => {
    const nombre = document.getElementById('newMarcaName')?.value.trim();
    if (!nombre) { showFeedback('⚠️ Escribe el nombre de la marca.', false); return; }

    const fd = new FormData();
    fd.append('nombre', nombre);
    try {
      const res  = await fetch(API + 'add_marca.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        addMarcaModal?.classList.add('hidden');
        await loadMarcas();
        /* Auto-seleccionar la marca recién creada en el form de alta */
        if (marcaSelect) marcaSelect.value = data.nombre;
        showFeedback(`✅ Marca "${data.nombre}" añadida.`, true);
      } else {
        showFeedback('❌ ' + data.message, false);
      }
    } catch {
      showFeedback('❌ Error de conexión.', false);
    }
  });

  addMarcaModal?.addEventListener('click', e => {
    if (e.target === addMarcaModal) addMarcaModal.classList.add('hidden');
  });

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
    const marca       = document.getElementById('marca')?.value;
    const categoria   = document.getElementById('categoria')?.value;
    const isPromo     = promoToggle?.checked ? 1 : 0;
    const precio      = document.getElementById('precio')?.value.trim();
    const precioPromo = document.getElementById('precioPromo')?.value.trim();
    const foto        = fotoInput?.files[0];

    // Validación front (la referencia se genera sola en el servidor)
    if (!marca) { showFeedback('⚠️ Selecciona una marca.', false); return; }
    if (!foto)  { showFeedback('⚠️ Selecciona una foto antes de subir.', false); return; }

    const fd = new FormData();
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
        showFeedback(`✅ Subido como ${data.referencia} (#${data.id})`, true);
        // Limpiar formulario
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
      const rawImg = z.thumb_url || z.imagen_url || '';
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
             loading="lazy" decoding="async" width="52" height="52"
             onerror="this.onerror=null;this.src='${fallbackSVG}'"/>
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
          <button class="btn-action btn-edit"
                  onclick="openEditModal(${z.id})">
            ✏️ Editar
          </button>
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
     EDITAR PRODUCTO
  ════════════════════════════════════════════════ */
  const editMarcaSel    = document.getElementById('editMarca');
  const editCategoriaSel = document.getElementById('editCategoria');
  const editPrecioInput  = document.getElementById('editPrecio');
  const editPromoToggle  = document.getElementById('editPromoToggle');
  const editPromoGroup   = document.getElementById('editPromoPriceGroup');
  const editPrecioPromo  = document.getElementById('editPrecioPromo');

  editPromoToggle?.addEventListener('change', () => {
    if (editPromoToggle.checked) {
      editPromoGroup?.classList.remove('hidden');
    } else {
      editPromoGroup?.classList.add('hidden');
      if (editPrecioPromo) editPrecioPromo.value = '';
    }
  });

  window.openEditModal = function(id) {
    const z = allRefs.find(r => r.id === id);
    if (!z) return;
    pendingEditId = id;

    /* Asegurar que el select de marca está poblado */
    if (editMarcaSel) {
      if (!editMarcaSel.options.length) populateMarcaSelects();
      /* Si la marca actual no está en el listado, añadirla temporalmente */
      if (![...editMarcaSel.options].some(o => o.value === z.marca)) {
        const opt = document.createElement('option');
        opt.value = z.marca; opt.textContent = z.marca;
        editMarcaSel.appendChild(opt);
      }
      editMarcaSel.value = z.marca;
    }
    if (editCategoriaSel) editCategoriaSel.value = z.categoria;
    if (editPrecioInput)  editPrecioInput.value  = z.precio || '';
    if (editPromoToggle)  editPromoToggle.checked = z.promocion == 1;
    if (editPrecioPromo)  editPrecioPromo.value  = z.precio_promo || '';
    editPromoGroup?.classList.toggle('hidden', !(z.promocion == 1));

    const refEl = document.getElementById('editModalRef');
    if (refEl) {
      refEl.innerHTML = `Editando <strong style="color:var(--gold)">${z.referencia}</strong> · #${z.id}`;
    }
    editModal?.classList.remove('hidden');
  };

  document.getElementById('btnCancelEdit')?.addEventListener('click', () => {
    pendingEditId = null;
    editModal?.classList.add('hidden');
  });

  document.getElementById('btnConfirmEdit')?.addEventListener('click', async () => {
    if (!pendingEditId) return;

    const isPromo = editPromoToggle?.checked ? 1 : 0;
    const fd = new FormData();
    fd.append('id',           pendingEditId);
    fd.append('marca',        editMarcaSel?.value || '');
    fd.append('categoria',    editCategoriaSel?.value || '');
    fd.append('precio',       editPrecioInput?.value.trim() || '');
    fd.append('promocion',    isPromo);
    if (isPromo) fd.append('precio_promo', editPrecioPromo?.value.trim() || '');

    try {
      const res  = await fetch(API + 'update_tenis.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        editModal?.classList.add('hidden');
        showFeedback(`✅ Referencia #${pendingEditId} actualizada.`, true);
        pendingEditId = null;
        loadList();
      } else {
        showFeedback('❌ ' + data.message, false);
      }
    } catch {
      showFeedback('❌ Error de conexión.', false);
    }
  });

  editModal?.addEventListener('click', e => {
    if (e.target === editModal) { pendingEditId = null; editModal.classList.add('hidden'); }
  });

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
  loadMarcas().then(() => loadList());

  /* ════════════════════════════════════════════════
     CAMPAÑAS MASIVAS
  ════════════════════════════════════════════════ */
  const campaignsModal = document.getElementById('campaignsModal');
  const btnCampaigns   = document.getElementById('btnCampaigns');
  const campaignsList  = document.getElementById('campaignsList');
  const campaignScope  = document.getElementById('campaignScope');
  const campaignMarcaGroup  = document.getElementById('campaignMarcaGroup');
  const campaignMarcaSel    = document.getElementById('campaignMarca');
  const campaignGeneroGroup = document.getElementById('campaignGeneroGroup');
  const campaignGeneroSel   = document.getElementById('campaignGenero');

  btnCampaigns?.addEventListener('click', () => {
    populateCampaignMarcas();
    resetCampaignForm();
    loadCampaigns();
    campaignsModal?.classList.remove('hidden');
  });
  document.getElementById('btnCloseCampaigns')?.addEventListener('click', () => {
    campaignsModal?.classList.add('hidden');
  });
  campaignsModal?.addEventListener('click', e => {
    if (e.target === campaignsModal) campaignsModal.classList.add('hidden');
  });

  function populateCampaignMarcas() {
    if (!campaignMarcaSel) return;
    campaignMarcaSel.innerHTML = allMarcas.map(m =>
      `<option value="${m.nombre}">${m.nombre}</option>`
    ).join('');
  }

  function syncScopeFields() {
    campaignMarcaGroup?.classList.toggle('hidden',  campaignScope.value !== 'brand');
    campaignGeneroGroup?.classList.toggle('hidden', campaignScope.value !== 'gender');
  }
  campaignScope?.addEventListener('change', syncScopeFields);

  function resetCampaignForm() {
    const ids = ['campaignId','campaignNombre','campaignPorcentaje','campaignMensaje',
                 'campaignCta','campaignInicia','campaignExpira'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    if (campaignScope) campaignScope.value = 'all';
    syncScopeFields();
    const activo = document.getElementById('campaignActivo');
    if (activo) activo.checked = true;
    const title = document.getElementById('campaignFormTitle');
    if (title) title.textContent = '+ NUEVA CAMPAÑA';
  }

  async function loadCampaigns() {
    if (!campaignsList) return;
    campaignsList.innerHTML = '<p class="empty-list">Cargando…</p>';
    try {
      const res  = await fetch(API + 'get_campaigns.php?all=1', { credentials: 'same-origin' });
      const data = await res.json();
      renderCampaigns(Array.isArray(data) ? data : []);
    } catch {
      campaignsList.innerHTML = '<p class="empty-list">Error cargando campañas.</p>';
    }
  }

  function renderCampaigns(items) {
    if (!items.length) {
      campaignsList.innerHTML = '<p class="empty-list">Sin campañas todavía. Crea la primera abajo 👇</p>';
      return;
    }
    const fmtDate = s => s ? new Date(s.replace(' ', 'T')).toLocaleString('es-CO',
      { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
    const now = new Date();

    campaignsList.innerHTML = items.map(c => {
      const expired = c.expira_en && new Date(c.expira_en.replace(' ', 'T')) < now;
      const status  = !c.activo ? 'pausada' : expired ? 'expirada' : 'activa';
      const scopeText =
        c.scope === 'brand'  ? `🏷️ ${c.marca}` :
        c.scope === 'gender' ? `⚥ ${c.genero === 'mujer' ? 'Mujer' : 'Hombre'}` :
        '✦ Todo el catálogo';
      return `
      <div class="campaign-row" data-id="${c.id}">
        <div class="campaign-info">
          <div class="campaign-top">
            <span class="campaign-name">${c.nombre}</span>
            <span class="campaign-pct">${c.porcentaje}% OFF</span>
            <span class="campaign-status ${status}">${status}</span>
          </div>
          <div class="campaign-meta">
            <span>${scopeText}</span>
            <span>· Expira: ${fmtDate(c.expira_en)}</span>
          </div>
          <div class="campaign-msg">${c.mensaje}</div>
        </div>
        <div class="row-actions">
          <button class="btn-action btn-edit" onclick="editCampaign(${c.id})">✏️ Editar</button>
          <button class="btn-action btn-del"  onclick="deleteCampaign(${c.id})">Eliminar</button>
        </div>
      </div>`;
    }).join('');
  }

  window.editCampaign = async function(id) {
    try {
      const res  = await fetch(API + 'get_campaigns.php?all=1', { credentials: 'same-origin' });
      const data = await res.json();
      const c = data.find(x => x.id === id);
      if (!c) return showFeedback('❌ Campaña no encontrada.', false);

      document.getElementById('campaignId').value         = c.id;
      document.getElementById('campaignNombre').value     = c.nombre;
      document.getElementById('campaignPorcentaje').value = c.porcentaje;
      campaignScope.value                                  = c.scope;
      syncScopeFields();
      if (c.scope === 'brand')  campaignMarcaSel.value  = c.marca  || '';
      if (c.scope === 'gender') campaignGeneroSel.value = c.genero || 'hombre';
      document.getElementById('campaignMensaje').value = c.mensaje;
      document.getElementById('campaignCta').value     = c.cta_text || '';
      document.getElementById('campaignActivo').checked = c.activo == 1;
      document.getElementById('campaignInicia').value  = c.inicia_en ? c.inicia_en.replace(' ', 'T').slice(0, 16) : '';
      document.getElementById('campaignExpira').value  = c.expira_en ? c.expira_en.replace(' ', 'T').slice(0, 16) : '';

      const title = document.getElementById('campaignFormTitle');
      if (title) title.textContent = `✏️ EDITANDO #${c.id}`;
      campaignsModal?.querySelector('.modal-box')?.scrollTo({ top: 99999, behavior: 'smooth' });
    } catch {
      showFeedback('❌ Error cargando la campaña.', false);
    }
  };

  window.deleteCampaign = async function(id) {
    if (!confirm('¿Eliminar esta campaña? Esta acción no se puede deshacer.')) return;
    const fd = new FormData();
    fd.append('id', id);
    try {
      const res  = await fetch(API + 'delete_campaign.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        showFeedback(`✅ Campaña eliminada.`, true);
        loadCampaigns();
      } else {
        showFeedback('❌ ' + data.message, false);
      }
    } catch { showFeedback('❌ Error de conexión.', false); }
  };

  document.getElementById('btnCancelCampaign')?.addEventListener('click', resetCampaignForm);

  document.getElementById('btnSaveCampaign')?.addEventListener('click', async () => {
    const fd = new FormData();
    const id = document.getElementById('campaignId').value.trim();
    if (id) fd.append('id', id);
    fd.append('nombre',     document.getElementById('campaignNombre').value.trim());
    fd.append('porcentaje', document.getElementById('campaignPorcentaje').value.trim());
    fd.append('scope',      campaignScope.value);
    if (campaignScope.value === 'brand')  fd.append('marca',  campaignMarcaSel.value);
    if (campaignScope.value === 'gender') fd.append('genero', campaignGeneroSel.value);
    fd.append('mensaje',    document.getElementById('campaignMensaje').value.trim());
    fd.append('cta_text',   document.getElementById('campaignCta').value.trim());
    fd.append('activo',     document.getElementById('campaignActivo').checked ? 1 : 0);
    fd.append('inicia_en',  document.getElementById('campaignInicia').value);
    fd.append('expira_en',  document.getElementById('campaignExpira').value);

    try {
      const res  = await fetch(API + 'save_campaign.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        showFeedback(`✅ Campaña ${id ? 'actualizada' : 'creada'}.`, true);
        resetCampaignForm();
        loadCampaigns();
      } else {
        showFeedback('❌ ' + data.message, false);
      }
    } catch { showFeedback('❌ Error de conexión.', false); }
  });

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
