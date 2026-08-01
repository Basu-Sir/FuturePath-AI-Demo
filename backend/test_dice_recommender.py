import pytest

from dice_recommender import dice_coefficient, recommend_jobs_dice


def test_identical_skill_sets_score_one():
    assert dice_coefficient(["Python", "SQL"], ["python", "sql"]) == 1.0


def test_no_overlap_score_zero():
    assert dice_coefficient(["Python"], ["SQL", "ML"]) == 0.0


def test_partial_overlap_score_matches_expected_formula():
    # (2 * 2) / (3 + 3) = 4 / 6 = 0.6666666666666666
    assert dice_coefficient(["Python", "SQL", "ML"], ["Python", "SQL", "Data"]) == 2 / 3


def test_empty_candidate_skills_score_zero():
    assert dice_coefficient([], ["Python", "SQL"]) == 0.0


def test_empty_required_skills_score_zero():
    assert dice_coefficient(["Python", "SQL"], []) == 0.0


def test_top_n_limits_recommendations():
    jobs = [
        {"job_id": 1, "title": "Data Analyst", "required_skills": ["python", "sql"]},
        {"job_id": 2, "title": "Machine Learning Engineer", "required_skills": ["python", "ml", "pytorch"]},
        {"job_id": 3, "title": "Backend Engineer", "required_skills": ["java", "spring"]},
    ]

    recommendations = recommend_jobs_dice(["python", "sql"], jobs, top_n=2)

    assert len(recommendations) == 2
    assert [job["job_id"] for job in recommendations] == [1, 2]
    assert all(rec["method"] == "dice" for rec in recommendations)
    assert recommendations[0]["score"] >= recommendations[1]["score"]
