"""
Model 3 -- PLACEHOLDER, not implemented yet.

This file only exists to define the calling contract every model in this
platform is expected to follow, so that when the real Model 3 logic is
ready it can be dropped in here with a matching function signature and
combined_app.py will pick it up automatically (see MODEL_REGISTRY in
combined_app.py).

Contract:
    recommend(skills: list[str], interests: list[str], **kwargs) -> list[dict]

    Each dict in the returned list should, at minimum, contain:
        - "title": str            -- career/occupation name
        - "score" or "probability": number  -- how strong the match is
      Any extra fields specific to this model's own logic are fine; the
      combined endpoint in combined_app.py passes them through untouched
      under this model's own key so the frontend can render them
      separately, exactly like models 1 and 2.

Replace NotImplementedError below with real logic when this model is
ready. Nothing else in the platform needs to change.
"""
from typing import List, Dict, Any


MODEL_NAME = "Model 3 (not yet implemented)"


def recommend(skills: List[str], interests: List[str], **kwargs) -> List[Dict[str, Any]]:
    raise NotImplementedError(
        "Model 3 has not been built yet. Implement recommend(skills, interests, **kwargs) "
        "-> list[dict] in this file, matching the contract described in this module's docstring."
    )
