/* =============================================
   js/auth.js — Registration, Login
   ============================================= */

/* ---------- REGISTER ---------- */
function handleRegister(e) {
  e.preventDefault();
  const alertEl = 'reg-alert';

  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const college  = document.getElementById('reg-college').value.trim();
  const degree   = document.getElementById('reg-degree').value;
  const branch   = document.getElementById('reg-branch').value.trim();
  const year     = document.getElementById('reg-year').value;
  const phone    = document.getElementById('reg-phone').value.trim();

  // Validations
  if (!name || !email || !password || !college || !degree || !branch || !year || !phone) {
    return showAlert(alertEl, 'Please fill in all fields.', 'error');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showAlert(alertEl, 'Please enter a valid email address.', 'error');
  }
  if (password.length < 8) {
    return showAlert(alertEl, 'Password must be at least 8 characters.', 'error');
  }
  if (!/^\d{10}$/.test(phone)) {
    return showAlert(alertEl, 'Please enter a valid 10-digit phone number.', 'error');
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return showAlert(alertEl, 'An account with this email already exists.', 'error');
  }

  setLoading('reg-btn', true, 'Creating account...');

  setTimeout(() => {
    const newUser = {
      id:           generateId(),
      name, email, college, degree, branch, year, phone,
      passwordHash: simpleHash(password),
      createdAt:    new Date().toISOString(),
      profile: {
        skills:         [],
        projects:       [],
        cgpa:           '',
        certifications: [],
        experience:     [],
        resumeText:     '',
        interests:      [],
      },
      careerCache: null,
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login
    const session = { userId: newUser.id, token: makeJWT(newUser.id), expiry: Date.now() + 7 * 864e5 };
    saveSession(session);

    showAlert(alertEl, 'Account created successfully! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
  }, 800);
}

/* ---------- LOGIN ---------- */
function handleLogin(e) {
  e.preventDefault();
  const alertEl = 'login-alert';

  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('login-remember')?.checked;

  if (!email || !password) {
    return showAlert(alertEl, 'Please enter your email and password.', 'error');
  }

  setLoading('login-btn', true, 'Signing in...');

  setTimeout(() => {
    const users = getUsers();
    const user  = users.find(u => u.email === email);

    if (!user || user.passwordHash !== simpleHash(password)) {
      setLoading('login-btn', false, 'Sign In');
      return showAlert(alertEl, 'Invalid email or password.', 'error');
    }

    const expiry  = remember ? Date.now() + 30 * 864e5 : Date.now() + 7 * 864e5;
    const session = { userId: user.id, token: makeJWT(user.id), expiry };
    saveSession(session);

    showAlert(alertEl, `Welcome back, ${user.name.split(' ')[0]}! 🎉`, 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
  }, 700);
}

/* ---------- Tab switching ---------- */
function switchTab(tab) {
  const loginPanel = document.getElementById('login-panel');
  const regPanel   = document.getElementById('register-panel');
  const tabs       = document.querySelectorAll('.auth-tab');

  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  if (tab === 'login') {
    loginPanel.style.display = 'block';
    regPanel.style.display   = 'none';
  } else {
    loginPanel.style.display = 'none';
    regPanel.style.display   = 'block';
  }
}

/* ---------- Password visibility toggle ---------- */
function togglePass(inputId, btnEl) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (btnEl) btnEl.textContent = '🙈';
  } else {
    inp.type = 'password';
    if (btnEl) btnEl.textContent = '👁️';
  }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, skip to dashboard
  if (getCurrentUser()) { window.location.href = 'dashboard.html'; return; }

  // Bind forms
  const regForm   = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  if (regForm)   regForm.addEventListener('submit',   handleRegister);
  if (loginForm) loginForm.addEventListener('submit',  handleLogin);

  // Tab default
  switchTab('login');

  // Particles
  initParticles();
});

/* ---------- Particle canvas ---------- */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 65; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      a: Math.random() * .55 + .1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108,99,255,${p.a})`;
      ctx.fill();
    });

    // Draw lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${.12 * (1 - dist/110)})`;
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}
