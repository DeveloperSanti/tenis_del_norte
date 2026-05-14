/* ═══════════════════════════════════════════════════
   js/session-guard.js — Seguridad de sesión admin
   
   Protecciones:
   1. Cierre por inactividad (15 min sin interacción)
   2. Cierre al salir de la pestaña del admin
   3. Ping al servidor cada 60s para validar sesión
   4. Advertencia a los 12 min (3 min antes)
═══════════════════════════════════════════════════ */

(function SessionGuard() {

  /* ── CONFIG ────────────────────────────────────── */
  const TIMEOUT_MS      = 20 * 60 * 1000;   // 15 minutos
  const WARNING_MS      = 17 * 60 * 1000;   // advertencia a los 12 min
  const PING_INTERVAL   = 60 * 1000;        // ping cada 1 min
  const LOGOUT_URL      = '../api/logout.php';
  const PING_URL        = '../api/session_ping.php';

  /* ── ESTADO ────────────────────────────────────── */
  let inactivityTimer  = null;
  let warningTimer     = null;
  let pingInterval     = null;
  let warningShown     = false;
  let isLoggingOut     = false;

  /* ── EVENTOS QUE CUENTAN COMO ACTIVIDAD ────────── */
  const ACTIVITY_EVENTS = [
    'mousemove', 'mousedown', 'keydown',
    'touchstart', 'scroll', 'click'
  ];

  /* ══════════════════════════════════════════════════
     LOGOUT
  ══════════════════════════════════════════════════ */
  function logout(reason) {
    if (isLoggingOut) return;
    isLoggingOut = true;

    clearTimers();

    /* Guardar motivo para mostrarlo en el login */
    try {
      sessionStorage.setItem('logout_reason', reason);
    } catch (_) {}

    /* Pasar razón al logout para mostrarlo en el login */
    window.location.href = LOGOUT_URL + '?reason=' + encodeURIComponent(reason);
  }

  /* ══════════════════════════════════════════════════
     TIMERS
  ══════════════════════════════════════════════════ */
  function clearTimers() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    clearInterval(pingInterval);
  }

  function resetTimers() {
    if (isLoggingOut) return;

    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);

    /* Ocultar advertencia si estaba visible */
    if (warningShown) hideWarning();

    /* Advertencia a los 12 min */
    warningTimer = setTimeout(showWarning, WARNING_MS);

    /* Logout a los 15 min */
    inactivityTimer = setTimeout(() => {
      logout('inactivity');
    }, TIMEOUT_MS);
  }

  /* ══════════════════════════════════════════════════
     BANNER DE ADVERTENCIA
  ══════════════════════════════════════════════════ */
  function createWarningBanner() {
    if (document.getElementById('sg-warning')) return;

    const banner = document.createElement('div');
    banner.id = 'sg-warning';
    banner.innerHTML = `
      <div id="sg-warning-inner">
        <span id="sg-warning-icon">⏱️</span>
        <div id="sg-warning-text">
          <strong>¿Sigues ahí?</strong>
          <span>La sesión cerrará en <strong id="sg-countdown">3:00</strong> por inactividad.</span>
        </div>
        <button id="sg-warning-btn">Continuar</button>
      </div>
    `;

    Object.assign(banner.style, {
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%) translateY(120%)',
      zIndex: '9999',
      background: 'rgba(20,35,75,0.97)',
      border: '1px solid rgba(245,197,24,0.4)',
      borderRadius: '16px',
      padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
      minWidth: '320px', maxWidth: '90vw',
      fontFamily: 'var(--font-b, sans-serif)',
    });

    const inner = banner.querySelector('#sg-warning-inner');
    Object.assign(inner.style, {
      display: 'flex', alignItems: 'center', gap: '12px',
    });

    banner.querySelector('#sg-warning-icon').style.fontSize = '24px';

    const textDiv = banner.querySelector('#sg-warning-text');
    Object.assign(textDiv.style, {
      flex: '1', fontSize: '13px', color: '#c5d0f0', lineHeight: '1.5',
    });
    textDiv.querySelector('strong').style.color = '#f0f4ff';
    textDiv.querySelector('strong').style.display = 'block';

    const btn = banner.querySelector('#sg-warning-btn');
    Object.assign(btn.style, {
      background: 'var(--gold, #f5c518)', color: '#1e2f58',
      border: 'none', borderRadius: '100px',
      padding: '8px 18px', cursor: 'pointer',
      fontWeight: '800', fontSize: '12px',
      letterSpacing: '0.5px', whiteSpace: 'nowrap',
      flexShrink: '0',
    });

    btn.addEventListener('click', () => {
      resetTimers();
    });

    document.body.appendChild(banner);
    return banner;
  }

  let countdownInterval = null;

  function showWarning() {
    if (isLoggingOut) return;
    warningShown = true;

    const banner = createWarningBanner() || document.getElementById('sg-warning');
    banner.style.transform = 'translateX(-50%) translateY(0)';

    /* Countdown: 3 min → 0 */
    let secsLeft = 3 * 60;
    const countdownEl = document.getElementById('sg-countdown');

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      secsLeft--;
      if (countdownEl) {
        const m = Math.floor(secsLeft / 60);
        const s = String(secsLeft % 60).padStart(2, '0');
        countdownEl.textContent = `${m}:${s}`;
      }
      if (secsLeft <= 0) clearInterval(countdownInterval);
    }, 1000);
  }

  function hideWarning() {
    warningShown = false;
    clearInterval(countdownInterval);
    const banner = document.getElementById('sg-warning');
    if (banner) banner.style.transform = 'translateX(-50%) translateY(120%)';
  }

  /* ══════════════════════════════════════════════════
     PING AL SERVIDOR
     Valida que la sesión PHP también siga activa
  ══════════════════════════════════════════════════ */
  async function ping() {
    if (isLoggingOut) return;
    try {
      const res  = await fetch(PING_URL, { credentials: 'same-origin' });
      const data = await res.json();
      if (data.status === 'expired') {
        logout('server_expired');
      }
    } catch (_) {
      /* Sin conexión — dejar que el PHP lo maneje en el siguiente request */
    }
  }

  /* ══════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════ */
  function init() {
    /* Escuchar actividad del usuario */
    ACTIVITY_EVENTS.forEach(evt => {
      document.addEventListener(evt, resetTimers, { passive: true });
    });

    /* Arrancar timers */
    resetTimers();

    /* Ping periódico */
    pingInterval = setInterval(ping, PING_INTERVAL);

    /* Mostrar razón de logout si viene del servidor */
    try {
      const reason = sessionStorage.getItem('logout_reason');
      if (reason) {
        sessionStorage.removeItem('logout_reason');
        // El login.js puede leer esta variable si se pasa por URL param
        // Se añade como query param para que login.js la lea
        const params = new URLSearchParams(window.location.search);
        if (!params.has('reason')) {
          window.history.replaceState({}, '', window.location.pathname + '?reason=' + reason);
        }
      }
    } catch (_) {}

    console.log('🔒 SessionGuard activo — timeout: 20 min por inactividad');
  }

  /* Esperar DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
