"""
combined_app.py
================
Single Flask entry point that integrates every career-recommendation model
in this project behind one backend, ready for a JS frontend to consume.

Structure (see README_INTEGRATION.md for the full explanation):
    models/model1_vector_cosine/   -- original career_ai_engine.py, untouched
    models/model2_rule_based/      -- original app.py's logic, extracted (unchanged) into rule_engine.py
    models/model3_placeholder/     -- stub, not built yet
    models/model4_placeholder/     -- stub, not built yet
    model_registry.py              -- loads all 4, normalizes their outputs
    combined_app.py                -- (this file) Flask app + routes

Nothing from the original app.py was deleted or rewritten -- its exact
logic lives on unchanged in models/model2_rule_based/rule_engine.py, and
the original file itself is kept untouched at
models/model2_rule_based/original_app.py for reference/diff purposes.

Routes preserved from the original app.py (same paths, same request/response
shape, so any frontend already wired to app.py keeps working):
    POST /api/careers/predict
    POST /api/skill-gap
    POST /api/learning-recommendations
    POST /api/resume/analyze
    GET  /            (serves index.html)
    GET  /<path:asset> (serves static assets)

New routes added by this integration:
    POST /api/vector/recommend      -- model 1 (vector cosine) on its own
    POST /api/model3/recommend      -- model 3 placeholder (returns 501 until built)
    POST /api/model4/recommend      -- model 4 placeholder (returns 501 until built)
    POST /api/recommend/all         -- runs all 4 models, returns them keyed
                                        separately for a single results screen
    GET  /api/health                -- basic liveness/status check
"""
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

import model_registry
from models.model2_rule_based import rule_engine

ROOT = Path(__file__).resolve().parent

app = Flask(__name__)


def _extract_skills_interests_cgpa(payload: dict):
    """The one place raw request JSON is turned into the plain
    (skills: list[str], interests: list[str], cgpa: float) shape every
    model in the registry expects. Every route below funnels through this
    so the JSON-body -> Python-list conversion happens exactly once."""
    skills = payload.get("skills", []) or []
    interests = payload.get("interests", []) or []
    cgpa = payload.get("cgpa", 0) or 0
    return list(skills), list(interests), float(cgpa)


# ---------------------------------------------------------------------------
# Original Model 2 routes, preserved at their original paths/shapes
# ---------------------------------------------------------------------------

@app.post("/api/careers/predict")
def predict_careers():
    payload = request.get_json(silent=True) or {}
    skills, interests, cgpa = _extract_skills_interests_cgpa(payload)
    return jsonify(rule_engine.predict(skills, interests, cgpa))


@app.post("/api/skill-gap")
def get_skill_gap():
    payload = request.get_json(silent=True) or {}
    career = rule_engine.get_career_by_id(payload.get("careerId"))
    if not career:
        return jsonify({"error": "Career not found"}), 404
    return jsonify(rule_engine.skill_gap(payload.get("skills", []), career))


@app.post("/api/learning-recommendations")
def learning_recommendations():
    payload = request.get_json(silent=True) or {}
    missing_skills = [skill if isinstance(skill, str) else skill.get("name", "") for skill in payload.get("missingSkills", [])]
    return jsonify(rule_engine.learning_recommendations(missing_skills))


@app.post("/api/resume/analyze")
def analyze_resume():
    text = (request.get_json(silent=True) or {}).get("text", "")
    return jsonify(rule_engine.analyze_resume(text))


# ---------------------------------------------------------------------------
# New: Model 1 (vector cosine) on its own
# ---------------------------------------------------------------------------

@app.post("/api/vector/recommend")
def vector_recommend():
    payload = request.get_json(silent=True) or {}
    skills, interests, _ = _extract_skills_interests_cgpa(payload)
    top_k = int(payload.get("top_k", 10) or 10)
    result = model_registry.run_model1_vector_cosine(skills, interests, top_k=top_k)
    status_code = 200 if result["status"] == "ok" else 500
    return jsonify(result), status_code


# ---------------------------------------------------------------------------
# New: Model 3 / Model 4 placeholders
# ---------------------------------------------------------------------------

@app.post("/api/model3/recommend")
def model3_recommend():
    payload = request.get_json(silent=True) or {}
    skills, interests, _ = _extract_skills_interests_cgpa(payload)
    result = model_registry.run_model3(skills, interests)
    status_code = 501 if result["status"] == "not_implemented" else 200
    return jsonify(result), status_code


@app.post("/api/model4/recommend")
def model4_recommend():
    payload = request.get_json(silent=True) or {}
    skills, interests, _ = _extract_skills_interests_cgpa(payload)
    result = model_registry.run_model4(skills, interests)
    status_code = 501 if result["status"] == "not_implemented" else 200
    return jsonify(result), status_code


# ---------------------------------------------------------------------------
# New: combined endpoint -- all 4 models, keyed separately, one call
# ---------------------------------------------------------------------------

@app.post("/api/recommend/all")
def recommend_all():
    payload = request.get_json(silent=True) or {}
    skills, interests, cgpa = _extract_skills_interests_cgpa(payload)
    top_k = int(payload.get("top_k", 10) or 10)
    return jsonify(model_registry.run_all(skills, interests, cgpa=cgpa, top_k=top_k))


# ---------------------------------------------------------------------------
# Health check + static file serving (preserved from original app.py)
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "models": {
            "model_1_vector_cosine": "active",
            "model_2_rule_based": "active",
            "model_3": "not_implemented",
            "model_4": "not_implemented",
        },
    })


@app.get("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:asset>")
def static_files(asset):
    return send_from_directory(ROOT, asset)


if __name__ == "__main__":
    app.run(debug=True)
