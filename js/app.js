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
  if (!getCurrentUser()) { window.location.href = 'index.html'; }
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
  const icons = { error:'❌', success:'✅', info:'ℹ️', warning:'⚠️' };
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${icons[type] || 'ℹ️'} ${msg}</div>`;
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
  { id:'dashboard', label:'Dashboard',       icon:'🏠', href:'dashboard.html' },
  { id:'profile',   label:'Profile',         icon:'👤', href:'profile.html'   },
  { id:'recommendations', label:'Career Recommendations', icon:'🎯', href:'recommendations.html' },
  { id:'skills',    label:'Skill Gap',       icon:'📊', href:'skills.html'    },
  { id:'learning',  label:'Learning Paths',  icon:'📚', href:'learning.html'  },
  { id:'education', label:'Higher Education',icon:'🎓', href:'education.html' },
];

function renderSidebar(active) {
  const user = getCurrentUser();
  const el   = document.getElementById('sidebar');
  if (!el || !user) return;

  const navHTML = NAV_ITEMS.map(n => `
    <a href="${n.href}" class="nav-item${active === n.id ? ' active' : ''}">
      <span class="nav-icon">${n.icon}</span>
      <span>${n.label}</span>
    </a>
  `).join('');

  el.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-mark">
        <span style="font-size:22px">⚡</span> FuturePath AI
      </div>
      <div class="logo-sub">Career Intelligence Engine</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-group-label">Navigation</div>
      ${navHTML}
      <div class="nav-group-label">Account</div>
      <div class="nav-item" onclick="logout()">
        <span class="nav-icon">🚪</span><span>Sign Out</span>
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
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="topbar-right">
      <div class="user-chip">
        <div class="avatar">${getInitials(user.name)}</div>
        <span>${user.name.split(' ')[0]}</span>
      </div>
    </div>
  `;
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