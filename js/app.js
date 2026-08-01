/* =============================================
   js/app.js — Core session, utilities, sidebar
   ============================================= */

const APP  = 'futurepath_';
const USERS_KEY   = APP + 'users';
const SESSION_KEY = APP + 'session';

/* ---------- Data helpers ---------- */
function getUsers()      { return JSON.parse(localStorage.getItem(USERS_KEY)   || '[]'); }
function saveUsers(u)    { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getSession()    { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
function saveSession(s)  { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession()  { localStorage.removeItem(SESSION_KEY); }

function getCurrentUser() {
  const s = getSession();
  if (!s || Date.now() > s.expiry) { clearSession(); return null; }
  return getUsers().find(u => u.id === s.userId) || null;
}

function saveCurrentUser(updated) {
  const users = getUsers();
  const i = users.findIndex(u => u.id === updated.id);
  if (i !== -1) { users[i] = updated; saveUsers(users); }
}

function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function logout() {
  clearSession();
  window.location.href = 'index.html';
}

/* ---------- Utilities ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
}

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function makeJWT(userId) {
  const payload = { userId, iat: Date.now(), expiry: Date.now() + 7 * 864e5 };
  return btoa(JSON.stringify(payload));
}

function showAlert(elId, msg, type = 'error') {
  const icons = { error:'!', success:'✓', info:'i', warning:'!' };
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}"><span class="alert-badge">${icons[type] || 'i'}</span>${msg}</div>`;
  if (type !== 'info') setTimeout(() => { if(el) el.innerHTML = ''; }, 4000);
}

function setLoading(btnId, loading, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn._origText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner"></div> ${text || 'Loading...'}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._origText || text || 'Submit';
  }
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(min / 60);
  const day  = Math.floor(hr / 24);
  if (day > 0)  return `${day}d ago`;
  if (hr  > 0)  return `${hr}h ago`;
  if (min > 0)  return `${min}m ago`;
  return 'Just now';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/* ---------- Sidebar & Topbar ---------- */
/* Model 1 (weighted match), Model 2 (Dice), and Model 3 (Jaccard) used to be
   spread across careers.html / jaccard.html with separate nav entries. They
   now live together on recommendations.html, so there is a single nav item
   for all of them instead of one per model.
   Profile and Resume Upload have likewise been merged into one page
   (profile.html — resume dropzone on the left, editable profile on the
   right), so there is a single 'profile' nav entry instead of two. */
const NAV_ITEMS = [
  { id:'profile', label:'Profile', icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"/></svg>', href:'profile.html' },
  { id:'recommendations', label:'Career Recommendations', icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5Zm3.5-.5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1Zm0 5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1Z"/></svg>', href:'recommendations.html' },
  { id:'skills', label:'Skill Gap', icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18h14v2H5Zm2-4h2v3H7Zm4-6h2v9h-2Zm4 3h2v6h-2Z"/></svg>', href:'skills.html' },
  { id:'learning', label:'Learning Paths', icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5ZM6 5v12a.5.5 0 0 1-.5-.5V5.5A.5.5 0 0 1 6 5Zm4 3h6M10 11h6M10 15h3"/></svg>', href:'learning.html' },
];

function renderSidebar(active) {
  const user = getCurrentUser();
  const el = document.getElementById('sidebar');
  if (!el || !user) return;

  const navHTML = NAV_ITEMS.map(n => `
    <a href="${n.href}" class="nav-item${active === n.id ? ' active' : ''}">
      <span class="nav-icon">${n.icon}</span>
      <span class="nav-label">${n.label}</span>
    </a>
  `).join('');

  el.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-mark">
        <span class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 2.2L17.3 8 12 10.8 6.7 8 12 5.2Zm-5 4.1 4.5 2.1v5.1L7 17.7v-6.4Zm10 0v6.4l-4.5 2.1v-5.1L17 9.3Z"/></svg>
        </span>
        <span class="logo-copy">FuturePath AI</span>
      </div>
      <div class="logo-sub">Career Intelligence Engine</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-group-label">Navigation</div>
      ${navHTML}
      <div class="nav-group-label">Account</div>
      <div class="nav-item" onclick="logout()">
        <span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17v-2H5V9h5V7l5 5-5 5Zm8-9h-3v2h3v6h-3v2h3a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z"/></svg></span>
        <span class="nav-label">Sign Out</span>
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="sf-avatar">${getInitials(user.name)}</div>
      <div>
        <div class="sf-name">${user.name.split(' ')[0]}</div>
        <div class="sf-email">${user.email}</div>
      </div>
    </div>
  `;
}

function renderTopbar(title, subtitle) {
  const user = getCurrentUser();
  const el   = document.getElementById('topbar');
  if (!el || !user) return;
  el.innerHTML = `
    <div class="topbar-left">
      <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar" onclick="toggleSidebar()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      </button>
      <div>
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
    </div>
    <div class="topbar-right">
      <div class="user-chip">
        <div class="avatar">${getInitials(user.name)}</div>
        <span>${user.name.split(' ')[0]}</span>
      </div>
    </div>
  `;
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main-content');
  if (!sidebar || !main) return;
  const collapsed = sidebar.classList.toggle('collapsed');
  main.classList.toggle('sidebar-compact', collapsed);
}

/* ---------- Skill Tag Input ---------- */
function initSkillTagInput(inputId, listId, skills = []) {
  const input  = document.getElementById(inputId);
  const listEl = document.getElementById(listId);
  if (!input || !listEl) return;

  const renderTags = () => {
    const existing = listEl.querySelectorAll('.tag');
    existing.forEach(t => t.remove());
    skills.forEach((s, i) => {
      const tag = document.createElement('span');
      tag.className = 'tag tag-primary';
      tag.innerHTML = `${s} <span class="remove-btn" data-i="${i}">×</span>`;
      tag.querySelector('.remove-btn').onclick = () => {
        skills.splice(i, 1); renderTags();
      };
      listEl.insertBefore(tag, input);
    });
  };

  input.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
      e.preventDefault();
      const val = input.value.trim().replace(/,$/,'');
      if (val && !skills.includes(val)) { skills.push(val); renderTags(); }
      input.value = '';
    }
    if (e.key === 'Backspace' && !input.value && skills.length) {
      skills.pop(); renderTags();
    }
  });

  renderTags();
  return { getSkills: () => [...skills] };
}

/* ---------- Profile completeness ---------- */
function calcProfileScore(user) {
  const p = user.profile || {};
  let score = 0, total = 7;
  if (user.name)                        score++;
  if ((p.skills   || []).length > 0)    score++;
  if ((p.projects || []).length > 0)    score++;
  if (p.cgpa)                           score++;
  if (p.resumeText)                     score++;
  if ((p.certifications || []).length > 0) score++;
  if ((p.experience || []).length > 0)  score++;
  return Math.round((score / total) * 100);
}

/* ---------- DOM ready ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Stagger animations
  document.querySelectorAll('[class*="delay-"]').forEach(el => {
    el.style.animationPlayState = 'running';
  });
});