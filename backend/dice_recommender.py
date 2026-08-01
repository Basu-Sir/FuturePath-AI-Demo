"""Simple Dice-coefficient based job recommendation helpers.

This module provides a lightweight recommender that compares a candidate's
skill set against a list of jobs using the Dice similarity coefficient.
"""

from __future__ import annotations

from typing import Any, Iterable, Optional


def _normalize_skills(values: Iterable[str]) -> set[str]:
    """Normalize an iterable of skill strings into a unique lowercase set."""
    normalized: set[str] = set()
    for value in values:
        if not isinstance(value, str):
            continue
        cleaned = value.strip().lower()
        if cleaned:
            normalized.add(cleaned)
    return normalized


def dice_coefficient(set_a: Iterable[str], set_b: Iterable[str]) -> float:
    """Compute the Dice coefficient between two skill sets.

    Example:
        >>> dice_coefficient([" Python ", "SQL"], ["python", "ML"])
        0.5

    The inputs are normalized by lowercasing, trimming whitespace, converting
    to sets, and removing duplicates before scoring.
    """

    normalized_a = _normalize_skills(set_a)
    normalized_b = _normalize_skills(set_b)

    if not normalized_a and not normalized_b:
        return 0.0

    overlap = len(normalized_a & normalized_b)
    return (2.0 * overlap) / (len(normalized_a) + len(normalized_b))


def recommend_jobs_dice(
    candidate_skills: Iterable[str],
    job_list: Iterable[dict[str, Any]],
    top_n: Optional[int] = None,
) -> list[dict[str, Any]]:
    """Recommend jobs using the Dice similarity coefficient.

    Args:
        candidate_skills: Skills possessed by the candidate.
        job_list: Iterable of job dictionaries with ``job_id``, ``title``,
            and ``required_skills`` fields.
        top_n: Optional limit for the number of results to return.

    Returns:
        A new list of dictionaries with the fields ``job_id``, ``title``,
        ``score``, and ``method``.
    """

    if top_n is not None and top_n <= 0:
        return []

    normalized_candidate = _normalize_skills(candidate_skills)
    scored_jobs: list[dict[str, Any]] = []

    for job in job_list:
        required_skills = job.get("required_skills", [])
        score = dice_coefficient(normalized_candidate, required_skills)
        scored_jobs.append(
            {
                "job_id": job.get("job_id"),
                "title": job.get("title"),
                "score": score,
                "method": "dice",
            }
        )

    scored_jobs.sort(key=lambda item: item["score"], reverse=True)

    if top_n is not None:
        return scored_jobs[:top_n]

    return scored_jobs
