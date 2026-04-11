/* ═══════════════════════════════════════════════════
   login.js — Lógica del formulario de acceso admin
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const btnLogin    = document.getElementById('btnLogin');
  const usuarioEl   = document.getElementById('usuario');
  const passwordEl  = document.getElementById('password');
  const errorEl     = document.getElementById('loginError');
  const togglePass  = document.getElementById('togglePass');

  /* ── Mostrar/ocultar contraseña ──────────────────── */
  togglePass?.addEventListener('click', () => {
    const isPass = passwordEl.type === 'password';
    passwordEl.type      = isPass ? 'text' : 'password';
    togglePass.textContent = isPass ? '🙈' : '👁';
  });

  /* ── Enviar con Enter ────────────────────────────── */
  [usuarioEl, passwordEl].forEach(el => {
    el?.addEventListener('keydown', e => {
      if (e.key === 'Enter') btnLogin.click();
    });
  });

  /* ── Login ───────────────────────────────────────── */
  btnLogin?.addEventListener('click', async () => {
    const usuario  = usuarioEl?.value.trim();
    const password = passwordEl?.value;

    if (!usuario || !password) {
      showError('Completa usuario y contraseña.');
      return;
    }

    btnLogin.disabled    = true;
    btnLogin.textContent = 'Verificando...';

    try {
      const res  = await fetch('../api/login.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ usuario, password }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Respuesta no-JSON del servidor:', text);
        showError('Error en el servidor. Revisa que XAMPP esté corriendo.');
        return;
      }

      if (data.success) {
        window.location.href = 'index.php';
      } else {
        showError(data.message || 'Usuario o contraseña incorrectos.');
        passwordEl.value = '';
        passwordEl.focus();
      }

    } catch (err) {
      console.error('Fetch error:', err);
      showError('No se pudo conectar al servidor. ¿Está XAMPP corriendo?');
    } finally {
      btnLogin.disabled    = false;
      btnLogin.textContent = 'Entrar al panel';
    }
  });

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent   = msg;
    errorEl.style.display = 'block';
    setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
  }

});