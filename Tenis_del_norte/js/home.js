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

/* ── Cargar estadísticas desde la API ────────────── */
async function loadStats() {
  try {
    const res   = await fetch(API_BASE + 'get_zapatos.php');
    const items = await res.json();

    if (!Array.isArray(items)) return;

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
