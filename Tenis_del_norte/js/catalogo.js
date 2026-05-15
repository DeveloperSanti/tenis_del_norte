/* ═══════════════════════════════════════════════════
   catalogo.js — Catálogo Tenis del Norte
   Requiere: WA_NUMBER y WA_SVG definidos en nav.js
   (nav.js carga primero en el HTML)
═══════════════════════════════════════════════════ */

const API_BASE = 'api/';
const IMG_BASE = 'uploads/';

const BRAND_COLORS = {
  'Nike':             ['#111827', '#f5c518'],
  'Adidas':           ['#1a1a2e', '#4fc3f7'],
  'Puma':             ['#1a0a0a', '#ff4d6d'],
  'New Balance':      ['#0a1a0a', '#69f0ae'],
  'Jordan':           ['#1a0000', '#ff6b35'],
  'Reebok':           ['#001133', '#00b4d8'],
  'Vans':             ['#1a0a1a', '#e040fb'],
  'Converse':         ['#1a1a00', '#ffeb3b'],
  'Fila':             ['#1a0a0a', '#ff1744'],
  'Asics':            ['#0a1a1a', '#00e676'],
  'Under Armour':     ['#1a1a1a', '#ff9100'],
  'Skechers':         ['#1a1a1a', '#9e9e9e'],
  'Balenciaga':       ['#1a0a0a', '#ff4081'],
  'Gucci':            ['#0a1a0a', '#4caf50'],
  'Prada':            ['#1a1a1a', '#e91e63'],
  'Boss':             ['#1a1a1a', '#00c853'],
  'Lacoste':          ['#1a0a1a', '#76ff03'],
  'Le Coq Sportif':   ['#1a1a00', '#ff5722'],
};

/* ─── PÁGINA ──────────────────────────────────────── */
function isMobile() { return window.innerWidth < 900; }
function pageSize()  { return isMobile() ? 15 : 20; }

/* ── ESTADO ──────────────────────────────────────── */
let allItems     = [];
let currentCat   = 'hombre';
let currentBrand = 'all';
let currentSearch = '';
let visibleCount  = pageSize();

/* ── DOM ─────────────────────────────────────────── */
const gallery     = document.getElementById('gallery');
const emptyState  = document.getElementById('emptyState');
const resultsEl   = document.getElementById('resultsCount');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const loadMoreBtn  = document.getElementById('loadMoreBtn');
const brandSelect  = document.getElementById('brandSelect');
const searchInput  = document.getElementById('catalogSearch');

/* ── Formatear COP ───────────────────────────────── */
function formatCOP(val) {
  if (!val || val <= 0) return null;
  return '$ ' + Number(val).toLocaleString('es-CO');
}

/* ── Precio HTML ─────────────────────────────────── */
function buildPriceHTML(item, size = 'normal') {
  const p  = item.precio;
  const pp = item.precio_promo;
  const isPromo = item.promocion == 1;
  if (!p && !pp) return '';
  if (isPromo && pp) {
    return `<div class="card-price promo ${size}">
      <span class="price-original">${formatCOP(p)}</span>
      <span class="price-promo">${formatCOP(pp)}</span>
    </div>`;
  }
  return `<div class="card-price ${size}">
    <span class="price-normal">${formatCOP(p || pp)}</span>
  </div>`;
}

/* ════════════════════════════════════════════════════
   FETCH
════════════════════════════════════════════════════ */
async function fetchData() {
  showLoader(true);
  try {
    const res  = await fetch(API_BASE + 'get_zapatos.php');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    allItems = Array.isArray(data) ? data : [];
    console.log('✅ BD cargada:', allItems.length, 'referencias');
  } catch (err) {
    console.warn('⚠️ Sin API, usando demo:', err.message);
    allItems = generateDemo();
  }
  showLoader(false);
  updateBrandSelect();
  updateTabCounts();
  resetAndRender();
  deepLinkInit();
}

/* ════════════════════════════════════════════════════
   FILTRADO
════════════════════════════════════════════════════ */
function getFiltered() {
  const q = currentSearch.toLowerCase().trim();
  return allItems.filter(z => {
    const catOk =
      currentCat === 'promo'  ? z.promocion == 1 :
      currentCat === 'hombre' ? (z.categoria === 'hombre' || z.categoria === 'unisex') :
                                (z.categoria === 'mujer'  || z.categoria === 'unisex');
    const brandOk  = currentBrand === 'all' || z.marca === currentBrand;
    const searchOk = !q ||
      z.referencia.toLowerCase().includes(q) ||
      z.marca.toLowerCase().includes(q)      ||
      String(z.id).includes(q);
    return catOk && brandOk && searchOk;
  });
}

/* ════════════════════════════════════════════════════
   RENDER
════════════════════════════════════════════════════ */
function resetAndRender() {
  visibleCount = pageSize();
  render();
}

function render() {
  const all   = getFiltered();
  const slice = all.slice(0, visibleCount);

  /* Render completo: limpiar y reconstruir (cambio de filtros/búsqueda/categoría) */
  gallery.querySelectorAll('.card').forEach(c => c.remove());

  const catLabel   = { hombre: 'Hombre', mujer: 'Mujer', promo: '⚡ Promos' }[currentCat] || '';
  const brandLabel = currentBrand === 'all' ? 'Todas las marcas' : currentBrand;
  const searchLabel = currentSearch ? ` · "${currentSearch}"` : '';

  if (all.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.innerHTML = `
      <span class="emoji">👟</span>
      <p>No hay tenis que coincidan con tu búsqueda.</p>
      <p style="font-size:13px;margin-top:10px;color:var(--muted)">
        Prueba con otra marca o referencia.
      </p>`;
    resultsEl.innerHTML = `<span>0</span> resultados`;
    if (loadMoreWrap) loadMoreWrap.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  resultsEl.innerHTML =
    `<span>${all.length}</span> modelo${all.length !== 1 ? 's' : ''} · ${catLabel} · ${brandLabel}${searchLabel}`;

  appendCards(slice, 0);

  /* Spinner de carga infinita — visible si quedan más items */
  if (loadMoreWrap) {
    loadMoreWrap.classList.toggle('hidden', visibleCount >= all.length);
  }
}

/* Añade tarjetas al final sin tocar las existentes.
   batchOffset = índice dentro del LOTE actual (para el stagger de animación). */
function appendCards(items, batchOffset = 0) {
  const frag = document.createDocumentFragment();
  items.forEach((item, i) => {
    frag.appendChild(buildCard(item, batchOffset + i));
  });
  gallery.appendChild(frag);
}

/* ════════════════════════════════════════════════════
   TARJETA
════════════════════════════════════════════════════ */
function makePlaceholder(marca, referencia) {
  const [bg, fg] = BRAND_COLORS[marca] || ['#111d3a', '#f5c518'];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <rect width="400" height="400" fill="${bg}"/>
      <text x="200" y="175" font-family="serif" font-size="80" fill="${fg}" opacity=".1" text-anchor="middle">👟</text>
      <text x="200" y="235" font-family="sans-serif" font-size="20" fill="${fg}" opacity=".3" font-weight="800" text-anchor="middle">${marca.toUpperCase()}</text>
      <text x="200" y="260" font-family="monospace" font-size="13" fill="${fg}" opacity=".2" text-anchor="middle">${referencia}</text>
    </svg>`
  )}`;
}

function buildCard(item, index) {
  const card = document.createElement('div');
  card.className = 'card' + (item.promocion == 1 ? ' card-promo' : '');
  card.style.animationDelay = `${Math.min(index * 30, 180)}ms`;

  const waMsg  = encodeURIComponent(
    `¡Hola! 👋 Vi este modelo en el catálogo y me interesa.\n\n` +
    `*Marca:* ${item.marca}\n` +
    `*Referencia:* ${item.referencia}\n\n` +
    `¿Está disponible? ¿Qué tallas tienen? 🙏`
  );
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  const rawUrl = item.imagen_url || '';
  const imgSrc = rawUrl ? IMG_BASE + rawUrl.replace('uploads/', '') : makePlaceholder(item.marca, item.referencia);
  const showUnisex = item.categoria === 'unisex' && currentCat !== 'promo';

  card.innerHTML = `
    <span class="badge-id">#${item.id}</span>
    ${item.promocion == 1 ? '<span class="badge-promo">⚡ PROMO</span>' : ''}
    ${showUnisex           ? '<span class="badge-unisex">UNISEX</span>' : ''}
    <img src="${imgSrc}" alt="${item.marca} ${item.referencia}" loading="lazy"/>
    <div class="card-foot">
      <div class="card-foot-left">
        <span class="card-brand">${item.marca}</span>
        <span class="card-ref">${item.referencia}</span>
      </div>
      ${buildPriceHTML(item)}
    </div>
    <div class="card-overlay">
      <a class="wa-card-btn" href="${waLink}" target="_blank" rel="noopener">
        ${WA_SVG} Lo quiero
      </a>
    </div>`;

  card.querySelector('img').addEventListener('click', () => {
    const filtered = getFiltered();
    const idx = filtered.findIndex(z => z.id === item.id);
    openLightbox(item, idx >= 0 ? idx : 0, filtered);
  });

  return card;
}

/* ════════════════════════════════════════════════════
   FILTRO DE MARCAS — select desplegable
════════════════════════════════════════════════════ */
function updateBrandSelect() {
  if (!brandSelect) return;

  /* Marcas disponibles para la categoría actual */
  const itemsForCat = allItems.filter(z => {
    if (currentCat === 'promo')  return z.promocion == 1;
    if (currentCat === 'hombre') return z.categoria === 'hombre' || z.categoria === 'unisex';
    return z.categoria === 'mujer' || z.categoria === 'unisex';
  });
  const brands = [...new Set(itemsForCat.map(z => z.marca))].sort();

  /* Guardar selección antes de reconstruir */
  const prev = brandSelect.value;

  brandSelect.innerHTML = `<option value="all">✦ Todas las marcas</option>`;
  brands.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b; opt.textContent = b;
    if (b === prev) opt.selected = true;
    brandSelect.appendChild(opt);
  });

  /* Si la marca previa ya no está, resetear */
  if (!brands.includes(prev)) {
    currentBrand = 'all';
    brandSelect.value = 'all';
  }
}

/* ════════════════════════════════════════════════════
   TABS
════════════════════════════════════════════════════ */
function initTabs() {
  const tabs = document.querySelectorAll('.main-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCat    = tab.dataset.cat;
      currentBrand  = 'all';
      currentSearch = '';
      if (brandSelect) brandSelect.value = 'all';
      if (searchInput) searchInput.value  = '';
      updateBrandSelect();
      resetAndRender();
    });
  });
}

/* ════════════════════════════════════════════════════
   EVENTOS FILTROS
════════════════════════════════════════════════════ */
function initFilters() {
  /* Búsqueda de texto */
  searchInput?.addEventListener('input', () => {
    currentSearch = searchInput.value;
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !currentSearch);
    resetAndRender();
  });

  /* Limpiar búsqueda */
  document.getElementById('searchClear')?.addEventListener('click', () => {
    currentSearch = '';
    if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    document.getElementById('searchClear')?.classList.add('hidden');
    resetAndRender();
  });

  /* Select de marca */
  brandSelect?.addEventListener('change', () => {
    currentBrand = brandSelect.value;
    resetAndRender();
  });

  /* ── Infinite scroll con IntersectionObserver ───── */
  const sentinel = document.getElementById('infiniteSentinel');
  if (sentinel) {
    let loading = false;
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting || loading) return;
      const all = getFiltered();
      if (visibleCount >= all.length) return;

      loading = true;
      const prevCount = visibleCount;
      const nextCount = Math.min(prevCount + pageSize(), all.length);
      visibleCount = nextCount;

      /* Solo añadir las nuevas tarjetas — las anteriores no se tocan */
      appendCards(all.slice(prevCount, nextCount), 0);

      if (loadMoreWrap) {
        loadMoreWrap.classList.toggle('hidden', visibleCount >= all.length);
      }
      loading = false;
    }, { rootMargin: '400px' });
    io.observe(sentinel);
  }

  /* Actualizar paginación al redimensionar */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { render(); }, 200);
  });
}

function showLoader(show) {
  const loader = document.getElementById('loader');
  if (show) {
    const count = Math.min(pageSize(), 12);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'card-skeleton';
      s.style.animationDelay = `${i * 25}ms`;
      s.innerHTML = `
        <div class="skeleton-img"></div>
        <div class="skeleton-foot">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line price"></div>
        </div>`;
      frag.appendChild(s);
    }
    gallery.appendChild(frag);
    if (loader) loader.classList.add('hidden');
  } else {
    gallery.querySelectorAll('.card-skeleton').forEach(s => s.remove());
    if (loader) loader.classList.add('hidden');
  }
}

/* ════════════════════════════════════════════════════
   CONTADORES EN TABS
════════════════════════════════════════════════════ */
function updateTabCounts() {
  const countH = allItems.filter(z => z.categoria === 'hombre' || z.categoria === 'unisex').length;
  const countM = allItems.filter(z => z.categoria === 'mujer'  || z.categoria === 'unisex').length;
  const countP = allItems.filter(z => z.promocion == 1).length;

  const tH = document.getElementById('tabCountHombre');
  const tM = document.getElementById('tabCountMujer');
  const tP = document.getElementById('tabCountPromo');

  if (tH) tH.textContent = countH;
  if (tM) tM.textContent = countM;
  if (tP) tP.textContent = countP > 0 ? countP : '';
}

/* ════════════════════════════════════════════════════
   DEMO (sin API)
════════════════════════════════════════════════════ */
function generateDemo() {
  const brands  = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Jordan', 'Reebok', 'Vans', 'Converse'];
  const cats    = ['hombre', 'mujer', 'unisex', 'hombre', 'mujer', 'hombre', 'mujer', 'unisex'];
  const precios = [180000, 220000, 150000, 260000, 195000, 310000, 130000, 165000];
  return Array.from({ length: 80 }, (_, i) => ({
    id:           1000 + i + 1,
    referencia:   `REF-${String(i + 1).padStart(4, '0')}`,
    marca:        brands[i % brands.length],
    categoria:    cats[i % cats.length],
    promocion:    i % 7 === 0 ? 1 : 0,
    precio:       precios[i % precios.length],
    precio_promo: i % 7 === 0 ? Math.round(precios[i % precios.length] * 0.8 / 1000) * 1000 : null,
    imagen_url:   null,
  }));
}

/* ════════════════════════════════════════════════════
   LIGHTBOX
════════════════════════════════════════════════════ */
let lbItems = [];
let lbIndex = 0;

const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lbImg');
const lbImgWrap = document.getElementById('lbImgWrap');
const lbMarca   = document.getElementById('lbMarca');
const lbRef     = document.getElementById('lbRef');
const lbBadges  = document.getElementById('lbBadges');
const lbPrice   = document.getElementById('lbPrice');
const lbWaBtn   = document.getElementById('lbWaBtn');
const lbCounter = document.getElementById('lbCounter');
const lbClose   = document.getElementById('lbClose');
const lbPrev    = document.getElementById('lbPrev');
const lbNext    = document.getElementById('lbNext');

function openLightbox(item, index, items) {
  lbItems = items; lbIndex = index;
  fillLightbox(item);
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function fillLightbox(item) {
  const rawUrl = item.imagen_url || '';
  lbImg.src = rawUrl
    ? IMG_BASE + rawUrl.replace('uploads/', '')
    : makePlaceholder(item.marca, item.referencia);
  lbImg.alt = `${item.marca} ${item.referencia}`;
  lbImg.classList.remove('zoomed');

  lbMarca.textContent = item.marca.toUpperCase();
  lbRef.textContent   = `Ref: ${item.referencia}  ·  #${item.id}`;

  if (lbPrice) lbPrice.innerHTML = buildPriceHTML(item, 'large');

  lbBadges.innerHTML = '';
  if (item.promocion == 1)         lbBadges.innerHTML += '<span class="lb-badge promo">⚡ PROMO</span>';
  if (item.categoria === 'unisex') lbBadges.innerHTML += '<span class="lb-badge unisex">UNISEX</span>';

  const precioLinea = item.precio_promo && item.promocion == 1
    ? `*Precio promo:* ${formatCOP(item.precio_promo)}\n`
    : item.precio ? `*Precio:* ${formatCOP(item.precio)}\n` : '';
  const waMsg = encodeURIComponent(
    `¡Hola! 👋 Vi este modelo en el catálogo y me interesa.\n\n` +
    `*Marca:* ${item.marca}\n` +
    `*Referencia:* ${item.referencia}\n` +
    precioLinea +
    `\n¿Está disponible? ¿Qué tallas tienen? 🙏`
  );
  lbWaBtn.href = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  lbCounter.textContent = `${lbIndex + 1} / ${lbItems.length}`;
  lbPrev.classList.toggle('hidden', lbItems.length <= 1);
  lbNext.classList.toggle('hidden', lbItems.length <= 1);

  /* Actualizar URL para que cualquier momento sea compartible */
  const u = new URL(window.location.href);
  u.searchParams.set('ref', item.id);
  window.history.replaceState({}, '', u.pathname + u.search);
}

function closeLightbox() {
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
  lbImg.classList.remove('zoomed');

  /* Limpiar ?ref de la URL al cerrar */
  const u = new URL(window.location.href);
  u.searchParams.delete('ref');
  window.history.replaceState({}, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : ''));
}

lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

lbPrev.addEventListener('click', () => {
  lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length;
  fillLightbox(lbItems[lbIndex]);
});
lbNext.addEventListener('click', () => {
  lbIndex = (lbIndex + 1) % lbItems.length;
  fillLightbox(lbItems[lbIndex]);
});

lbImgWrap.addEventListener('click', e => {
  if (e.target !== lbImg) return;
  const zooming = !lbImg.classList.contains('zoomed');
  lbImg.classList.toggle('zoomed');
  /* Ocultar/mostrar flechas y bloquear cursor según zoom */
  lbPrev.style.display = zooming ? 'none' : '';
  lbNext.style.display = zooming ? 'none' : '';
  lbImgWrap.style.cursor = zooming ? 'zoom-out' : 'zoom-in';
});

document.addEventListener('keydown', e => {
  if (lightbox.classList.contains('hidden')) return;
  if (e.key === 'Escape') {
    if (lbImg.classList.contains('zoomed')) {
      /* Primero deszoomar antes de cerrar */
      lbImg.classList.remove('zoomed');
      lbPrev.style.display = '';
      lbNext.style.display = '';
      lbImgWrap.style.cursor = 'zoom-in';
    } else {
      closeLightbox();
    }
    return;
  }
  /* Flechas solo funcionan sin zoom */
  if (lbImg.classList.contains('zoomed')) return;
  if (e.key === 'ArrowLeft')  lbPrev.click();
  if (e.key === 'ArrowRight') lbNext.click();
});

let touchStartX = 0;
lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend',   e => {
  /* Swipe bloqueado cuando imagen está ampliada */
  if (lbImg.classList.contains('zoomed')) return;
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) diff > 0 ? lbNext.click() : lbPrev.click();
});

/* ════════════════════════════════════════════════════
   COMPARTIR PRODUCTO
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lbShareBtn')?.addEventListener('click', () => {
    const item = lbItems[lbIndex];
    if (!item) return;

    const productUrl  = `${window.location.origin}/?ref=${item.id}`;
    const shareTitle  = `${item.marca} ${item.referencia} · Tenis del Norte`;
    const shareText   = `Mira este ${item.marca} que encontré en Tenis del Norte 🔥\nRef: ${item.referencia}`;

    if (navigator.share) {
      navigator.share({ title: shareTitle, text: shareText, url: productUrl }).catch(() => {});
      return;
    }

    /* Fallback desktop: copiar enlace directo al producto */
    navigator.clipboard.writeText(productUrl).then(() => {
      const btn = document.getElementById('lbShareBtn');
      if (!btn) return;
      const original = btn.innerHTML;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>¡Copiado!</span>`;
      btn.classList.add('copied');
      setTimeout(() => { btn.innerHTML = original; btn.classList.remove('copied'); }, 2500);
    }).catch(() => {
      const waShare = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + productUrl)}`;
      window.open(waShare, '_blank', 'noopener');
    });
  });
});

/* ════════════════════════════════════════════════════
   DEEP LINK — abrir producto directo desde URL ?ref=ID
════════════════════════════════════════════════════ */
function deepLinkInit() {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) return;

  const item = allItems.find(z => String(z.id) === String(ref));
  if (!item) return;

  /* Activar el tab correcto según la categoría del producto */
  const cat = item.categoria === 'mujer' ? 'mujer' : 'hombre';
  currentCat = cat;
  document.querySelectorAll('.main-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.cat === cat);
  });
  updateBrandSelect();
  resetAndRender();

  /* Abrir el lightbox con el producto */
  const filtered = getFiltered();
  const idx = Math.max(0, filtered.findIndex(z => z.id === item.id));
  openLightbox(item, idx, filtered);
}

/* ── INIT ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFilters();
  fetchData();
});
