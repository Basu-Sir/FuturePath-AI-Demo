from pathlib import Path
import json
import re

from flask import Flask, jsonify, request, send_from_directory

try:
    from .dice_routes import dice_bp
except ImportError:  # pragma: no cover - fallback for direct script execution
    from dice_routes import dice_bp


ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((Path(__file__).parent / "data.json").read_text(encoding="utf-8"))
CAREERS = DATA["careers"]
COURSES = DATA["courses"]
ALIASES = {
    "js": "JavaScript", "javascript": "JavaScript", "reactjs": "React", "react.js": "React",
    "nodejs": "Node.js", "node": "Node.js", "ml": "Machine Learning", "dl": "Deep Learning",
    "tf": "TensorFlow", "ux": "UI/UX Design", "ui": "UI/UX Design", "k8s": "Kubernetes",
    "c++": "C/C++", "cpp": "C/C++", "c": "C/C++", "mssql": "SQL", "mysql": "SQL",
    "postgresql": "SQL", "postgres": "SQL", "html": "HTML/CSS", "css": "HTML/CSS",
    "sklearn": "Machine Learning", "scikit-learn": "Machine Learning", "tableau": "Data Visualization",
    "mongodb": "MongoDB", "express": "Node.js", "next.js": "React", "nextjs": "React", "cv": "Computer Vision", "nlp": "Natural Language Processing", "llm": "Large Language Models", "llms": "Large Language Models", "rag": "RAG", "retrieval augmented generation": "RAG", "retrieval-augmented-generation": "RAG",
    "hf": "Hugging Face", "huggingface": "Hugging Face", "langchain": "LangChain", "opencv": "OpenCV", "ros": "ROS", "ros2": "ROS",
    "spark": "Apache Spark", "kafka": "Apache Kafka", "airflow": "Apache Airflow", "etl": "ETL Pipelines", "dbt": "Data Modeling",
    "terraform": "Terraform", "grafana": "Grafana", "prometheus": "Prometheus", "redshift": "Amazon Redshift", "snowflake": "Snowflake",
    "salesforce": "Salesforce", "apex": "Apex", "mqtt": "MQTT", "esp32": "ESP32", "pcb": "PCB Design", "aws": "AWS", "gcp": "GCP", "azure": "Azure", "tf2": "TensorFlow", "pytorch": "PyTorch", "opencv-python": "OpenCV",
    "vision": "Computer Vision", "genai": "Generative AI", "gen ai": "Generative AI", "llama": "Large Language Models",
    "bert": "Transformers", "transformer": "Transformers","transformers": "Transformers", "reinforcement learning": "Reinforcement Learning", "rl": "Reinforcement Learning",
}
SKILL_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C/C++", "Go", "Rust", "Scala", "Kotlin", "Swift", "Dart", "PHP", "Ruby", "R",
    "React", "Node.js", "Vue.js", "Angular", "Next.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Laravel", "Rails",
    "HTML/CSS", "HTML", "CSS", "Tailwind", "Bootstrap", "SASS", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras", "scikit-learn", "NLP", "Computer Vision",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Firebase", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "GitHub Actions",
    "Linux", "Shell Scripting", "Bash", "PowerShell", "Git", "GitHub", "GitLab", "Bitbucket", "REST APIs", "GraphQL", "Microservices", "System Design",
    "Data Science", "Data Analysis", "Statistics", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Tableau", "Power BI", "Excel", "Data Visualization",
    "Figma", "Adobe XD", "Sketch", "UI/UX Design", "Wireframing", "Prototyping", "Agile", "Scrum", "Kanban", "JIRA", "Confluence",
    "Networking", "Cybersecurity", "Ethical Hacking", "Penetration Testing", "Cryptography", "Blockchain", "Solidity", "Ethereum", "Web3.js", "Smart Contracts",
    "Unity", "Unreal Engine", "Game Design", "React Native", "Flutter", "Android", "iOS", "Embedded Systems", "IoT", "RTOS", "Microcontrollers", "Arduino", "Raspberry Pi",
    "MLOps", "LangChain", "Transformers", "BERT", "GPT", "Reinforcement Learning", "Mathematics", "Linear Algebra", "Calculus", "Probability", "Natural Language Processing","Large Language Models",
    "Prompt Engineering", "RAG", "Retrieval-Augmented Generation", "Vector Databases", "Fine-tuning", "LoRA", "QLoRA", "LangChain", "Hugging Face", "OpenCV", "Apache Spark", "Apache Kafka", "Apache Airflow", "ETL Pipelines", "Data Modeling", "Data Warehousing",
    "Prometheus", "Grafana", "Monitoring", "Logging", "Observability", "Redshift", "Snowflake", "Salesforce", "Apex", "MQTT", "ESP32", "PCB Design", "SAP ERP",
    "ERP Implementation", "Business Process Analysis", "Requirements Gathering", "Project Management", "Documentation", "Data Migration",
]

app = Flask(__name__)
app.register_blueprint(dice_bp)


def normalize(skill):
    cleaned = skill.strip()
    alias_key = cleaned.lower()
    # Treat punctuation variants (for example, RAG's hyphenated spelling) as
    # the same alias without making them substring matches.
    alias_key = re.sub(r"[-_]+", " ", alias_key)
    return ALIASES.get(cleaned.lower(), ALIASES.get(alias_key, cleaned))


def skill_key(skill):
    """Return a comparison key for one named skill.

    Skills are labels, not free text: using a substring comparison made short
    labels such as ``R`` match unrelated skills including RAG and Docker.
    """
    normalized = normalize(str(skill)).lower()
    return re.sub(r"[^a-z0-9]+", "", normalized)


def matches(skills, required):
    required_key = skill_key(required)
    return bool(required_key) and required_key in {skill_key(skill) for skill in skills}


def skill_gap(skills, career):
    normalized = [normalize(skill) for skill in skills]
    current = [skill for skill in career["requiredSkills"] if matches(normalized, skill["name"])]
    missing = [skill for skill in career["requiredSkills"] if skill not in current]
    return {
        "current": sorted(current, key=lambda skill: skill["importance"], reverse=True),
        "missing": sorted(missing, key=lambda skill: skill["importance"], reverse=True),
        "completeness": round(len(current) / len(career["requiredSkills"]) * 100),
    }


def predict(skills, interests, cgpa):
    normalized = [normalize(skill) for skill in skills]
    results = []
    for career in CAREERS:
        gap = skill_gap(normalized, career)
        total_weight = sum(skill["weight"] for skill in career["requiredSkills"])
        matched_weight = sum(skill["weight"] for skill in gap["current"])
        interest_boost = 12 if any(interest.lower() in related.lower() or related.lower() in interest.lower() for interest in interests for related in career["relatedInterests"]) else 0
        cgpa_boost = 5 if cgpa >= 8.5 else 3 if cgpa >= 7.5 else 1 if cgpa >= 6 else 0
        score = min(98, matched_weight / total_weight * 100 + interest_boost + cgpa_boost) if total_weight else 0
        reasons = []
        if gap["current"]:
            reasons.append("Strong match: " + ", ".join(skill["name"] for skill in gap["current"][:3]))
        if interest_boost:
            reasons.append("Aligned with your stated interests")
        if cgpa_boost:
            reasons.append(f"CGPA {cgpa:.1f} demonstrates academic strength")
        if len(gap["current"]) >= len(career["requiredSkills"]) * 0.8:
            reasons.append("You meet most skill requirements")
        results.append({**career, "score": round(score), "matchedSkills": [skill["name"] for skill in gap["current"]], "missingSkills": gap["missing"], "reasons": reasons})
    return sorted(results, key=lambda career: career["score"], reverse=True)[:5]


@app.post("/api/careers/predict")
def predict_careers():
    payload = request.get_json(silent=True) or {}
    return jsonify(predict(payload.get("skills", []), payload.get("interests", []), float(payload.get("cgpa", 0) or 0)))


@app.post("/api/skill-gap")
def get_skill_gap():
    payload = request.get_json(silent=True) or {}
    career = next((career for career in CAREERS if career["id"] == payload.get("careerId")), None)
    if not career:
        return jsonify({"error": "Career not found"}), 404
    return jsonify(skill_gap(payload.get("skills", []), career))


@app.post("/api/learning-recommendations")
def learning_recommendations():
    payload = request.get_json(silent=True) or {}
    missing_skills = [skill if isinstance(skill, str) else skill.get("name", "") for skill in payload.get("missingSkills", [])]
    results, seen = [], set()
    for missing_skill in missing_skills:
        for course in COURSES:
            if course["skill"].lower() == missing_skill.lower() or course["skill"].lower() in missing_skill.lower() or missing_skill.lower() in course["skill"].lower():
                if course["id"] not in seen:
                    seen.add(course["id"])
                    results.append(course)
                if sum(1 for result in results if result["skill"].lower() == course["skill"].lower()) >= 2:
                    break
    return jsonify(results)


@app.post("/api/resume/analyze")
def analyze_resume():
    text = (request.get_json(silent=True) or {}).get("text", "")
    lowered = text.lower()
    # A skill must stand on its own.  A plain substring search makes short
    # skills such as ``R`` match letters inside unrelated words (for example,
    # "engineer"), which produces false skills and distorted predictions.
    def appears_as_skill(skill):
        return re.search(rf"(?<!\w){re.escape(skill)}(?!\w)", text, re.IGNORECASE) is not None

    skills = list(dict.fromkeys(skill for skill in SKILL_KEYWORDS if appears_as_skill(skill)))
    cgpa_match = re.search(r"(?:cgpa|gpa|score)[:\s]*([0-9]\.[0-9]{1,2})", text, re.IGNORECASE)
    degree = next((degree for degree in ["B.Tech", "M.Tech", "B.E.", "M.E.", "B.Sc", "M.Sc", "MBA", "PhD", "B.Com", "B.A", "MCA", "BCA"] if degree.lower() in lowered), None)
    return jsonify({"skills": skills, "education": {"cgpa": float(cgpa_match.group(1)) if cgpa_match else None, "degree": degree}})


@app.get("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:asset>")
def static_files(asset):
    return send_from_directory(ROOT, asset)


if __name__ == "__main__":
    app.run(debug=True)
