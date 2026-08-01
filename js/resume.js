/* =============================================
   js/resume.js — Resume Upload & Parsing
   Lives inside profile.html — the dropzone occupies the LHS while
   the RHS shows the editable profile. This file only wires up the
   dropzone/file-input and hands off UI refresh to profile.html
   (via window.refreshSkillsAfterResume), it does not own the page
   shell (auth/sidebar/topbar are rendered once by the host page).
   ============================================= */

let pdfJsLoaded  = false;
let mammothLoaded = false;

/* ---------- Load external libs lazily ---------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ---------- Parse based on file type ---------- */
async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf')  return await parsePDF(file);
  if (ext === 'docx') return await parseDOCX(file);
  if (ext === 'txt')  return await parseTXT(file);
  throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
}

async function parseTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}

async function parsePDF(file) {
  if (!pdfJsLoaded) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    pdfJsLoaded = true;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

async function parseDOCX(file) {
  if (!mammothLoaded) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
    mammothLoaded = true;
  }
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/* ---------- Main upload handler ----------
   NOTE: does NOT call requireAuth/renderSidebar/renderTopbar — the
   host page (profile.html) already rendered the shell once. Calling
   them again here would clobber the page title/subtitle the host set. */
function initResumeUpload() {
  const dropzone  = document.getElementById('dropzone');
  const fileInput = document.getElementById('resume-file');

  if (!dropzone) return;

  // Drag & drop
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  });

  // Click to browse
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFileUpload(fileInput.files[0]);
  });
}

async function handleFileUpload(file) {
  const MAX_MB = 10;
  if (file.size > MAX_MB * 1024 * 1024) {
    return showAlert('page-alert', `File too large. Max size is ${MAX_MB}MB.`, 'error');
  }

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf','docx','txt'].includes(ext)) {
    return showAlert('page-alert', 'Invalid file type. Please upload PDF, DOCX, or TXT.', 'error');
  }

  // Show progress
  showUploadProgress(file);

  try {
    const text = await parseFile(file);
    await processExtractedText(text, file.name);
  } catch (err) {
    showAlert('page-alert', `Parsing failed: ${err.message}`, 'error');
    resetUploadArea();
  }
}

function showUploadProgress(file) {
  const dropzone = document.getElementById('dropzone');
  dropzone.innerHTML = `
    <div style="text-align:center">
      <div class="spinner spinner-lg" style="margin:0 auto 16px"></div>
      <div style="font-weight:600; color:var(--text-primary); margin-bottom:6px">Parsing ${file.name}…</div>
      <div style="font-size:13px; color:var(--text-muted)">Extracting skills, experience & education</div>
    </div>
  `;
}

function resetUploadArea() {
  const dropzone = document.getElementById('dropzone');
  dropzone.innerHTML = dropzoneInnerHTML();
  const fileInput = document.getElementById('resume-file');
  if (fileInput) fileInput.value = '';
}

function dropzoneInnerHTML() {
  return `
    <input id="resume-file" type="file" accept=".pdf,.docx,.txt" style="display:none" />
    <div class="dropzone-icon">📄</div>
    <h3 class="dropzone-title">Drop your resume here</h3>
    <p class="dropzone-sub">PDF, DOCX, or TXT • Max 10MB</p>
    <div class="dropzone-formats">
      <span class="tag tag-ghost">PDF</span>
      <span class="tag tag-ghost">DOCX</span>
      <span class="tag tag-ghost">TXT</span>
    </div>
  `;
}

async function processExtractedText(text, fileName) {
  const analysis  = await analyzeResume(text);
  const skills    = analysis.skills;
  const eduInfo   = analysis.education;
  const wordCount = text.split(/\s+/).length;

  // Store in user profile
  const user = getCurrentUser();
  if (!user) return;

  user.profile.resumeText = text;
  user.profile.resumeFile = fileName;
  user.profile.resumeDate = new Date().toISOString();

  // Merge extracted skills with existing skills (no duplicates)
  const existing = new Set(user.profile.skills.map(s => s.toLowerCase()));
  skills.forEach(s => {
    const key = s.toLowerCase();
    if (!existing.has(key)) {
      user.profile.skills.push(s);
      existing.add(key);
    }
  });

  if (eduInfo.cgpa && !user.profile.cgpa) user.profile.cgpa = eduInfo.cgpa;

  saveCurrentUser(user);
  renderExtractionResults(skills, text, wordCount, fileName);

  // Reflect the merged skills (and any newly-picked-up CGPA/resume badge)
  // in the profile form on the right without a page reload.
  if (typeof window.refreshSkillsAfterResume === 'function') {
    window.refreshSkillsAfterResume();
  }
}

function renderExtractionResults(skills, text, wordCount, fileName) {
  const dropzone   = document.getElementById('dropzone');
  const resultArea = document.getElementById('result-area');
  if (!resultArea) return;

  // Success state in dropzone
  dropzone.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:40px; margin-bottom:10px">✅</div>
      <div style="font-weight:700; color:var(--success); font-size:15px; margin-bottom:4px">${fileName}</div>
      <div style="font-size:13px; color:var(--text-muted)">${wordCount.toLocaleString()} words parsed</div>
      <button class="btn btn-ghost btn-sm mt-12" onclick="resetUploadArea()">Upload Another</button>
    </div>
  `;

  resultArea.style.display = 'block';
  resultArea.classList.add('anim-fade-up');

  const skillsHTML = skills.length > 0
    ? skills.map(s => `<span class="tag tag-success">${s}</span>`).join('')
    : '<span class="text-muted text-sm">No recognizable skills found. Try adding them manually below.</span>';

  document.getElementById('extracted-skills-list').innerHTML = skillsHTML;
  document.getElementById('extracted-skill-count').textContent = skills.length;
  document.getElementById('extracted-word-count').textContent  = wordCount.toLocaleString();
  const extExt = fileName.split('.').pop().toUpperCase();
  const pagesEl = document.getElementById('extracted-pages');
  if (pagesEl) pagesEl.textContent = extExt;

  showAlert('page-alert', `✅ Resume parsed! ${skills.length} skills extracted and merged into your profile.`, 'success');
}