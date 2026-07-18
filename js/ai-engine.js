/* =============================================
   js/ai-engine.js — Career Prediction, Skill Gap, Courses
   ============================================= */

/* ==========================================================
   CAREER PROFILES DATABASE
   Each career: { id, title, domain, icon, color,
     requiredSkills: [{name, weight, time, difficulty, importance}],
     relatedInterests: [],
     description, avgSalary, growth }
   ========================================================== */
const CAREER_PROFILES = [
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    domain: 'Data & AI',
    icon: '🔬',
    color: '#6c63ff',
    description: 'Analyze complex datasets to extract insights and build predictive models that drive business decisions.',
    avgSalary: '₹8L – ₹30L',
    growth: 'Very High',
    requiredSkills: [
      { name:'Python',            weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'Machine Learning',  weight:10, time:'3-4 months',  difficulty:'Hard',    importance:10 },
      { name:'Statistics',        weight:9,  time:'1-2 months',  difficulty:'Medium',  importance:9  },
      { name:'SQL',               weight:8,  time:'1 month',     difficulty:'Easy',    importance:8  },
      { name:'Data Visualization',weight:7,  time:'3-4 weeks',   difficulty:'Easy',    importance:7  },
      { name:'Pandas',            weight:7,  time:'3 weeks',     difficulty:'Easy',    importance:7  },
      { name:'Deep Learning',     weight:8,  time:'4-6 months',  difficulty:'Hard',    importance:8  },
      { name:'TensorFlow',        weight:7,  time:'2-3 months',  difficulty:'Hard',    importance:7  },
      { name:'NumPy',             weight:6,  time:'2 weeks',     difficulty:'Easy',    importance:6  },
      { name:'Feature Engineering',weight:7, time:'3-4 weeks',  difficulty:'Medium',  importance:7  },
    ],
    relatedInterests: ['AI', 'Data', 'Research', 'Mathematics', 'Analytics'],
  },
  {
    id: 'ml-engineer',
    title: 'Machine Learning Engineer',
    domain: 'AI / ML',
    icon: '🤖',
    color: '#00d4ff',
    description: 'Design and deploy machine learning systems at scale, bridging the gap between research and production.',
    avgSalary: '₹10L – ₹40L',
    growth: 'Very High',
    requiredSkills: [
      { name:'Python',            weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'Machine Learning',  weight:10, time:'3-4 months',  difficulty:'Hard',    importance:10 },
      { name:'Deep Learning',     weight:9,  time:'4-6 months',  difficulty:'Hard',    importance:9  },
      { name:'TensorFlow',        weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'PyTorch',           weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'Docker',            weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Kubernetes',        weight:6,  time:'2-3 months',  difficulty:'Hard',    importance:6  },
      { name:'MLOps',             weight:7,  time:'2-3 months',  difficulty:'Hard',    importance:7  },
      { name:'REST APIs',         weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
      { name:'Git',               weight:6,  time:'1-2 weeks',   difficulty:'Easy',    importance:6  },
    ],
    relatedInterests: ['AI', 'Engineering', 'Research', 'Software'],
  },
  {
    id: 'fullstack-dev',
    title: 'Full Stack Developer',
    domain: 'Software Engineering',
    icon: '💻',
    color: '#00e5a0',
    description: 'Build end-to-end web applications, handling both client-side and server-side development.',
    avgSalary: '₹5L – ₹25L',
    growth: 'High',
    requiredSkills: [
      { name:'JavaScript',        weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'React',             weight:9,  time:'2-3 months',  difficulty:'Medium',  importance:9  },
      { name:'Node.js',           weight:9,  time:'2-3 months',  difficulty:'Medium',  importance:9  },
      { name:'HTML/CSS',          weight:7,  time:'1-2 months',  difficulty:'Easy',    importance:7  },
      { name:'SQL',               weight:7,  time:'1 month',     difficulty:'Easy',    importance:7  },
      { name:'REST APIs',         weight:8,  time:'3-4 weeks',   difficulty:'Medium',  importance:8  },
      { name:'Git',               weight:7,  time:'1-2 weeks',   difficulty:'Easy',    importance:7  },
      { name:'MongoDB',           weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
      { name:'TypeScript',        weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Docker',            weight:5,  time:'1-2 months',  difficulty:'Medium',  importance:5  },
    ],
    relatedInterests: ['Web', 'Software', 'Design', 'Entrepreneurship'],
  },
  {
    id: 'frontend-dev',
    title: 'Frontend Developer',
    domain: 'Web Development',
    icon: '🎨',
    color: '#ff6b6b',
    description: 'Craft beautiful, performant user interfaces and experiences using modern web technologies.',
    avgSalary: '₹4L – ₹20L',
    growth: 'High',
    requiredSkills: [
      { name:'JavaScript',        weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'React',             weight:9,  time:'2-3 months',  difficulty:'Medium',  importance:9  },
      { name:'HTML/CSS',          weight:9,  time:'1-2 months',  difficulty:'Easy',    importance:9  },
      { name:'TypeScript',        weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'UI/UX Design',      weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Responsive Design', weight:7,  time:'2-3 weeks',   difficulty:'Easy',    importance:7  },
      { name:'Git',               weight:6,  time:'1-2 weeks',   difficulty:'Easy',    importance:6  },
      { name:'Next.js',           weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Redux',             weight:5,  time:'3-4 weeks',   difficulty:'Medium',  importance:5  },
      { name:'Testing/Jest',      weight:5,  time:'3-4 weeks',   difficulty:'Medium',  importance:5  },
    ],
    relatedInterests: ['Design', 'Web', 'UI/UX', 'Creativity'],
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer',
    domain: 'Software Engineering',
    icon: '⚙️',
    color: '#ffb347',
    description: 'Build robust server-side systems, APIs, and database architectures that power applications.',
    avgSalary: '₹5L – ₹22L',
    growth: 'High',
    requiredSkills: [
      { name:'Python',            weight:8,  time:'2-3 months',  difficulty:'Medium',  importance:8  },
      { name:'Node.js',           weight:9,  time:'2-3 months',  difficulty:'Medium',  importance:9  },
      { name:'SQL',               weight:9,  time:'1 month',     difficulty:'Easy',    importance:9  },
      { name:'REST APIs',         weight:10, time:'3-4 weeks',   difficulty:'Medium',  importance:10 },
      { name:'MongoDB',           weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Docker',            weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Git',               weight:7,  time:'1-2 weeks',   difficulty:'Easy',    importance:7  },
      { name:'Redis',             weight:6,  time:'2-3 weeks',   difficulty:'Medium',  importance:6  },
      { name:'System Design',     weight:7,  time:'2-3 months',  difficulty:'Hard',    importance:7  },
      { name:'Linux',             weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
    ],
    relatedInterests: ['Software', 'Systems', 'Architecture'],
  },
  {
    id: 'devops-engineer',
    title: 'DevOps / SRE Engineer',
    domain: 'Infrastructure',
    icon: '🔧',
    color: '#a855f7',
    description: 'Automate and manage infrastructure, CI/CD pipelines, and cloud deployments for reliability.',
    avgSalary: '₹7L – ₹30L',
    growth: 'Very High',
    requiredSkills: [
      { name:'Docker',            weight:10, time:'1-2 months',  difficulty:'Medium',  importance:10 },
      { name:'Kubernetes',        weight:9,  time:'2-3 months',  difficulty:'Hard',    importance:9  },
      { name:'Linux',             weight:9,  time:'3-4 weeks',   difficulty:'Medium',  importance:9  },
      { name:'CI/CD',             weight:9,  time:'1-2 months',  difficulty:'Medium',  importance:9  },
      { name:'AWS',               weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'Terraform',         weight:7,  time:'1-2 months',  difficulty:'Hard',    importance:7  },
      { name:'Python',            weight:7,  time:'2-3 months',  difficulty:'Medium',  importance:7  },
      { name:'Monitoring/Grafana',weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
      { name:'Shell Scripting',   weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Git',               weight:7,  time:'1-2 weeks',   difficulty:'Easy',    importance:7  },
    ],
    relatedInterests: ['Systems', 'Automation', 'Cloud', 'Engineering'],
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity Analyst',
    domain: 'Security',
    icon: '🛡️',
    color: '#ff4757',
    description: 'Protect organizations from cyber threats by monitoring, analyzing, and responding to security incidents.',
    avgSalary: '₹6L – ₹28L',
    growth: 'Very High',
    requiredSkills: [
      { name:'Networking',        weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'Linux',             weight:9,  time:'3-4 weeks',   difficulty:'Medium',  importance:9  },
      { name:'Python',            weight:7,  time:'2-3 months',  difficulty:'Medium',  importance:7  },
      { name:'Ethical Hacking',   weight:9,  time:'3-4 months',  difficulty:'Hard',    importance:9  },
      { name:'SIEM Tools',        weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Cryptography',      weight:7,  time:'1-2 months',  difficulty:'Hard',    importance:7  },
      { name:'Incident Response', weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'Penetration Testing',weight:8, time:'3-4 months',  difficulty:'Hard',    importance:8  },
      { name:'Risk Assessment',   weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Firewalls & IDS',   weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
    ],
    relatedInterests: ['Security', 'Networking', 'Systems'],
  },
  {
    id: 'cloud-architect',
    title: 'Cloud Architect',
    domain: 'Cloud Computing',
    icon: '☁️',
    color: '#1e90ff',
    description: 'Design scalable, resilient cloud infrastructure solutions across AWS, Azure, and GCP platforms.',
    avgSalary: '₹12L – ₹45L',
    growth: 'Very High',
    requiredSkills: [
      { name:'AWS',               weight:10, time:'2-3 months',  difficulty:'Hard',    importance:10 },
      { name:'Azure',             weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'GCP',               weight:7,  time:'2-3 months',  difficulty:'Hard',    importance:7  },
      { name:'Docker',            weight:8,  time:'1-2 months',  difficulty:'Medium',  importance:8  },
      { name:'Kubernetes',        weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'Terraform',         weight:8,  time:'1-2 months',  difficulty:'Hard',    importance:8  },
      { name:'System Design',     weight:9,  time:'2-3 months',  difficulty:'Hard',    importance:9  },
      { name:'Networking',        weight:7,  time:'2-3 months',  difficulty:'Medium',  importance:7  },
      { name:'CI/CD',             weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Cost Optimization', weight:6,  time:'1-2 months',  difficulty:'Medium',  importance:6  },
    ],
    relatedInterests: ['Cloud', 'Architecture', 'Infrastructure'],
  },
  {
    id: 'nlp-engineer',
    title: 'NLP Engineer',
    domain: 'AI / NLP',
    icon: '🗣️',
    color: '#2ed573',
    description: 'Build systems that understand and generate human language — from chatbots to text analytics.',
    avgSalary: '₹9L – ₹38L',
    growth: 'Very High',
    requiredSkills: [
      { name:'Python',            weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'Deep Learning',     weight:9,  time:'4-6 months',  difficulty:'Hard',    importance:9  },
      { name:'NLP',               weight:10, time:'3-4 months',  difficulty:'Hard',    importance:10 },
      { name:'Transformers/BERT', weight:9,  time:'2-3 months',  difficulty:'Hard',    importance:9  },
      { name:'Machine Learning',  weight:8,  time:'3-4 months',  difficulty:'Hard',    importance:8  },
      { name:'Linguistics',       weight:6,  time:'1-2 months',  difficulty:'Medium',  importance:6  },
      { name:'Text Mining',       weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'TensorFlow',        weight:7,  time:'2-3 months',  difficulty:'Hard',    importance:7  },
      { name:'Statistics',        weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'LangChain',         weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
    ],
    relatedInterests: ['AI', 'Language', 'Research', 'Linguistics'],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    domain: 'Data & Analytics',
    icon: '📊',
    color: '#ffa502',
    description: 'Transform raw data into actionable insights through analysis, visualization, and reporting.',
    avgSalary: '₹4L – ₹16L',
    growth: 'High',
    requiredSkills: [
      { name:'SQL',               weight:10, time:'1 month',     difficulty:'Easy',    importance:10 },
      { name:'Excel',             weight:8,  time:'2-3 weeks',   difficulty:'Easy',    importance:8  },
      { name:'Python',            weight:7,  time:'2-3 months',  difficulty:'Medium',  importance:7  },
      { name:'Data Visualization',weight:9,  time:'3-4 weeks',   difficulty:'Easy',    importance:9  },
      { name:'Tableau',           weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Power BI',          weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Statistics',        weight:8,  time:'1-2 months',  difficulty:'Medium',  importance:8  },
      { name:'Pandas',            weight:6,  time:'3 weeks',     difficulty:'Easy',    importance:6  },
      { name:'Business Intelligence',weight:6,time:'1-2 months', difficulty:'Medium',  importance:6  },
      { name:'Communication',     weight:5,  time:'Ongoing',     difficulty:'Soft',    importance:5  },
    ],
    relatedInterests: ['Data', 'Business', 'Analytics', 'Finance'],
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    domain: 'Product',
    icon: '🗺️',
    color: '#ff6348',
    description: 'Define product vision, prioritize features, and coordinate cross-functional teams to ship great products.',
    avgSalary: '₹8L – ₹35L',
    growth: 'High',
    requiredSkills: [
      { name:'Product Strategy',  weight:10, time:'3-6 months',  difficulty:'Hard',    importance:10 },
      { name:'User Research',     weight:9,  time:'1-2 months',  difficulty:'Medium',  importance:9  },
      { name:'Agile/Scrum',       weight:8,  time:'1-2 months',  difficulty:'Medium',  importance:8  },
      { name:'Data Analytics',    weight:8,  time:'1-2 months',  difficulty:'Medium',  importance:8  },
      { name:'SQL',               weight:6,  time:'1 month',     difficulty:'Easy',    importance:6  },
      { name:'Wireframing',       weight:7,  time:'3-4 weeks',   difficulty:'Easy',    importance:7  },
      { name:'Communication',     weight:9,  time:'Ongoing',     difficulty:'Soft',    importance:9  },
      { name:'Stakeholder Mgmt',  weight:8,  time:'Ongoing',     difficulty:'Soft',    importance:8  },
      { name:'A/B Testing',       weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Market Analysis',   weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
    ],
    relatedInterests: ['Business', 'Design', 'Strategy', 'Entrepreneurship'],
  },
  {
    id: 'blockchain-dev',
    title: 'Blockchain Developer',
    domain: 'Web3 / Blockchain',
    icon: '🔗',
    color: '#f9ca24',
    description: 'Build decentralized applications, smart contracts, and blockchain infrastructure.',
    avgSalary: '₹8L – ₹40L',
    growth: 'High',
    requiredSkills: [
      { name:'Solidity',          weight:10, time:'2-3 months',  difficulty:'Hard',    importance:10 },
      { name:'Ethereum',          weight:9,  time:'2-3 months',  difficulty:'Hard',    importance:9  },
      { name:'JavaScript',        weight:8,  time:'2-3 months',  difficulty:'Medium',  importance:8  },
      { name:'Smart Contracts',   weight:9,  time:'2-3 months',  difficulty:'Hard',    importance:9  },
      { name:'Web3.js',           weight:8,  time:'1-2 months',  difficulty:'Medium',  importance:8  },
      { name:'Cryptography',      weight:7,  time:'1-2 months',  difficulty:'Hard',    importance:7  },
      { name:'DeFi',              weight:6,  time:'1-2 months',  difficulty:'Hard',    importance:6  },
      { name:'Node.js',           weight:6,  time:'2-3 months',  difficulty:'Medium',  importance:6  },
      { name:'Git',               weight:5,  time:'1-2 weeks',   difficulty:'Easy',    importance:5  },
      { name:'Rust',              weight:6,  time:'3-4 months',  difficulty:'Hard',    importance:6  },
    ],
    relatedInterests: ['Blockchain', 'Finance', 'Cryptography', 'Web3'],
  },
  {
    id: 'embedded-systems',
    title: 'Embedded Systems Engineer',
    domain: 'Hardware / IoT',
    icon: '🔌',
    color: '#05c46b',
    description: 'Develop firmware and software for embedded systems, microcontrollers, and IoT devices.',
    avgSalary: '₹5L – ₹20L',
    growth: 'Medium',
    requiredSkills: [
      { name:'C/C++',             weight:10, time:'3-4 months',  difficulty:'Hard',    importance:10 },
      { name:'Microcontrollers',  weight:9,  time:'2-3 months',  difficulty:'Hard',    importance:9  },
      { name:'RTOS',              weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'Electronics',       weight:8,  time:'3-4 months',  difficulty:'Hard',    importance:8  },
      { name:'IoT',               weight:7,  time:'2-3 months',  difficulty:'Medium',  importance:7  },
      { name:'Linux',             weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
      { name:'Python',            weight:5,  time:'2-3 months',  difficulty:'Medium',  importance:5  },
      { name:'PCB Design',        weight:6,  time:'2-3 months',  difficulty:'Hard',    importance:6  },
      { name:'Assembly',          weight:5,  time:'1-2 months',  difficulty:'Hard',    importance:5  },
      { name:'Debugging',         weight:7,  time:'Ongoing',     difficulty:'Medium',  importance:7  },
    ],
    relatedInterests: ['Hardware', 'Electronics', 'Robotics', 'IoT'],
  },
  {
    id: 'mobile-dev',
    title: 'Mobile App Developer',
    domain: 'Mobile',
    icon: '📱',
    color: '#eccc68',
    description: 'Build cross-platform or native mobile apps for iOS and Android that reach millions of users.',
    avgSalary: '₹4L – ₹22L',
    growth: 'High',
    requiredSkills: [
      { name:'React Native',      weight:9,  time:'2-3 months',  difficulty:'Medium',  importance:9  },
      { name:'Flutter',           weight:9,  time:'2-3 months',  difficulty:'Medium',  importance:9  },
      { name:'JavaScript',        weight:8,  time:'2-3 months',  difficulty:'Medium',  importance:8  },
      { name:'Dart',              weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Java',              weight:6,  time:'2-3 months',  difficulty:'Medium',  importance:6  },
      { name:'Swift',             weight:6,  time:'2-3 months',  difficulty:'Medium',  importance:6  },
      { name:'REST APIs',         weight:8,  time:'3-4 weeks',   difficulty:'Medium',  importance:8  },
      { name:'UI/UX Design',      weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Firebase',          weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Git',               weight:6,  time:'1-2 weeks',   difficulty:'Easy',    importance:6  },
    ],
    relatedInterests: ['Mobile', 'Design', 'Software', 'Startup'],
  },
  {
    id: 'game-dev',
    title: 'Game Developer',
    domain: 'Gaming',
    icon: '🎮',
    color: '#ff4757',
    description: 'Create immersive games using engines like Unity or Unreal — from mobile games to AAA titles.',
    avgSalary: '₹4L – ₹20L',
    growth: 'Medium',
    requiredSkills: [
      { name:'C#',                weight:9,  time:'2-3 months',  difficulty:'Medium',  importance:9  },
      { name:'Unity',             weight:10, time:'3-4 months',  difficulty:'Hard',    importance:10 },
      { name:'C++',               weight:8,  time:'3-4 months',  difficulty:'Hard',    importance:8  },
      { name:'Unreal Engine',     weight:8,  time:'3-4 months',  difficulty:'Hard',    importance:8  },
      { name:'3D Math',           weight:7,  time:'1-2 months',  difficulty:'Hard',    importance:7  },
      { name:'Physics Simulation',weight:6,  time:'1-2 months',  difficulty:'Hard',    importance:6  },
      { name:'Game Design',       weight:8,  time:'2-3 months',  difficulty:'Medium',  importance:8  },
      { name:'Shader Programming',weight:6,  time:'2-3 months',  difficulty:'Hard',    importance:6  },
      { name:'Git',               weight:5,  time:'1-2 weeks',   difficulty:'Easy',    importance:5  },
      { name:'Animation',         weight:6,  time:'2-3 months',  difficulty:'Medium',  importance:6  },
    ],
    relatedInterests: ['Gaming', 'Design', 'Creativity', 'Animation'],
  },
  {
    id: 'ux-designer',
    title: 'UX/UI Designer',
    domain: 'Design',
    icon: '✏️',
    color: '#ff6b81',
    description: 'Design intuitive user experiences through research, wireframing, prototyping, and testing.',
    avgSalary: '₹4L – ₹18L',
    growth: 'High',
    requiredSkills: [
      { name:'UI/UX Design',      weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'Figma',             weight:10, time:'1-2 months',  difficulty:'Medium',  importance:10 },
      { name:'User Research',     weight:9,  time:'1-2 months',  difficulty:'Medium',  importance:9  },
      { name:'Wireframing',       weight:8,  time:'3-4 weeks',   difficulty:'Easy',    importance:8  },
      { name:'Prototyping',       weight:8,  time:'3-4 weeks',   difficulty:'Medium',  importance:8  },
      { name:'Design Systems',    weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Typography',        weight:6,  time:'2-3 weeks',   difficulty:'Easy',    importance:6  },
      { name:'Accessibility',     weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
      { name:'HTML/CSS',          weight:5,  time:'1-2 months',  difficulty:'Easy',    importance:5  },
      { name:'Usability Testing', weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
    ],
    relatedInterests: ['Design', 'Creativity', 'Psychology', 'Art'],
  },
  {
    id: 'ai-researcher',
    title: 'AI Research Scientist',
    domain: 'Research / AI',
    icon: '🧪',
    color: '#8e44ad',
    description: 'Push the boundaries of AI by developing novel algorithms, models, and theoretical frameworks.',
    avgSalary: '₹12L – ₹60L',
    growth: 'Very High',
    requiredSkills: [
      { name:'Python',            weight:10, time:'2-3 months',  difficulty:'Medium',  importance:10 },
      { name:'Deep Learning',     weight:10, time:'4-6 months',  difficulty:'Hard',    importance:10 },
      { name:'Machine Learning',  weight:10, time:'3-4 months',  difficulty:'Hard',    importance:10 },
      { name:'Mathematics',       weight:10, time:'6+ months',   difficulty:'Hard',    importance:10 },
      { name:'Research Writing',  weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'PyTorch',           weight:9,  time:'2-3 months',  difficulty:'Hard',    importance:9  },
      { name:'Statistics',        weight:9,  time:'1-2 months',  difficulty:'Medium',  importance:9  },
      { name:'Reinforcement Learning',weight:8,time:'3-4 months',difficulty:'Hard',   importance:8  },
      { name:'Computer Vision',   weight:7,  time:'2-3 months',  difficulty:'Hard',    importance:7  },
      { name:'Linear Algebra',    weight:8,  time:'1-2 months',  difficulty:'Hard',    importance:8  },
    ],
    relatedInterests: ['Research', 'AI', 'Mathematics', 'Academia'],
  },
  {
    id: 'bi-analyst',
    title: 'Business Intelligence Analyst',
    domain: 'Business Analytics',
    icon: '📈',
    color: '#27ae60',
    description: 'Transform business data into strategic insights using BI tools, dashboards, and reporting.',
    avgSalary: '₹5L – ₹20L',
    growth: 'Medium',
    requiredSkills: [
      { name:'SQL',               weight:10, time:'1 month',     difficulty:'Easy',    importance:10 },
      { name:'Power BI',          weight:9,  time:'3-4 weeks',   difficulty:'Medium',  importance:9  },
      { name:'Tableau',           weight:8,  time:'3-4 weeks',   difficulty:'Medium',  importance:8  },
      { name:'Excel',             weight:8,  time:'2-3 weeks',   difficulty:'Easy',    importance:8  },
      { name:'Data Modeling',     weight:7,  time:'1-2 months',  difficulty:'Medium',  importance:7  },
      { name:'Business Analysis', weight:8,  time:'1-2 months',  difficulty:'Medium',  importance:8  },
      { name:'Python',            weight:5,  time:'2-3 months',  difficulty:'Medium',  importance:5  },
      { name:'ETL Processes',     weight:6,  time:'1-2 months',  difficulty:'Medium',  importance:6  },
      { name:'Communication',     weight:7,  time:'Ongoing',     difficulty:'Soft',    importance:7  },
      { name:'Statistics',        weight:6,  time:'1-2 months',  difficulty:'Medium',  importance:6  },
    ],
    relatedInterests: ['Business', 'Finance', 'Analytics', 'Data'],
  },
  {
    id: 'dba',
    title: 'Database Administrator',
    domain: 'Data Engineering',
    icon: '🗄️',
    color: '#3498db',
    description: 'Design, implement, and maintain database systems ensuring performance, security, and reliability.',
    avgSalary: '₹4L – ₹18L',
    growth: 'Medium',
    requiredSkills: [
      { name:'SQL',               weight:10, time:'1 month',     difficulty:'Easy',    importance:10 },
      { name:'MySQL',             weight:8,  time:'3-4 weeks',   difficulty:'Easy',    importance:8  },
      { name:'PostgreSQL',        weight:8,  time:'3-4 weeks',   difficulty:'Easy',    importance:8  },
      { name:'MongoDB',           weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Database Design',   weight:9,  time:'1-2 months',  difficulty:'Medium',  importance:9  },
      { name:'Performance Tuning',weight:8,  time:'2-3 months',  difficulty:'Hard',    importance:8  },
      { name:'Backup & Recovery', weight:7,  time:'3-4 weeks',   difficulty:'Medium',  importance:7  },
      { name:'Linux',             weight:6,  time:'3-4 weeks',   difficulty:'Medium',  importance:6  },
      { name:'Security',          weight:6,  time:'1-2 months',  difficulty:'Medium',  importance:6  },
      { name:'Data Warehousing',  weight:6,  time:'1-2 months',  difficulty:'Medium',  importance:6  },
    ],
    relatedInterests: ['Data', 'Systems', 'Engineering'],
  },
];

/* ==========================================================
   COURSES DATABASE
   ========================================================== */
const COURSES_DB = [
  // Python
  { id:'c1', skill:'Python', title:'Python for Everybody', provider:'Coursera', providerIcon:'📘', duration:'4 months', difficulty:'Beginner', cost:'Free audit', url:'https://www.coursera.org/specializations/python', rating:4.8 },
  { id:'c2', skill:'Python', title:'Complete Python Bootcamp', provider:'Udemy', providerIcon:'🎓', duration:'22 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/complete-python-bootcamp/', rating:4.7 },
  { id:'c3', skill:'Python', title:'NPTEL Python', provider:'NPTEL', providerIcon:'🇮🇳', duration:'12 weeks', difficulty:'Beginner', cost:'Free', url:'https://nptel.ac.in', rating:4.5 },

  // Machine Learning
  { id:'c4', skill:'Machine Learning', title:'Machine Learning by Andrew Ng', provider:'Coursera', providerIcon:'📘', duration:'3 months', difficulty:'Intermediate', cost:'Free audit', url:'https://www.coursera.org/learn/machine-learning', rating:4.9 },
  { id:'c5', skill:'Machine Learning', title:'ML A-Z: Hands-On Python & R', provider:'Udemy', providerIcon:'🎓', duration:'43 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/machinelearning/', rating:4.6 },

  // Deep Learning
  { id:'c6', skill:'Deep Learning', title:'Deep Learning Specialization', provider:'Coursera', providerIcon:'📘', duration:'5 months', difficulty:'Advanced', cost:'Free audit', url:'https://www.coursera.org/specializations/deep-learning', rating:4.9 },
  { id:'c7', skill:'Deep Learning', title:'Practical Deep Learning', provider:'fast.ai', providerIcon:'🔥', duration:'8 weeks', difficulty:'Intermediate', cost:'Free', url:'https://course.fast.ai/', rating:4.8 },

  // TensorFlow
  { id:'c8', skill:'TensorFlow', title:'TensorFlow Developer Certificate', provider:'Coursera', providerIcon:'📘', duration:'4 months', difficulty:'Intermediate', cost:'Free audit', url:'https://www.coursera.org/professional-certificates/tensorflow-in-practice', rating:4.7 },

  // PyTorch
  { id:'c9', skill:'PyTorch', title:'PyTorch for Deep Learning', provider:'Udemy', providerIcon:'🎓', duration:'20 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/pytorch-for-deep-learning-and-computer-vision/', rating:4.6 },

  // SQL
  { id:'c10', skill:'SQL', title:'SQL for Data Science', provider:'Coursera', providerIcon:'📘', duration:'4 weeks', difficulty:'Beginner', cost:'Free audit', url:'https://www.coursera.org/learn/sql-for-data-science', rating:4.6 },
  { id:'c11', skill:'SQL', title:'MySQL Bootcamp', provider:'Udemy', providerIcon:'🎓', duration:'20 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/the-ultimate-mysql-bootcamp-go-from-sql-beginner-to-expert/', rating:4.7 },

  // JavaScript
  { id:'c12', skill:'JavaScript', title:'The Complete JavaScript Course', provider:'Udemy', providerIcon:'🎓', duration:'69 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/the-complete-javascript-course/', rating:4.8 },
  { id:'c13', skill:'JavaScript', title:'JavaScript Algorithms & DS', provider:'freeCodeCamp', providerIcon:'💻', duration:'Self-paced', difficulty:'Intermediate', cost:'Free', url:'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', rating:4.7 },

  // React
  { id:'c14', skill:'React', title:'React — The Complete Guide', provider:'Udemy', providerIcon:'🎓', duration:'48 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', rating:4.8 },
  { id:'c15', skill:'React', title:'Frontend Masters React', provider:'Frontend Masters', providerIcon:'🖥️', duration:'Self-paced', difficulty:'Intermediate', cost:'$39/mo', url:'https://frontendmasters.com/', rating:4.7 },

  // Node.js
  { id:'c16', skill:'Node.js', title:'Node.js, Express, MongoDB Bootcamp', provider:'Udemy', providerIcon:'🎓', duration:'42 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/', rating:4.8 },

  // Docker
  { id:'c17', skill:'Docker', title:'Docker & Kubernetes: The Practical Guide', provider:'Udemy', providerIcon:'🎓', duration:'24 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', rating:4.7 },
  { id:'c18', skill:'Docker', title:'Docker for Beginners', provider:'YouTube', providerIcon:'▶️', duration:'Self-paced', difficulty:'Beginner', cost:'Free', url:'https://youtube.com', rating:4.5 },

  // Kubernetes
  { id:'c19', skill:'Kubernetes', title:'Kubernetes for Developers', provider:'Udemy', providerIcon:'🎓', duration:'16 hours', difficulty:'Advanced', cost:'₹449', url:'https://www.udemy.com/course/learn-kubernetes/', rating:4.6 },

  // AWS
  { id:'c20', skill:'AWS', title:'AWS Certified Solutions Architect', provider:'Udemy', providerIcon:'🎓', duration:'25 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', rating:4.7 },
  { id:'c21', skill:'AWS', title:'AWS Cloud Practitioner Essentials', provider:'AWS', providerIcon:'☁️', duration:'6 hours', difficulty:'Beginner', cost:'Free', url:'https://aws.amazon.com/training/', rating:4.6 },

  // Data Visualization
  { id:'c22', skill:'Data Visualization', title:'Data Visualization with Python', provider:'Coursera', providerIcon:'📘', duration:'3 weeks', difficulty:'Beginner', cost:'Free audit', url:'https://www.coursera.org/learn/python-for-data-visualization', rating:4.5 },
  { id:'c23', skill:'Data Visualization', title:'Tableau for Beginners', provider:'Udemy', providerIcon:'🎓', duration:'8 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/tableau10/', rating:4.6 },

  // Statistics
  { id:'c24', skill:'Statistics', title:'Statistics with Python', provider:'Coursera', providerIcon:'📘', duration:'5 months', difficulty:'Intermediate', cost:'Free audit', url:'https://www.coursera.org/specializations/statistics-with-python', rating:4.6 },

  // NLP
  { id:'c25', skill:'NLP', title:'Natural Language Processing Specialization', provider:'Coursera', providerIcon:'📘', duration:'4 months', difficulty:'Advanced', cost:'Free audit', url:'https://www.coursera.org/specializations/natural-language-processing', rating:4.7 },

  // HTML/CSS
  { id:'c26', skill:'HTML/CSS', title:'Responsive Web Design', provider:'freeCodeCamp', providerIcon:'💻', duration:'Self-paced', difficulty:'Beginner', cost:'Free', url:'https://www.freecodecamp.org/learn/2022/responsive-web-design/', rating:4.7 },

  // UI/UX Design
  { id:'c27', skill:'UI/UX Design', title:'Google UX Design Certificate', provider:'Coursera', providerIcon:'📘', duration:'6 months', difficulty:'Beginner', cost:'Free audit', url:'https://www.coursera.org/professional-certificates/google-ux-design', rating:4.8 },

  // Figma
  { id:'c28', skill:'Figma', title:'Figma UI/UX Design Essentials', provider:'Udemy', providerIcon:'🎓', duration:'12 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/figma-ux-ui-design-user-experience-tutorial-course/', rating:4.7 },

  // System Design
  { id:'c29', skill:'System Design', title:'System Design Interview', provider:'Educative', providerIcon:'📚', duration:'Self-paced', difficulty:'Advanced', cost:'$49/mo', url:'https://www.educative.io/courses/grokking-the-system-design-interview', rating:4.8 },

  // Git
  { id:'c30', skill:'Git', title:'Git & GitHub — Complete Guide', provider:'Udemy', providerIcon:'🎓', duration:'6 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/git-and-github-bootcamp/', rating:4.7 },

  // Linux
  { id:'c31', skill:'Linux', title:'Linux Command Line Basics', provider:'Udemy', providerIcon:'🎓', duration:'5 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/the-linux-command-line-bootcamp/', rating:4.7 },

  // Networking
  { id:'c32', skill:'Networking', title:'Google IT Support Professional', provider:'Coursera', providerIcon:'📘', duration:'6 months', difficulty:'Beginner', cost:'Free audit', url:'https://www.coursera.org/professional-certificates/google-it-support', rating:4.8 },

  // Ethical Hacking
  { id:'c33', skill:'Ethical Hacking', title:'Ethical Hacking — Beginner to Expert', provider:'Udemy', providerIcon:'🎓', duration:'26 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/learn-ethical-hacking-from-scratch/', rating:4.7 },

  // Solidity
  { id:'c34', skill:'Solidity', title:'Ethereum and Solidity: The Complete Guide', provider:'Udemy', providerIcon:'🎓', duration:'24 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/ethereum-and-solidity-the-complete-developers-guide/', rating:4.6 },

  // Flutter
  { id:'c35', skill:'Flutter', title:'Flutter & Dart Complete Course', provider:'Udemy', providerIcon:'🎓', duration:'29 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/flutter-bootcamp-with-dart/', rating:4.8 },

  // React Native
  { id:'c36', skill:'React Native', title:'React Native — The Practical Guide', provider:'Udemy', providerIcon:'🎓', duration:'33 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/react-native-the-practical-guide/', rating:4.7 },

  // Agile/Scrum
  { id:'c37', skill:'Agile/Scrum', title:'Agile Fundamentals: Scrum & Kanban', provider:'Udemy', providerIcon:'🎓', duration:'5 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/agile-fundamentals-scrum-kanban-and-more/', rating:4.6 },

  // Power BI
  { id:'c38', skill:'Power BI', title:'Power BI Desktop for Business Intelligence', provider:'Udemy', providerIcon:'🎓', duration:'18 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/microsoft-power-bi-up-running-with-power-bi-desktop/', rating:4.7 },

  // Mathematics
  { id:'c39', skill:'Mathematics', title:'Mathematics for Machine Learning', provider:'Coursera', providerIcon:'📘', duration:'4 months', difficulty:'Intermediate', cost:'Free audit', url:'https://www.coursera.org/specializations/mathematics-machine-learning', rating:4.7 },

  // C/C++
  { id:'c40', skill:'C/C++', title:'C++ Nanodegree Program', provider:'Udacity', providerIcon:'🎓', duration:'3 months', difficulty:'Intermediate', cost:'Paid', url:'https://www.udacity.com/course/c-plus-plus-nanodegree--nd213', rating:4.6 },

  // Unity
  { id:'c41', skill:'Unity', title:'Complete C# Unity Game Developer 3D', provider:'Udemy', providerIcon:'🎓', duration:'24 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/unitycourse2/', rating:4.7 },

  // MLOps
  { id:'c42', skill:'MLOps', title:'Machine Learning Engineering for Production', provider:'Coursera', providerIcon:'📘', duration:'4 months', difficulty:'Advanced', cost:'Free audit', url:'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops', rating:4.6 },

  // Terraform
  { id:'c43', skill:'Terraform', title:'HashiCorp Terraform Associate', provider:'Udemy', providerIcon:'🎓', duration:'15 hours', difficulty:'Intermediate', cost:'₹449', url:'https://www.udemy.com/course/terraform-beginner-to-advanced/', rating:4.7 },

  // Pandas
  { id:'c44', skill:'Pandas', title:'Data Analysis with Pandas and Python', provider:'Udemy', providerIcon:'🎓', duration:'19 hours', difficulty:'Beginner', cost:'₹449', url:'https://www.udemy.com/course/data-analysis-with-pandas/', rating:4.6 },
];

/* ==========================================================
   SKILL NORMALIZATION — handle aliases
   ========================================================== */
const SKILL_ALIASES = {
  'js': 'JavaScript', 'javascript': 'JavaScript',
  'reactjs': 'React', 'react.js': 'React',
  'nodejs': 'Node.js', 'node': 'Node.js',
  'ml': 'Machine Learning',
  'dl': 'Deep Learning',
  'tf': 'TensorFlow',
  'ux': 'UI/UX Design', 'ui': 'UI/UX Design',
  'k8s': 'Kubernetes',
  'c++': 'C/C++', 'cpp': 'C/C++', 'c': 'C/C++',
  'mssql': 'SQL', 'mysql': 'SQL', 'postgresql': 'SQL', 'postgres': 'SQL',
  'html': 'HTML/CSS', 'css': 'HTML/CSS',
  'sklearn': 'Machine Learning', 'scikit-learn': 'Machine Learning',
  'tableau': 'Data Visualization',
  'mongodb': 'MongoDB',
  'express': 'Node.js',
  'next.js': 'React', 'nextjs': 'React',
};

function normalizeSkill(skill) {
  const lower = skill.toLowerCase().trim();
  return SKILL_ALIASES[lower] || skill.trim();
}

/* ==========================================================
   CAREER PREDICTION ENGINE
   ========================================================== */
function predictCareers(userSkills = [], interests = [], cgpa = 0) {
  const normalizedSkills = userSkills.map(normalizeSkill);

  const scored = CAREER_PROFILES.map(career => {
    const totalWeight = career.requiredSkills.reduce((s, sk) => s + sk.weight, 0);
    let matchedWeight = 0;
    const matchedSkills   = [];
    const missingSkills   = [];

    career.requiredSkills.forEach(req => {
      const has = normalizedSkills.some(us =>
        us.toLowerCase() === req.name.toLowerCase() ||
        us.toLowerCase().includes(req.name.toLowerCase()) ||
        req.name.toLowerCase().includes(us.toLowerCase())
      );
      if (has) {
        matchedWeight += req.weight;
        matchedSkills.push(req.name);
      } else {
        missingSkills.push(req);
      }
    });

    // Base score
    let score = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

    // Interest boost (up to +12)
    const interestBoost = career.relatedInterests.some(i =>
      interests.some(ui => ui.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(ui.toLowerCase()))
    ) ? 12 : 0;

    // CGPA modifier (up to +5 for CGPA >= 8.5)
    const cgpaBoost = cgpa >= 8.5 ? 5 : cgpa >= 7.5 ? 3 : cgpa >= 6 ? 1 : 0;

    score = Math.min(98, score + interestBoost + cgpaBoost);

    // Reasoning
    const reasons = [];
    if (matchedSkills.length > 0) reasons.push(`Strong match: ${matchedSkills.slice(0,3).join(', ')}`);
    if (interestBoost > 0)        reasons.push('Aligned with your stated interests');
    if (cgpaBoost > 0)            reasons.push(`CGPA ${cgpa.toFixed(1)} demonstrates academic strength`);
    if (matchedSkills.length >= career.requiredSkills.length * 0.8) reasons.push('You meet most skill requirements');

    return { ...career, score: Math.round(score), matchedSkills, missingSkills, reasons };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/* ==========================================================
   SKILL GAP ANALYSIS
   ========================================================== */
function getSkillGap(userSkills, career) {
  const normalizedSkills = userSkills.map(normalizeSkill);
  const current = [];
  const missing = [];

  career.requiredSkills.forEach(req => {
    const has = normalizedSkills.some(us =>
      us.toLowerCase() === req.name.toLowerCase() ||
      us.toLowerCase().includes(req.name.toLowerCase()) ||
      req.name.toLowerCase().includes(us.toLowerCase())
    );
    if (has) current.push(req);
    else missing.push(req);
  });

  return {
    current: current.sort((a,b) => b.importance - a.importance),
    missing: missing.sort((a,b) => b.importance - a.importance),
    completeness: Math.round((current.length / career.requiredSkills.length) * 100),
  };
}

/* ==========================================================
   LEARNING RECOMMENDATIONS
   ========================================================== */
function getLearningRecommendations(missingSkills = []) {
  const missingNames = missingSkills.map(s =>
    typeof s === 'string' ? s.toLowerCase() : s.name.toLowerCase()
  );

  const results = [];
  missingNames.forEach(skillName => {
    const courses = COURSES_DB.filter(c =>
      c.skill.toLowerCase() === skillName ||
      c.skill.toLowerCase().includes(skillName) ||
      skillName.includes(c.skill.toLowerCase())
    );
    if (courses.length > 0) results.push(...courses.slice(0, 2));
  });

  // Remove duplicates
  const seen = new Set();
  return results.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id); return true;
  });
}

/* ==========================================================
   RESUME TEXT KEYWORD EXTRACTION
   ========================================================== */
const ALL_SKILLS_KEYWORDS = [
  'Python','JavaScript','TypeScript','Java','C++','C#','C/C++','Go','Rust','Scala','Kotlin','Swift','Dart','PHP','Ruby','R',
  'React','Node.js','Vue.js','Angular','Next.js','Express','Django','Flask','FastAPI','Spring','Laravel','Rails',
  'HTML/CSS','HTML','CSS','Tailwind','Bootstrap','SASS',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Keras','scikit-learn','NLP','Computer Vision',
  'SQL','MySQL','PostgreSQL','MongoDB','Redis','Cassandra','DynamoDB','Firebase',
  'AWS','Azure','GCP','Docker','Kubernetes','Terraform','CI/CD','Jenkins','GitHub Actions',
  'Linux','Shell Scripting','Bash','PowerShell',
  'Git','GitHub','GitLab','Bitbucket',
  'REST APIs','GraphQL','Microservices','System Design',
  'Data Science','Data Analysis','Statistics','Pandas','NumPy','Matplotlib','Seaborn',
  'Tableau','Power BI','Excel','Data Visualization',
  'Figma','Adobe XD','Sketch','UI/UX Design','Wireframing','Prototyping',
  'Agile','Scrum','Kanban','JIRA','Confluence',
  'Networking','Cybersecurity','Ethical Hacking','Penetration Testing','Cryptography',
  'Blockchain','Solidity','Ethereum','Web3.js','Smart Contracts',
  'Unity','Unreal Engine','Game Design',
  'React Native','Flutter','Android','iOS',
  'Embedded Systems','IoT','RTOS','Microcontrollers','Arduino','Raspberry Pi',
  'MLOps','LangChain','Transformers','BERT','GPT','Reinforcement Learning',
  'Mathematics','Linear Algebra','Calculus','Probability',
];

function extractSkillsFromText(text) {
  const found = new Set();
  const lower = text.toLowerCase();
  ALL_SKILLS_KEYWORDS.forEach(skill => {
    if (lower.includes(skill.toLowerCase())) found.add(skill);
  });
  return [...found];
}

function extractEducationFromText(text) {
  const edu = {};
  // CGPA
  const cgpaMatch = text.match(/(?:cgpa|gpa|score)[:\s]*([0-9]\.[0-9]{1,2})/i);
  if (cgpaMatch) edu.cgpa = parseFloat(cgpaMatch[1]);

  // Degree
  const degrees = ['B.Tech','M.Tech','B.E.','M.E.','B.Sc','M.Sc','MBA','PhD','B.Com','B.A','MCA','BCA'];
  degrees.forEach(d => { if (text.includes(d) || text.toLowerCase().includes(d.toLowerCase())) edu.degree = d; });

  return edu;
}
