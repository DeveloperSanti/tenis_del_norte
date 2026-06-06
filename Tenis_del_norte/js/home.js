/* ═══════════════════════════════════════════════════
   home.js — Lógica del index.html
   (estadísticas animadas)
═══════════════════════════════════════════════════ */

const API_BASE = 'api/';

/* ── Contador animado ────────────────────────────── */
function animateCount(id, target, suffix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 50));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current + suffix;
    if (current >= target) clearInterval(timer);
  }, 25);
}

/* ── Aplica campañas activas (misma lógica que catalogo.js) ──
   Un producto cuenta como "en promo" si tiene promocion=1 individual
   o si lo cubre una campaña activa. Prioridad: marca > género > global. */
function applyCampaigns(items, campaigns) {
  if (!campaigns.length) return items;

  const brandMap  = {};
  const genderMap = {};
  let globalCamp  = null;
  campaigns.forEach(c => {
    if      (c.scope === 'brand'  && c.marca)  brandMap[c.marca]   = brandMap[c.marca]   || c;
    else if (c.scope === 'gender' && c.genero) genderMap[c.genero] = genderMap[c.genero] || c;
    else if (c.scope === 'all'    && !globalCamp) globalCamp = c;
  });

  return items.map(item => {
    if (item.promocion == 1 && item.precio_promo) return item;
    if (!item.precio || item.precio <= 0) return item;
    const camp = brandMap[item.marca] || genderMap[item.categoria] || globalCamp;
    if (!camp) return item;
    return { ...item, promocion: 1 };
  });
}

/* ── Cargar estadísticas desde la API ────────────── */
async function loadStats() {
  try {
    const [prodRes, campRes] = await Promise.all([
      fetch(API_BASE + 'get_zapatos.php'),
      fetch(API_BASE + 'get_campaigns.php').catch(() => null),
    ]);
    const products = await prodRes.json();

    if (!Array.isArray(products)) return;

    let campaigns = [];
    if (campRes && campRes.ok) {
      try { campaigns = await campRes.json(); } catch {}
    }

    const items = applyCampaigns(products, Array.isArray(campaigns) ? campaigns : []);

    const totalH = items.filter(z => z.categoria === 'hombre' || z.categoria === 'unisex').length;
    const totalM = items.filter(z => z.categoria === 'mujer'  || z.categoria === 'unisex').length;
    const promos = items.filter(z => z.promocion == 1).length;

    animateCount('statTotal',  items.length);
    animateCount('statHombre', totalH);
    animateCount('statMujer',  totalM);
    animateCount('statPromo',  promos);

  } catch {
    // Si no hay backend, mostrar valores demo
    animateCount('statTotal',  247);
    animateCount('statHombre', 180);
    animateCount('statMujer',  140);
    animateCount('statPromo',  32);
  }
}

/* ── Smooth scroll para los anchor links del nav ─── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-h')) || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ── INIT ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  initSmoothScroll();
});
