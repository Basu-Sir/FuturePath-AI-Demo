/* =============================================
   js/resume.js — Resume Upload & Parsing
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

/* ---------- Main upload handler ---------- */
function initResumeUpload() {
  requireAuth();
  renderSidebar('resume');
  renderTopbar('Resume Upload', 'Upload your resume and let AI extract your skills');

  const dropzone   = document.getElementById('dropzone');
  const fileInput  = document.getElementById('resume-file');
  const uploadArea = document.getElementById('upload-area');
  const resultArea = document.getElementById('result-area');

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
    return showAlert('upload-alert', `File too large. Max size is ${MAX_MB}MB.`, 'error');
  }

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf','docx','txt'].includes(ext)) {
    return showAlert('upload-alert', 'Invalid file type. Please upload PDF, DOCX, or TXT.', 'error');
  }

  // Show progress
  showUploadProgress(file);

  try {
    const text = await parseFile(file);
    processExtractedText(text, file.name);
  } catch (err) {
    showAlert('upload-alert', `Parsing failed: ${err.message}`, 'error');
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
}

function dropzoneInnerHTML() {
  return `
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

function processExtractedText(text, fileName) {
  const skills    = extractSkillsFromText(text);
  const eduInfo   = extractEducationFromText(text);
  const wordCount = text.split(/\s+/).length;

  // Store in user profile
  const user = getCurrentUser();
  if (!user) return;

  user.profile.resumeText = text;
  user.profile.resumeFile = fileName;
  user.profile.resumeDate = new Date().toISOString();

  // Merge extracted skills with existing skills (no duplicates)
  const existing = new Set(user.profile.skills.map(s => s.toLowerCase()));
  skills.forEach(s => { if (!existing.has(s.toLowerCase())) user.profile.skills.push(s); });

  if (eduInfo.cgpa && !user.profile.cgpa) user.profile.cgpa = eduInfo.cgpa;

  saveCurrentUser(user);
  renderExtractionResults(skills, text, wordCount, fileName);
}

function renderExtractionResults(skills, text, wordCount, fileName) {
  const dropzone  = document.getElementById('dropzone');
  const resultArea = document.getElementById('result-area');
  if (!resultArea) return;

  // Success state in dropzone
  dropzone.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:48px; margin-bottom:12px">✅</div>
      <div style="font-weight:700; color:var(--success); font-size:16px; margin-bottom:4px">${fileName}</div>
      <div style="font-size:13px; color:var(--text-muted)">${wordCount.toLocaleString()} words parsed</div>
      <button class="btn btn-ghost btn-sm mt-12" onclick="location.reload()">Upload Another</button>
    </div>
  `;

  resultArea.style.display = 'block';
  resultArea.classList.add('anim-fade-up');

  const skillsHTML = skills.length > 0
    ? skills.map(s => `<span class="tag tag-success">${s}</span>`).join('')
    : '<span class="text-muted text-sm">No recognizable skills found. Try adding them manually in your profile.</span>';

  document.getElementById('extracted-skills-list').innerHTML = skillsHTML;
  document.getElementById('extracted-skill-count').textContent = skills.length;
  document.getElementById('extracted-word-count').textContent  = wordCount.toLocaleString();

  showAlert('upload-alert', `✅ Resume parsed! ${skills.length} skills extracted and merged into your profile.`, 'success');
}
