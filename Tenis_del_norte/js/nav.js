/* ═══════════════════════════════════════════════════
   nav.js — Navegación + hamburguesa móvil (< 900px)
═══════════════════════════════════════════════════ */

const WA_NUMBER = '573003218196';
const FB_URL    = 'https://web.facebook.com/profile.php?id=61586925837157';

/* Mensaje pre-cargado cuando alguien hace clic en el WA general (no producto) */
const WA_HELP_MSG = encodeURIComponent(
  '¡Hola! 👋 Tengo una consulta sobre el catálogo. ¿Me pueden ayudar? 🙏'
);
const WA_HELP_LINK = `https://wa.me/${WA_NUMBER}?text=${WA_HELP_MSG}`;

const WA_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.847L.057 23.882l6.197-1.624A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 0 1-5.034-1.378l-.361-.214-3.735.979 1.004-3.642-.235-.374A9.855 9.855 0 0 1 2.106 12C2.106 6.53 6.53 2.106 12 2.106c5.469 0 9.894 4.424 9.894 9.894 0 5.469-4.425 9.894-9.894 9.894z"/>
</svg>`;

const FB_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
</svg>`;

const LOGO = 'assets/logo.png';

function getActivePage() {
  const path = window.location.pathname;
  // index.html / raíz = catálogo (es la página principal)
  if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) return 'catalogo';
  if (path.includes('inicio'))  return 'inicio';
  if (path.includes('admin'))   return 'admin';
  return '';
}

/* ── Inyectar NAV ────────────────────────────────── */
function injectNav() {
  const active = getActivePage();

  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="/" class="nav-logo">
      <img src="${LOGO}" alt="TN" class="nav-logo-img"/>
      <span class="nav-logo-text">TENIS <span>DEL NORTE</span></span>
    </a>

    <ul class="nav-links">
      <li><a href="/"               ${active==='catalogo' ?'class="active"':''}>Catálogo</a></li>
      <li><a href="/inicio#quienes"                                            >Nosotros</a></li>
      <li><a href="/inicio#como"                                               >Cómo comprar</a></li>
      <li><a href="/inicio#pagos"                                              >Pagos</a></li>
    </ul>

    <div class="nav-right">
      <a href="${WA_HELP_LINK}" target="_blank" rel="noopener" class="nav-cta">
        WhatsApp
      </a>
      <button class="nav-hamburger" id="navHamburger" aria-label="Abrir menú" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;
  document.body.prepend(nav);

  /* ── Drawer móvil ──────────────────────────────── */
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.id = 'navDrawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="nav-drawer-inner">
      <div class="nav-drawer-header">
        <span class="nav-logo-text" style="font-family:var(--font-d);font-size:18px;letter-spacing:2px;">
          TENIS <span style="color:var(--gold)">DEL NORTE</span>
        </span>
        <button class="nav-drawer-close" id="navDrawerClose" aria-label="Cerrar menú">✕</button>
      </div>
      <ul class="nav-drawer-links">
        <li><a href="/"               ${active==='catalogo' ?'class="active"':''}>Catálogo</a></li>
        <li><a href="/inicio#quienes"                                            >Nosotros</a></li>
        <li><a href="/inicio#como"                                               >Cómo comprar</a></li>
        <li><a href="/inicio#pagos"                                              >Pagos</a></li>
      </ul>
      <a href="${WA_HELP_LINK}" target="_blank" rel="noopener"
         class="btn-wa nav-drawer-wa">
        ${WA_SVG} Escríbenos por WhatsApp
      </a>
    </div>
  `;

  /* Overlay semitransparente */
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.id = 'navOverlay';

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  /* ── Lógica toggle ─────────────────────────────── */
  const hamburger = document.getElementById('navHamburger');

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });

  document.getElementById('navDrawerClose')?.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  /* Cerrar al navegar */
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

  /* Cerrar al agrandar ventana */
  window.addEventListener('resize', () => { if (window.innerWidth >= 900) closeDrawer(); });

  /* Tecla Escape */
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
}

/* ── Inyectar FOOTER ─────────────────────────────── */
function injectFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <div class="footer-inner">

      <!-- Logo + descripción -->
      <div class="footer-logo-wrap">
        <img src="${LOGO}" alt="Tenis del Norte" class="footer-logo-img"/>
        <div class="footer-logo-text">
          <div class="footer-brand">TENIS <span>DEL NORTE</span></div>
          <p>El mejor catálogo de tenis 1.1 de Colombia</p>
        </div>
      </div>

      <!-- Links -->
      <nav class="footer-nav">
        <ul class="nav-links-footer">
          <li><a href="/">Catálogo</a></li>
          <li><a href="/inicio#inicio">Quiénes somos</a></li>
          <li><a href="/inicio#como">Cómo comprar</a></li>
          <li><a href="/inicio#pagos">Pagos</a></li>
        </ul>
      </nav>

      <!-- WhatsApp -->
      <div class="footer-cta">
        <a href="${WA_HELP_LINK}" target="_blank" rel="noopener" class="btn-wa">
          ${WA_SVG} Escríbenos
        </a>
      </div>

    </div>

    <!-- Línea copyright -->
    <div class="footer-bottom">
      <span class="footer-copy">© 2026 Tenis del Norte</span>
      <span class="footer-made">Hecho con ❤️ en Toledo Antioquia</span>
    </div>
  `;
  document.body.appendChild(footer);
}

/* ── Scroll reveal ───────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'fadeUp 0.6s ease both';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── INIT ────────────────────────────────────────── */
/* ── Anuncio dinámico — vinculado a campañas activas ── */
async function injectAnnouncement() {
/* ── Anuncio dinámico — vinculado a campañas activas ── */
async function injectAnnouncement() {
  /* No mostrar en el panel admin */
  if (window.location.pathname.includes('/admin')) return;

  let campaign = null;
  try {
    const res  = await fetch('/api/get_campaigns.php');
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      /* La API ya devuelve ordenado por expira_en ASC → la más urgente primero */
      campaign = data[0];
    }
  } catch { /* sin campañas → no mostrar barra */ }

  if (!campaign) return;
  let campaign = null;
  try {
    const res  = await fetch('/api/get_campaigns.php');
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      /* La API ya devuelve ordenado por expira_en ASC → la más urgente primero */
      campaign = data[0];
    }
  } catch { /* sin campañas → no mostrar barra */ }

  if (!campaign) return;

  /* Clave por campaña: si el usuario cierra una, otra sí aparece */
  const STORAGE_KEY = 'tdn_announce_' + campaign.id;
  /* Clave por campaña: si el usuario cierra una, otra sí aparece */
  const STORAGE_KEY = 'tdn_announce_' + campaign.id;
  if (sessionStorage.getItem(STORAGE_KEY) === 'closed') return;

  const bar = document.createElement('div');
  bar.id = 'announceBar';
  bar.innerHTML = `
    <span class="announce-msg">${campaign.mensaje}</span>
    <a href="/?tab=promo" class="announce-cta">
      ${campaign.cta_text || 'Ver promos'}
    </a>
    <button class="announce-close" id="announceClose" aria-label="Cerrar anuncio">✕</button>
  `;
  document.body.insertBefore(bar, document.body.firstChild);

  document.getElementById('announceClose')?.addEventListener('click', () => {
    bar.style.transform = 'translateY(-100%)';
    setTimeout(() => bar.remove(), 300);
    sessionStorage.setItem(STORAGE_KEY, 'closed');
  });
}

/* ── Botones sociales flotantes (FB + WA) ────────── */
function injectSocialButtons() {
  if (window.location.pathname.includes('/admin')) return;

  const wrap = document.createElement('div');
  wrap.className = 'social-float';
  wrap.innerHTML = `
    <a href="${FB_URL}" target="_blank" rel="noopener"
       class="social-btn fb" aria-label="Facebook">
      ${FB_SVG}
    </a>
    <a href="${WA_HELP_LINK}" target="_blank" rel="noopener"
       class="social-btn wa" aria-label="Escribir por WhatsApp">
      ${WA_SVG}
    </a>
  `;
  document.body.appendChild(wrap);
}

/* ── Scroll-spy: marca la pestaña según la sección visible ── */
function initScrollSpy() {
  /* Solo en inicio.html */
  if (!window.location.pathname.includes('inicio')) return;

  const sections = ['inicio', 'quienes', 'como', 'pagos']
    .map(id => ({ id, el: document.getElementById(id) }))
    .filter(s => s.el);
  if (!sections.length) return;

  /* Mapeo sección → enlaces del nav (desktop + drawer) */
  const linksFor = id => {
    const selector = id === 'inicio'
      ? 'a[href="/inicio"], a[href$="/inicio#inicio"]'
      : `a[href$="#${id}"]`;
    return [
      ...document.querySelectorAll(`.nav-links ${selector}`),
      ...document.querySelectorAll(`.nav-drawer-links ${selector}`),
    ];
  };

  /* Limpia .active de todos los enlaces de secciones (no del Catálogo) */
  const clearActives = () => {
    document.querySelectorAll('.nav-links a, .nav-drawer-links a').forEach(a => {
      if (a.getAttribute('href') === '/') return;
      a.classList.remove('active');
    });
  };

  const observer = new IntersectionObserver(entries => {
    /* Selecciona la sección con mayor proporción visible */
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const id = visible.target.id;
    clearActives();
    linksFor(id).forEach(a => a.classList.add('active'));
  }, {
    rootMargin: '-30% 0px -55% 0px',
    threshold: [0, 0.25, 0.5, 0.75, 1],
  });

  sections.forEach(s => observer.observe(s.el));
}

document.addEventListener('DOMContentLoaded', () => {
  injectAnnouncement();
  injectNav();
  injectFooter();
  injectSocialButtons();
  initScrollReveal();
  initScrollSpy();
});
