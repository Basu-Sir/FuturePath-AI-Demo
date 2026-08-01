async function apiRequest(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.json()).error || 'Request failed');
  return response.json();
}

function predictCareers(skills = [], interests = [], cgpa = 0) {
  return apiRequest('/api/careers/predict', { skills, interests, cgpa });
}

/* Model 3 — Jaccard similarity. This was being called from recommendations.html
   but was never actually defined, so every click threw a silent ReferenceError
   and the card just sat on "Ready" forever. Mirrors predictCareers(). */
function predictCareersJaccard(skills = [], interests = [], cgpa = 0) {
  return apiRequest('/api/careers/predict/jaccard', { skills, interests, cgpa });
}

function getSkillGap(userSkills = [], career) {
  return apiRequest('/api/skill-gap', { skills: userSkills, careerId: career.id });
}

function getLearningRecommendations(missingSkills = []) {
  return apiRequest('/api/learning-recommendations', { missingSkills });
}

function getDiceRecommendations(candidateSkills = [], jobs = [], topN = 5) {
  const normalizedJobs = (jobs || []).map(job => ({
    job_id: job.id || job.job_id,
    title: job.title || job.name,
    required_skills: (job.requiredSkills || job.required_skills || [])
      .map(skill => typeof skill === 'string' ? skill : (skill.name || ''))
      .filter(Boolean),
  }));

  return apiRequest('/api/recommend/dice', {
    candidate_skills: candidateSkills,
    jobs: normalizedJobs,
    top_n: topN,
  });
}

function analyzeResume(text) {
  return apiRequest('/api/resume/analyze', { text });
}