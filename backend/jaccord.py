"""Career recommendations based on Jaccard similarity.

The recommender deliberately reads the application's ``data.json`` file rather
than maintaining a second dataset.  A career's required skills are treated as
a set and compared with the skills supplied by the user:

    J(A, B) = |A intersection B| / |A union B|

The result keeps the same shape as the other prediction responses so the
existing frontend can render it without special handling.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable


DATA_PATH = Path(__file__).with_name("data.json")
CAREERS = json.loads(DATA_PATH.read_text(encoding="utf-8"))["careers"]

# Keep aliases here so this module is usable independently from Flask.
ALIASES = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "reactjs": "React",
    "react.js": "React",
    "nodejs": "Node.js",
    "node": "Node.js",
    "ml": "Machine Learning",
    "dl": "Deep Learning",
    "tf": "TensorFlow",
    "ui": "UI/UX Design",
    "ux": "UI/UX Design",
    "k8s": "Kubernetes",
    "cpp": "C/C++",
    "c++": "C/C++",
    "mysql": "SQL",
    "postgresql": "SQL",
    "postgres": "SQL",
    "sklearn": "Machine Learning",
    "scikit-learn": "Machine Learning",
    "cv": "Computer Vision",
    "nlp": "Natural Language Processing",
    "llm": "Large Language Models",
    "llms": "Large Language Models",
    "rag": "RAG",
    "huggingface": "Hugging Face",
    "hf": "Hugging Face",
}


def _skill_key(skill: str) -> str:
    """Create a stable, case-insensitive key for a skill label."""
    cleaned = str(skill).strip()
    alias_key = re.sub(r"[-_]+", " ", cleaned.lower())
    canonical = ALIASES.get(cleaned.lower(), ALIASES.get(alias_key, cleaned))
    return re.sub(r"[^a-z0-9]+", "", canonical.lower())


def _jaccard_score(user_skills: set[str], career_skills: set[str]) -> float:
    """Return the Jaccard similarity of the user and career skill sets."""
    union = user_skills | career_skills
    return len(user_skills & career_skills) / len(union) if union else 0.0


def predict_careers(
    skills: Iterable[str] | None = None,
    interests: Iterable[str] | None = None,
    cgpa: float | int | None = None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Rank careers from ``data.json`` by Jaccard skill-set similarity.

    ``interests`` and ``cgpa`` are accepted to match the existing API contract.
    They are reported as explanatory context, but do not change the Jaccard
    score; this keeps the ranking driven solely by the requested algorithm.
    """
    user_skills = {_skill_key(skill) for skill in (skills or []) if _skill_key(skill)}
    interests = [str(interest) for interest in (interests or []) if str(interest).strip()]
    results: list[dict[str, Any]] = []

    for career in CAREERS:
        required = career.get("requiredSkills", [])
        required_keys = {_skill_key(item["name"]) for item in required}
        matched = [item for item in required if _skill_key(item["name"]) in user_skills]
        missing = [item for item in required if _skill_key(item["name"]) not in user_skills]
        similarity = _jaccard_score(user_skills, required_keys)
        interest_match = any(
            interest.lower() in related.lower() or related.lower() in interest.lower()
            for interest in interests
            for related in career.get("relatedInterests", [])
        )

        reasons = [
            f"Jaccard skill similarity: {round(similarity * 100)}%",
        ]
        if matched:
            reasons.append("Shared skills: " + ", ".join(item["name"] for item in matched[:3]))
        if interest_match:
            reasons.append("Your stated interests align with this career")

        results.append(
            {
                **career,
                "score": round(similarity * 100),
                "matchedSkills": [item["name"] for item in matched],
                "missingSkills": sorted(missing, key=lambda item: item.get("importance", 0), reverse=True),
                "reasons": reasons,
                "algorithm": "jaccard",
            }
        )

    return sorted(results, key=lambda career: career["score"], reverse=True)[:limit]
