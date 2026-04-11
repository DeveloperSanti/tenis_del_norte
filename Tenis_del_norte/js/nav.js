/* ═══════════════════════════════════════════════════
   nav.js — Navegación + hamburguesa móvil (< 900px)
═══════════════════════════════════════════════════ */

const WA_NUMBER = '573003218196';

const WA_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.847L.057 23.882l6.197-1.624A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 0 1-5.034-1.378l-.361-.214-3.735.979 1.004-3.642-.235-.374A9.855 9.855 0 0 1 2.106 12C2.106 6.53 6.53 2.106 12 2.106c5.469 0 9.894 4.424 9.894 9.894 0 5.469-4.425 9.894-9.894 9.894z"/>
</svg>`;

const LOGO = 'assets/logo.png';

function getActivePage() {
  const path = window.location.pathname;
  const hash = window.location.hash;

  if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) return 'catalogo';
  
  // Si estamos en inicio.html, verificamos el hash
  if (path.includes('inicio')) {
    if (hash === '#como') return 'como';
    if (hash === '#pagos') return 'pagos';
    return 'inicio'; // Por defecto Quiénes somos
  }
  return '';
}

/* ── Inyectar NAV ────────────────────────────────── */
function injectNav() {
  const active = getActivePage();

  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="index.html" class="nav-logo">
      <img src="${LOGO}" alt="TN" class="nav-logo-img"/>
      <span class="nav-logo-text">TENIS <span>DEL NORTE</span></span>
    </a>

    <ul class="nav-links">
      <li><a href="index.html"      ${active==='catalogo' ?'class="active"':''}     >Catálogo</a></li>
      <li><a href="inicio.html#inicio" ${active==='inicio' ?'class="active"':''}    >Quiénes somos</a></li>
      <li><a href="inicio.html#como" ${active==='como' ?'class="active"':''}        >Cómo comprar</a></li>
      <li><a href="inicio.html#pagos" ${active==='pagos' ?'class="active"':''}      >Pagos</a></li>
    </ul>

    <div class="nav-right">
      <a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener" class="nav-cta">
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
        <li><a href="index.html"      ${active==='catalogo' ?'class="active"':''}>Catálogo</a></li>
        <li><a href="inicio.html#inicio"                                              >Quiénes somos</a></li>
        <li><a href="inicio.html#como"                                                >Cómo comprar</a></li>
        <li><a href="inicio.html#pagos"                                               >Pagos</a></li>
      </ul>
      <a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener"
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
          <li><a href="index.html">Catálogo</a></li>
          <li><a href="inicio.html#inicio">Quiénes somos</a></li>
          <li><a href="inicio.html#como">Cómo comprar</a></li>
          <li><a href="inicio.html#pagos">Pagos</a></li>
        </ul>
      </nav>

      <!-- WhatsApp -->
      <div class="footer-cta">
        <a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener" class="btn-wa">
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
document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  injectFooter();
  initScrollReveal();
});

// Escuchar cambios de hash sin recargar la página
window.addEventListener('hashchange', () => {
  const links = document.querySelectorAll('.nav-links a, .nav-drawer-links a');
  const active = getActivePage();
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    // Si el link contiene el hash activo o es el index
    if (href.includes(window.location.hash) && window.location.hash !== '') {
        link.classList.add('active');
    } else if (active === 'catalogo' && href.includes('index.html')) {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
  });
});