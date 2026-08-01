# Career Platform -- Combined Backend

This folder integrates the two career-recommendation logics you had into
one Flask backend, with slots ready for the two models you haven't built
yet. Nothing from either original file was modified -- see "What's
untouched" below.

## Structure

```
career_platform/
├── combined_app.py              <- run this. Single Flask app, all routes.
├── model_registry.py            <- loads all 4 models, normalizes their output
├── requirements.txt
│
├── models/
│   ├── model1_vector_cosine/
│   │   ├── career_ai_engine.py  <- UNTOUCHED original (semantic + skill + interest cosine, softmax)
│   │   ├── sample_occupations.py<- UNTOUCHED original
│   │   ├── demo.py              <- UNTOUCHED original CLI demo
│   │   └── README_original.md
│   │
│   ├── model2_rule_based/
│   │   ├── original_app.py      <- UNTOUCHED original app.py, kept for reference/diff
│   │   ├── data.json            <- UNTOUCHED original careers + courses data
│   │   └── rule_engine.py       <- the SAME logic from original_app.py, lifted out
│   │                               of the Flask route handlers so it's callable
│   │                               as plain Python. Not one line of scoring logic
│   │                               changed -- see the docstring at the top of the file.
│   │
│   ├── model3_placeholder/
│   │   └── engine.py            <- stub defining the contract; raises
│   │                               NotImplementedError until you build it
│   │
│   └── model4_placeholder/
│       └── engine.py            <- same idea as model 3
│
└── _original_vector_backend_reference/   <- full untouched copy of the original
                                              Vector_Backend.zip contents, kept as
                                              a reference / fallback
```

## Why it's split this way

- **Nothing was overwritten.** Your two original files (`career_ai_engine.py`
  and `app.py`) still exist byte-for-byte identical inside `models/`. If
  anything about the integration ever looks wrong, you can diff against
  these originals to see exactly what changed (nothing, in terms of logic).
- **model2's logic moved, but didn't change.** `app.py` mixed Flask route
  handling together with the actual scoring logic. `rule_engine.py` is that
  same logic with the `@app.post(...)` decorators and `request`/`jsonify`
  calls removed, so it can be called directly as
  `rule_engine.predict(skills, interests, cgpa)` -- both from
  `combined_app.py`'s routes and, in the future, from anything else that
  wants to call it in-process.
- **model1 is used exactly as designed**, via its own public API
  (`CareerRecommender(occupations).recommend(skills, interests, top_k=...)`).
  `model_registry.py` builds one `CareerRecommender` the first time it's
  needed and reuses it (building its embedding index is the expensive
  part -- doing that once per process, not once per request, is what makes
  this fast).
- **Both models take the same two inputs** (`skills: list[str]`,
  `interests: list[str]`), which turned out to make the "JSON body vs.
  Python list" conversion trivial: `combined_app.py` parses the incoming
  JSON into those two lists (plus `cgpa` for model 2) exactly once, in
  `_extract_skills_interests_cgpa()`, and hands the same two lists to
  every model. See the docstring at the top of `model_registry.py` for
  the full explanation.
- **Models 3 & 4 are placeholders with a defined contract.** Once you have
  their real logic, put it in `models/model3_placeholder/engine.py` (or
  rename the folder) implementing `recommend(skills, interests, **kwargs)
  -> list[dict]`. `model_registry.py` and `combined_app.py` need zero
  changes -- they already call this function and will start returning
  real results instead of `not_implemented` the moment it stops raising
  `NotImplementedError`.

## Running it

```bash
cd career_platform
pip install -r requirements.txt
python combined_app.py
```

Flask will start on `http://127.0.0.1:5000` by default.

## API endpoints

### Preserved from your original `app.py` (same path, same request/response shape)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/careers/predict` | Model 2, same output shape as before |
| POST | `/api/skill-gap` | Model 2 |
| POST | `/api/learning-recommendations` | Model 2 |
| POST | `/api/resume/analyze` | Model 2 |
| GET | `/` | serves `index.html` if present in this folder |
| GET | `/<path:asset>` | serves any static asset in this folder |

### New
| Method | Path | Notes |
|---|---|---|
| POST | `/api/vector/recommend` | Model 1 (vector cosine) on its own |
| POST | `/api/model3/recommend` | Model 3 -- returns `501` + `"not_implemented"` until built |
| POST | `/api/model4/recommend` | Model 4 -- same, until built |
| POST | `/api/recommend/all` | **Runs all 4 models**, returns them keyed separately -- this is the one your single results screen should call |
| GET | `/api/health` | quick status of which models are active |

### Request body (shared by every `/recommend*` and `/predict` route)
```json
{
  "skills": ["Python", "SQL", "Machine Learning"],
  "interests": ["technology", "solving puzzles"],
  "cgpa": 8.2,
  "top_k": 10
}
```
(`cgpa` and `top_k` are optional -- only model 2 uses `cgpa`; `top_k` only
affects model 1 and defaults to 10.)

### `/api/recommend/all` response shape
```json
{
  "input": { "skills": [...], "interests": [...], "cgpa": 8.2 },
  "models": {
    "model_1_vector_cosine": { "status": "ok", "results": [ ... ] },
    "model_2_rule_based":    { "status": "ok", "results": [ ... ] },
    "model_3":                { "status": "not_implemented", "results": [] },
    "model_4":                { "status": "not_implemented", "results": [] }
  }
}
```
Every model's own fields are passed through untouched inside its
`results` array (model 1's `probability`/`semantic_score`/etc., model 2's
`matchedSkills`/`missingSkills`/`reasons`/etc.), plus one common
`match_score_percent` field added to both so the frontend has one number
it can sort/display consistently across all 4 panels without needing to
know each model's native scale.

## Connecting the JS frontend later

Every route above returns plain JSON and accepts `fetch(..., {method:
"POST", headers: {"Content-Type": "application/json"}, body:
JSON.stringify({...})})` from any JS frontend -- no server-side templating
is involved. `/api/recommend/all` is the one endpoint that already
matches "show all 4 models on one screen"; the frontend just needs to
render `data.models.model_1_vector_cosine`, `...model_2_rule_based`,
`...model_3`, `...model_4` in four (or however many) panels, using
`status` to decide whether to show results, an error state, or a "coming
soon" placeholder.

If Flask's built-in CORS restrictions get in the way once the JS frontend
runs on its own dev server/port, add `flask-cors` and
`CORS(app)` near the top of `combined_app.py` -- not included by default
since it wasn't asked for and isn't needed if the frontend is served from
this same Flask app.
