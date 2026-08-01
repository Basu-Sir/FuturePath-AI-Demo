# AI Career Recommendation Engine

A real, math-grounded system that recommends careers from a list of skills
and interests — no hardcoded skill→career rules anywhere.

## What's actually "AI" here, and what's honest statistics

Being straight with you about this, since it matters for your MDP writeup too:

| Component | What it is | Real or dressed-up? |
|---|---|---|
| Text embeddings | `sentence-transformers/all-MiniLM-L6-v2`, a pretrained transformer | **Real deep learning** — genuine neural network, not a lookup table |
| Skill/interest → O*NET dimension mapping | Cosine similarity between your typed skill and 35 official O*NET skill descriptions | Real vector math, fully generic (works for any skill phrase, in any wording) |
| Occupation scoring | 3 independent cosine similarities → z-score standardized → weighted blend → softmax | Real statistics — softmax genuinely turns scores into a probability distribution that sums to 1 |
| Personalization (optional) | XGBoost classifier trained on your own like/dislike feedback | **Real supervised learning** — the only part of the system trained on labels, because it's the only part where real labels exist |
| TF-IDF fallback | Used automatically if there's no internet to download the transformer | Real statistical NLP, just not deep learning |

Nothing pretends to be more than it is. A model can't be "trained end-to-end
to predict your true calling" — nobody has that labeled dataset. What you
*can* build honestly is exactly this: strong pretrained language
understanding + principled similarity math + a place to genuinely learn from
real feedback once you have it. That's what's here.

## Data: "all the jobs in the world"

There's no such dataset — but the closest real thing that exists is
**O*NET**, the US Department of Labor's occupational database: ~900
occupations covering essentially the entire US economy, free and public
domain, updated continuously from real worker/employer surveys. This repo
ships with:

- `sample_occupations.py` — ~88 hand-picked occupations across every major
  category (tech, medicine, trades, arts, law, science, business, military,
  agriculture, hospitality...) so the engine runs immediately, offline.
- `ONetDataLoader.load_from_onet_files()` / `.download_and_load()` in
  `career_ai_engine.py` — parses the **real, full O*NET database** (~900
  occupations) when you point it at the official files. Get them from
  <https://www.onetcenter.org/database.html> ("Text" format download).
  This sandbox can't reach that domain, but your own machine can.

## Quick start

```bash
pip install -r requirements.txt
python demo.py --skills "python, statistics, teaching" --interests "solving problems, helping people"
```

Or interactively:

```bash
python demo.py
```

To use the full O*NET database instead of the sample:

```bash
python demo.py --onet-dir /path/to/extracted/onet_db
```

## How the score is computed

For a user with typed skills `S` and interests `I`, and every occupation `O`
in the dataset:

```
semantic      = cosine( embed(S ∪ I) , embed(title(O) + description(O)) )
skill_match   = cosine( map_to_onet_skills(S) , skill_vector(O) )       # 35-dim
interest_match= cosine( map_to_riasec(I)      , riasec_vector(O) )      # 6-dim

combined = 0.45·zscore(semantic) + 0.35·zscore(skill_match) + 0.20·zscore(interest_match)

P(O | S, I) = softmax(combined / temperature)   # across ALL occupations, sums to 1
```

Weights (`alpha`, `beta`, `gamma`) and `temperature` are arguments to
`CareerRecommender.recommend()` — turn temperature down for sharper, more
confident top picks, or up for a flatter, more exploratory distribution.

## Personalizing with XGBoost (optional, needs real feedback data)

```python
# after logging (semantic, skill_match, interest_match, liked) for past
# recommendations shown to a specific user, e.g. from thumbs-up/down in your app:
engine.fit_feedback_from_features(X, y)   # X: (n,3) float array, y: (n,) 0/1
```

This is the part suited to plug into the FastAPI + pgvector system you're
already building — store `(semantic, skill_match, interest_match)` per
recommendation shown, log the label when the user reacts to it, and retrain
periodically. That's a real, growing, labeled dataset specific to your users
— which is exactly what's missing from "predict anyone's true calling"
claims in general.

## Files

- `career_ai_engine.py` — the engine (data loading, embeddings, vector math, recommender, XGBoost hook)
- `sample_occupations.py` — offline demo dataset (~88 occupations)
- `demo.py` — CLI you can run right now
- `requirements.txt`

## Extending toward your bigger project

Since this overlaps with your career-rec architecture (FastAPI + pgvector +
Claude explanation layer): swap `TfidfEmbeddingBackend`/`TransformerEmbeddingBackend`
outputs into pgvector columns, store `Occupation` skill/RIASEC vectors as
extra columns, and run `CareerRecommender`'s scoring logic as a SQL query
(`<=>` cosine distance operator in pgvector) instead of in-memory numpy once
you're at O*NET's full ~900 rows — at that scale a database index will be
faster than recomputing similarity in Python on every request.
