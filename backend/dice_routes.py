"""Flask blueprint for Dice-based job recommendations."""

from __future__ import annotations

from typing import Any

from flask import Blueprint, jsonify, request

try:
    from .dice_recommender import recommend_jobs_dice
except ImportError:  # pragma: no cover - fallback for direct script execution
    from dice_recommender import recommend_jobs_dice


dice_bp = Blueprint("dice_bp", __name__)


def _error(message: str, status_code: int = 400):
    return jsonify({"error": message}), status_code


@dice_bp.post("/api/recommend/dice")
def recommend_dice():
    """Recommend jobs for a candidate using the Dice similarity coefficient."""
    if not request.is_json:
        return _error("Request body must be valid JSON.", 400)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _error("JSON body must be an object.", 400)

    if "candidate_skills" not in payload:
        return _error("Missing required field: candidate_skills.", 400)
    if "jobs" not in payload:
        return _error("Missing required field: jobs.", 400)

    candidate_skills = payload.get("candidate_skills")
    jobs = payload.get("jobs")

    if not isinstance(candidate_skills, list) or not all(isinstance(skill, str) for skill in candidate_skills):
        return _error("candidate_skills must be a list of strings.", 400)

    if not isinstance(jobs, list):
        return _error("jobs must be a list.", 400)

    normalized_jobs: list[dict[str, Any]] = []
    for index, job in enumerate(jobs):
        if not isinstance(job, dict):
            return _error(f"jobs[{index}] must be an object.", 400)

        if "job_id" not in job:
            return _error(f"jobs[{index}] is missing required field: job_id.", 400)
        if "title" not in job:
            return _error(f"jobs[{index}] is missing required field: title.", 400)
        if "required_skills" not in job:
            return _error(f"jobs[{index}] is missing required field: required_skills.", 400)

        title = job.get("title")
        required_skills = job.get("required_skills")

        if not isinstance(title, str) or not title.strip():
            return _error(f"jobs[{index}].title must be a non-empty string.", 400)
        if not isinstance(required_skills, list) or not all(isinstance(skill, str) for skill in required_skills):
            return _error(f"jobs[{index}].required_skills must be a list of strings.", 400)

        normalized_jobs.append(
            {
                "job_id": job.get("job_id"),
                "title": title,
                "required_skills": required_skills,
            }
        )

    top_n = payload.get("top_n")
    if top_n is not None:
        if not isinstance(top_n, int) or isinstance(top_n, bool) or top_n <= 0:
            return _error("top_n must be a positive integer.", 400)

    recommendations = recommend_jobs_dice(candidate_skills, normalized_jobs, top_n=top_n)
    return jsonify({"method": "dice", "recommendations": recommendations})
