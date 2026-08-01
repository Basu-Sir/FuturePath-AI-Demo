"""
model_registry.py
==================
Central place that knows about all 4 logical models and how to call each
one with a common (skills, interests, ...) input, returning a normalized
envelope so the frontend can render every model's panel the same way.

Why a registry instead of importing everything straight into the Flask
app: model 1 (vector cosine) is expensive to initialize -- it builds text
embeddings for every occupation in the dataset the first time it's used.
That has to happen exactly once, lazily, the first time it's actually
needed, not at import time (which would slow down `python combined_app.py`
even for people who only want model 2). This module handles that.

Input handling note (this is the "JSON body vs Python list vs dict, JSON
body vs two lists" adapter the integration was asked to sort out):
    - The frontend/HTTP layer sends one JSON body, e.g.
          {"skills": [...], "interests": [...], "cgpa": 8.2}
    - Flask turns that into a Python dict via request.get_json().
    - Model 1 (vector engine) wants two plain lists: skills, interests.
    - Model 2 (rule engine) wants the same two lists, plus cgpa.
    - Models 3/4 (placeholders) will want skills/interests too, by
      contract (see models/model3_placeholder/engine.py).
  So every model in this registry is called with the SAME two positional
  lists extracted once from the request dict, plus each model's own
  optional extras passed as keyword arguments. One extraction, dispatched
  to every model -- nothing is parsed or converted twice.
"""
from typing import List, Dict, Any, Optional

from models.model2_rule_based import rule_engine
from models.model3_placeholder import engine as model3_engine
from models.model4_placeholder import engine as model4_engine

# Model 1 is imported lazily inside get_vector_engine() because importing
# career_ai_engine.py itself is cheap, but *constructing* a CareerRecommender
# builds an embedding index over the whole occupation dataset, which is the
# expensive part we want to defer/singleton.
_vector_engine_singleton = None


def get_vector_engine():
    """Lazily build (once) and return the Model 1 CareerRecommender."""
    global _vector_engine_singleton
    if _vector_engine_singleton is None:
        import sys
        from pathlib import Path
        model1_dir = str(Path(__file__).parent / "models" / "model1_vector_cosine")
        if model1_dir not in sys.path:
            sys.path.insert(0, model1_dir)
        from career_ai_engine import CareerRecommender, ONetDataLoader

        occupations = ONetDataLoader.load_sample()
        _vector_engine_singleton = CareerRecommender(occupations)
    return _vector_engine_singleton


def _ok(model_id: str, model_name: str, results: Any) -> Dict[str, Any]:
    return {"model_id": model_id, "model_name": model_name, "status": "ok", "results": results}


def _error(model_id: str, model_name: str, message: str) -> Dict[str, Any]:
    return {"model_id": model_id, "model_name": model_name, "status": "error", "error": message, "results": []}


def _not_implemented(model_id: str, model_name: str) -> Dict[str, Any]:
    return {"model_id": model_id, "model_name": model_name, "status": "not_implemented", "results": []}


def run_model1_vector_cosine(skills: List[str], interests: List[str], top_k: int = 10) -> Dict[str, Any]:
    try:
        engine = get_vector_engine()
        recs = engine.recommend(skills, interests, top_k=top_k)
        results = [
            {
                "title": r.title,
                "soc_code": r.soc_code,
                "probability": r.probability,
                "match_score_percent": round(r.probability * 100, 2),
                "semantic_score": r.semantic_score,
                "skill_match_score": r.skill_match_score,
                "interest_match_score": r.interest_match_score,
                "top_matched_skills": r.top_matched_skills,
                "job_zone": r.job_zone,
                "description": r.description,
            }
            for r in recs
        ]
        return _ok("model_1_vector_cosine", "Vector Cosine Similarity Engine", results)
    except Exception as exc:  # keep one model's failure from breaking the others
        return _error("model_1_vector_cosine", "Vector Cosine Similarity Engine", str(exc))


def run_model2_rule_based(skills: List[str], interests: List[str], cgpa: float = 0.0) -> Dict[str, Any]:
    try:
        recs = rule_engine.predict(skills, interests, cgpa)
        results = [{**career, "match_score_percent": career["score"]} for career in recs]
        return _ok("model_2_rule_based", "Direct-Mapping Skill Match Engine", results)
    except Exception as exc:
        return _error("model_2_rule_based", "Direct-Mapping Skill Match Engine", str(exc))


def run_model3(skills: List[str], interests: List[str], **kwargs) -> Dict[str, Any]:
    try:
        results = model3_engine.recommend(skills, interests, **kwargs)
        return _ok("model_3", model3_engine.MODEL_NAME, results)
    except NotImplementedError:
        return _not_implemented("model_3", model3_engine.MODEL_NAME)
    except Exception as exc:
        return _error("model_3", model3_engine.MODEL_NAME, str(exc))


def run_model4(skills: List[str], interests: List[str], **kwargs) -> Dict[str, Any]:
    try:
        results = model4_engine.recommend(skills, interests, **kwargs)
        return _ok("model_4", model4_engine.MODEL_NAME, results)
    except NotImplementedError:
        return _not_implemented("model_4", model4_engine.MODEL_NAME)
    except Exception as exc:
        return _error("model_4", model4_engine.MODEL_NAME, str(exc))


def run_all(skills: List[str], interests: List[str], cgpa: float = 0.0, top_k: int = 10) -> Dict[str, Any]:
    """Runs every model and returns all 4 results keyed separately, for a
    single screen that shows each model's output side by side."""
    return {
        "input": {"skills": skills, "interests": interests, "cgpa": cgpa},
        "models": {
            "model_1_vector_cosine": run_model1_vector_cosine(skills, interests, top_k=top_k),
            "model_2_rule_based": run_model2_rule_based(skills, interests, cgpa=cgpa),
            "model_3": run_model3(skills, interests),
            "model_4": run_model4(skills, interests),
        },
    }
