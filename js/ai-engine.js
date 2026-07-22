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

function getSkillGap(userSkills = [], career) {
  return apiRequest('/api/skill-gap', { skills: userSkills, careerId: career.id });
}

function getLearningRecommendations(missingSkills = []) {
  return apiRequest('/api/learning-recommendations', { missingSkills });
}

function analyzeResume(text) {
  return apiRequest('/api/resume/analyze', { text });
}
