// Test 1: TF-IDF Cosine Similarity Example (Paraphrased skills vs career descriptions)
console.log('========== TEST 1: TF-IDF COSINE SIMILARITY EXAMPLE ==========\n');

function tokenize(text) {
  return text.toLowerCase().split(/\s+/);
}

function buildVocab(texts) {
  const vocab = new Set();
  texts.forEach(text => {
    tokenize(text).forEach(token => vocab.add(token));
  });
  return Array.from(vocab).sort();
}

function encodeText(text, vocab) {
  const tf = {};
  tokenize(text).forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  return vocab.map(word => tf[word] || 0);
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

// EXAMPLE: Paraphrased skill vs Data Scientist career description
const paraphrasedSkill = "implementing data processing algorithms";
const dataScientistDesc = "Analyze complex datasets to extract insights and build predictive models that drive business decisions.";

const exampleTexts = [paraphrasedSkill, dataScientistDesc];
const exampleVocab = buildVocab(exampleTexts);

const skillVec = encodeText(paraphrasedSkill, exampleVocab);
const descVec = encodeText(dataScientistDesc, exampleVocab);

const similarity = cosineSimilarity(skillVec, descVec);

console.log('Paraphrased skill: "' + paraphrasedSkill + '"');
console.log('Career description: "' + dataScientistDesc + '"');
console.log('\nVocabulary (sample): ' + exampleVocab.slice(0, 15).join(', ') + '... (' + exampleVocab.length + ' total)');
console.log('\nSkill vector (sample):  ' + skillVec.slice(0, 15).join(', ') + '...');
console.log('Description vector (sample): ' + descVec.slice(0, 15).join(', ') + '...');
console.log('\n⚠️  CRITICAL ISSUE FOUND:');
console.log('Cosine Similarity Score: ' + similarity.toFixed(4) + ' (out of 1.0)');
console.log('When multiplied by 100 for semanticScores: ' + (similarity * 100).toFixed(2));
console.log('\nShared tokens: data');
console.log('\n🔴 PROBLEM: With ZERO overlapping words, this score would be ZERO.');
console.log('My TF-IDF implementation is NOT true semantic matching—it\'s just term frequency.');
console.log('Two paraphrased texts without literal word overlap will ALWAYS score 0.');

// Test 2: RIASEC Vector Issues
console.log('\n\n========== TEST 2: RIASEC DERIVATION PROBLEMS ==========\n');

const INTEREST_TO_RIASEC_MAP = {
  'Hardware': 'Realistic', 'Electronics': 'Realistic', 'Robotics': 'Realistic', 'IoT': 'Realistic',
  'Systems': 'Realistic', 'Infrastructure': 'Realistic', 'Automation': 'Realistic', 'Data': 'Investigative',
  'Research': 'Investigative', 'Mathematics': 'Investigative', 'Science': 'Investigative', 'Analytics': 'Investigative',
  'AI': 'Investigative', 'Design': 'Artistic', 'Creativity': 'Artistic', 'Art': 'Artistic', 'Animation': 'Artistic',
  'UI/UX': 'Artistic', 'Web': 'Artistic', 'Psychology': 'Social', 'Business': 'Enterprising',
  'Strategy': 'Enterprising', 'Finance': 'Conventional', 'Engineering': 'Investigative',
  'Software': 'Investigative', 'Architecture': 'Investigative', 'Cryptography': 'Investigative',
  'Security': 'Investigative', 'Networking': 'Investigative', 'Cloud': 'Investigative',
  'Entrepreneurship': 'Enterprising', 'Mobile': 'Investigative', 'Startup': 'Enterprising',
  'Gaming': 'Artistic', 'Language': 'Social', 'Linguistics': 'Investigative', 'Web3': 'Investigative',
  'Blockchain': 'Investigative', 'Academic': 'Investigative', 'Academia': 'Investigative',
};

const flaggedCareers = [
  { id: 'embedded-systems', interests: ['Hardware', 'Electronics', 'Robotics', 'IoT'], issue: 'ALL map to Realistic only—should have Investigative component' },
  { id: 'devops-engineer', interests: ['Systems', 'Automation', 'Cloud', 'Engineering'], issue: 'Systems/Automation→Realistic (75%), Cloud/Engineering→Investigative (25%)—backwards for DevOps' },
  { id: 'cloud-architect', interests: ['Cloud', 'Architecture', 'Infrastructure'], issue: 'Infrastructure→Realistic, but cloud architecture is Investigative-heavy' },
  { id: 'dba', interests: ['Data', 'Systems', 'Engineering'], issue: 'Systems→Realistic undermines Data/Engineering which should dominate' },
  { id: 'cybersecurity', interests: ['Security', 'Networking', 'Systems'], issue: 'Systems→Realistic; Security/Networking are Investigative but only 2/3 mapped' },
];

flaggedCareers.forEach(career => {
  const riasecCount = { Realistic: 0, Investigative: 0, Artistic: 0, Social: 0, Enterprising: 0, Conventional: 0 };
  career.interests.forEach(interest => {
    const code = INTEREST_TO_RIASEC_MAP[interest];
    if (code) riasecCount[code]++;
  });
  const total = Object.values(riasecCount).reduce((a, b) => a + b, 0);
  console.log(`${career.id}:`);
  console.log(`  Interests: [${career.interests.join(', ')}]`);
  console.log(`  RIASEC distribution: ${JSON.stringify(riasecCount)}`);
  console.log(`  ❌ ISSUE: ${career.issue}`);
  console.log('');
});

// Test 3: Actual vs Intended Behavior
console.log('\n========== TEST 3: PREDICTCAREERS() VS PREDICTCAREERSHYBRID() ==========\n');

console.log('Current state in ai-engine.js:');
console.log('');
console.log('1. predictCareers(userSkills, interests, cgpa)');
console.log('   - USES: Original logic only (keyword matching + interest bonus + CGPA boost)');
console.log('   - DOES NOT USE: Hybrid scoring, semantic, O*NET vectors, RIASEC scoring');
console.log('   - STATUS: Backward compatible, existing callers unchanged');
console.log('   - RESULT: Scores range 0-98, no probabilities');
console.log('');
console.log('2. predictCareersHybrid(userSkills, interests, cgpa)');
console.log('   - USES: Four-lane hybrid (semantic + skill_match + interest_match + keyword)');
console.log('   - DOES USE: Z-score standardization, softmax, blended weights');
console.log('   - STATUS: New function, opt-in only');
console.log('   - RESULT: Scores 0-98, PLUS probabilities field');
console.log('');
console.log('⚠️  CRITICAL: Existing code calling predictCareers() still gets OLD scoring.');
console.log('   To get hybrid scoring, code must explicitly call predictCareersHybrid().');
console.log('');
console.log('📋 MAPPING:');
console.log('   - app.js line (unknown): calls predictCareers()  → STILL OLD LOGIC');
console.log('   - dashboard.html: displays results → STILL OLD FORMAT');
console.log('   - If you want hybrid scoring used by default, you must:');
console.log('     a) Replace all calls to predictCareers() with predictCareersHybrid() in app.js');
console.log('     b) OR create a new config flag to switch between them');
