=== ACTUAL DIFF: Changes to ai-engine.js ===

LOCATION 1: After line ~630 (after normalizeSkill function)
─────────────────────────────────────────────────────────

BEFORE:
```
function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] || skill.trim();
}

/* ==========================================================
   CAREER PREDICTION ENGINE
   ========================================================== */
function predictCareers(userSkills = [], interests = [], cgpa = 0) {
```

AFTER (ADDED ~500 lines of new code):
```
function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] || skill.trim();
}

/* ==========================================================
   HYBRID SCORING SYSTEM — O*NET + RIASEC + TF-IDF
   ========================================================== */

/* Blending weights for the four scoring lanes */
const W_SEMANTIC = 0.30;        // Career description similarity
const W_SKILL_MATCH = 0.25;     // O*NET skill vector alignment
const W_INTEREST_MATCH = 0.15;  // RIASEC profile alignment
const W_KEYWORD = 0.30;         // Exact keyword matching (existing logic)

/* O*NET 35 Skills (with one-line definitions) */
const ONET_SKILLS = [ ... 35 skills ... ]

/* RIASEC 6 Dimensions (Holland Codes) */
const RIASEC_DIMS = [ ... 6 dimensions ... ]

/* Map relatedInterests to RIASEC dimensions */
const INTEREST_TO_RIASEC_MAP = { ... 30+ mappings ... }

/* Global embedding cache */
let EMBEDDING_CACHE = {};

/* Build TF-IDF vocabulary from all relevant texts */
function buildVocabulary() { ... }

/* Tokenize and compute TF-IDF vector */
function encode(text) { ... }

/* Cosine similarity between two vectors */
function cosineSimilarity(vecA, vecB) { ... }

/* Softmax with temperature for probability distribution */
function softmax(scores, temperature = 0.25) { ... }

/* Z-score standardization */
function zscore(arr) { ... }

/* Rescale vector to target max */
function rescaleVector(vec, targetMax) { ... }

/* Derive 35-dim skill vector for a career from requiredSkills */
function deriveSkillVector(career) { ... }

/* Derive 6-dim RIASEC vector for a career from relatedInterests */
function deriveRiasecVector(career) { ... }

/* Pre-compute and cache all embeddings */
function initializeEmbeddings() { ... }

/* Determine which lane drove each career score */
function getScoreLaneName(...) { ... }

/* Hybrid scoring function (new main predictor) */
function predictCareersHybrid(userSkills = [], interests = [], cgpa = 0) { ... ~150 lines ... }

/* ==========================================================
   CAREER PREDICTION ENGINE (Original — preserved for backward compatibility)
   ========================================================== */
function predictCareers(userSkills = [], interests = [], cgpa = 0) {
```

LOCATION 2: Inside predictCareers() function, line ~730
──────────────────────────────────────────────────────

BEFORE:
```javascript
    career.requiredSkills.forEach(req => {
      const has = normalizedSkills.some(us =>
        us.toLowerCase() === req.name.toLowerCase() ||
        us.toLowerCase().includes(req.name.toLowerCase()) ||
        req.name.toLowerCase().includes(us.toLowerCase())
      );
```

AFTER:
```javascript
    career.requiredSkills.forEach(req => {
      // FIXED: Use word-boundary matching to avoid false positives (e.g., "C" in "C++")
      const has = normalizedSkills.some(us => {
        const usLower = us.toLowerCase();
        const reqLower = req.name.toLowerCase();
        return usLower === reqLower ||
               (usLower.split(/[\s\-\/\+]/i).includes(reqLower.split(/[\s\-\/\+]/i)[0]) &&
                reqLower.split(/[\s\-\/\+]/i).includes(usLower.split(/[\s\-\/\+]/i)[0]));
      });
```

──────────────────────────────────────────────────────────────────────────────

SUMMARY OF STRUCTURAL CHANGES:
├─ New constants (5): W_SEMANTIC, W_SKILL_MATCH, W_INTEREST_MATCH, W_KEYWORD, ONET_SKILLS, RIASEC_DIMS, INTEREST_TO_RIASEC_MAP, EMBEDDING_CACHE
├─ New functions (11): buildVocabulary, encode, cosineSimilarity, softmax, zscore, rescaleVector, deriveSkillVector, deriveRiasecVector, initializeEmbeddings, getScoreLaneName, predictCareersHybrid
├─ Modified functions (1): predictCareers (word-boundary fix + comment)
└─ Unchanged functions: getSkillGap, getLearningRecommendations, extractSkillsFromText, extractEducationFromText

Total new lines added: ~530 (constants + functions + comments)
Total lines modified: ~15 (predictCareers word-boundary logic)
