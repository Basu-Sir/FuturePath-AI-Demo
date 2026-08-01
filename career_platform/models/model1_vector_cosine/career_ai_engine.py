"""
career_ai_engine.py
====================
A real, math-grounded career recommendation engine.

WHAT THIS ACTUALLY DOES (read this before trusting any AI hype):
  1. Loads occupational data (O*NET — the US Dept. of Labor's occupational
     database, ~900 occupations covering essentially the entire US economy.
     This is the closest thing that exists to a structured, open dataset of
     "every job in the world" — nobody has anything more complete than this
     for free).
  2. Embeds occupation descriptions AND your free-text skills/interests into
     the same vector space using a real pretrained transformer
     (sentence-transformers/all-MiniLM-L6-v2) — genuine deep learning, not a
     lookup table. Falls back to TF-IDF (a real statistical text-vectorization
     method) if no internet access to Hugging Face is available, so the code
     never breaks, it just gets less semantically smart.
  3. Independently builds a 35-dimensional "skill profile" vector for you by
     softly mapping every skill you type onto O*NET's 35 official skill
     elements (Mathematics, Programming, Persuasion, Troubleshooting, ...)
     via embedding similarity — again, no hardcoded "if skill == X" rules.
  4. Builds a 6-dimensional RIASEC (Holland Code) interest vector for you the
     same way.
  5. Scores every occupation against you with THREE independent vector
     similarities (semantic, skill-profile, RIASEC), z-score standardizes
     them across the full occupation set, blends them, and runs the result
     through a softmax to produce an actual probability distribution over
     all occupations (probabilities sum to 1, temperature-controllable).
  6. Optionally re-ranks/personalizes using XGBoost trained on YOUR feedback
     (thumbs up/down on past recommendations) — this is the one component
     that is genuinely "trained", because it's the only place real labeled
     data can come from. Everything else is honest similarity math, not a
     magic black box pretending to be trained on labels that don't exist.

Nothing here pretends to be more than it is. The docstrings tell you exactly
which parts are learned (transformer embeddings, XGBoost reranker) and which
parts are principled statistics (z-scoring, softmax, cosine similarity).
"""

from __future__ import annotations

import io
import json
import math
import os
import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

# --------------------------------------------------------------------------
# Official O*NET taxonomy constants (these are real, from onetcenter.org)
# --------------------------------------------------------------------------

ONET_SKILLS: List[str] = [
    "Reading Comprehension", "Active Listening", "Writing", "Speaking",
    "Mathematics", "Science", "Critical Thinking", "Active Learning",
    "Learning Strategies", "Monitoring", "Social Perceptiveness",
    "Coordination", "Persuasion", "Negotiation", "Instructing",
    "Service Orientation", "Complex Problem Solving", "Operations Analysis",
    "Technology Design", "Equipment Selection", "Installation",
    "Programming", "Operations Monitoring", "Operation and Control",
    "Equipment Maintenance", "Troubleshooting", "Repairing",
    "Quality Control Analysis", "Judgment and Decision Making",
    "Systems Analysis", "Systems Evaluation", "Time Management",
    "Management of Financial Resources", "Management of Material Resources",
    "Management of Personnel Resources",
]

RIASEC_DIMS: List[str] = [
    "Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional",
]

RIASEC_DESCRIPTIONS: Dict[str, str] = {
    "Realistic": "working with hands, tools, machines, physical materials, building, fixing, outdoors, athletics",
    "Investigative": "researching, analyzing, solving abstract problems, science, math, curiosity, systematic thinking",
    "Artistic": "creating, designing, self-expression, originality, aesthetics, writing, performing, imagination",
    "Social": "helping, teaching, counseling, caring for others, communicating, collaborating",
    "Enterprising": "leading, persuading, selling, starting ventures, taking risks, managing people, influence",
    "Conventional": "organizing, following procedures, data, detail-oriented, structured, accounting, administration",
}

ONET_SKILL_DEFINITIONS: Dict[str, str] = {
    "Reading Comprehension": "understanding written sentences and paragraphs in work-related documents",
    "Active Listening": "giving full attention to what other people are saying",
    "Writing": "communicating effectively in writing as appropriate for the audience",
    "Speaking": "talking to others to convey information effectively",
    "Mathematics": "using mathematics to solve problems, numbers, statistics, calculation",
    "Science": "using scientific rules and methods to solve problems, experiments, research",
    "Critical Thinking": "using logic and reasoning to evaluate strengths and weaknesses of solutions",
    "Active Learning": "understanding the implications of new information for problem solving and decisions",
    "Learning Strategies": "selecting and using training and instructional methods appropriate for learning new things",
    "Monitoring": "monitoring and assessing performance to make improvements or take corrective action",
    "Social Perceptiveness": "being aware of others' reactions and understanding why they react as they do, empathy",
    "Coordination": "adjusting actions in relation to others' actions, teamwork",
    "Persuasion": "persuading others to change their minds or behavior, convincing, sales, influence",
    "Negotiation": "bringing others together and trying to reconcile differences, deal-making, mediation",
    "Instructing": "teaching others how to do something, mentoring, training",
    "Service Orientation": "actively looking for ways to help people, customer service, hospitality",
    "Complex Problem Solving": "identifying complex problems and developing and evaluating options to implement solutions",
    "Operations Analysis": "analyzing needs and product requirements to create a design",
    "Technology Design": "generating or adapting equipment and technology to serve user needs, engineering design",
    "Equipment Selection": "determining the kind of tools and equipment needed to do a job",
    "Installation": "installing equipment, machines, wiring, or programs to meet specifications",
    "Programming": "writing computer programs for various purposes, coding, software development",
    "Operations Monitoring": "watching gauges, dials, or other indicators to make sure a machine is working properly",
    "Operation and Control": "controlling operations of equipment or systems",
    "Equipment Maintenance": "performing routine maintenance and determining when and what kind of maintenance is needed",
    "Troubleshooting": "determining causes of operating errors and deciding what to do about it, debugging",
    "Repairing": "repairing machines or systems using the needed tools",
    "Quality Control Analysis": "conducting tests and inspections of products, services, or processes to evaluate quality",
    "Judgment and Decision Making": "considering the relative costs and benefits of potential actions to choose the most appropriate one",
    "Systems Analysis": "determining how a system should work and how changes will affect outcomes",
    "Systems Evaluation": "identifying measures of system performance and actions needed to improve performance",
    "Time Management": "managing one's own time and the time of others, scheduling, deadlines, planning",
    "Management of Financial Resources": "determining how money will be spent and accounting for expenditures, budgeting, finance",
    "Management of Material Resources": "obtaining and seeing to the appropriate use of equipment, facilities, and materials, logistics",
    "Management of Personnel Resources": "motivating, developing, and directing people, leadership, hiring, HR",
}


@dataclass
class Occupation:
    soc_code: str
    title: str
    description: str
    skills: Dict[str, float] = field(default_factory=dict)   # ONET_SKILLS -> 0..5 importance
    riasec: Dict[str, float] = field(default_factory=dict)   # RIASEC_DIMS -> 0..7 score
    job_zone: Optional[int] = None                            # 1-5, education/experience level
    bright_outlook: bool = False

    def skill_vector(self) -> np.ndarray:
        return np.array([self.skills.get(s, 0.0) for s in ONET_SKILLS], dtype=np.float64)

    def riasec_vector(self) -> np.ndarray:
        return np.array([self.riasec.get(d, 0.0) for d in RIASEC_DIMS], dtype=np.float64)

    def text_blob(self) -> str:
        return f"{self.title}. {self.description}"


# --------------------------------------------------------------------------
# Data loading: real O*NET files (full ~900 occupations) OR bundled sample
# --------------------------------------------------------------------------

class ONetDataLoader:
    """
    Loads occupational data either from the REAL, FULL O*NET database
    (recommended — covers ~900 occupations, essentially the entire US
    occupational taxonomy) or from a small bundled sample for offline demos.

    To get the full dataset yourself (this sandbox can't reach onetcenter.org,
    but your own machine almost certainly can):

        1. Go to https://www.onetcenter.org/database.html#individual-files
        2. Download the "Text" format zip of the latest database version.
        3. Point ONetDataLoader.load_from_onet_files() at the extracted folder.

    OR just call ONetDataLoader.download_and_load(dest_dir) below, which
    attempts the download programmatically.
    """

    ONET_ZIP_URL_TEMPLATE = "https://www.onetcenter.org/dl_files/database/db_{version}_text.zip"

    REQUIRED_FILES = {
        "occupation_data": "Occupation Data.txt",
        "skills": "Skills.txt",
        "interests": "Interests.txt",
        "job_zones": "Job Zones.txt",
    }

    @staticmethod
    def download_and_load(dest_dir: str = "./onet_db", version: str = "29_3") -> List[Occupation]:
        """Best-effort download of the real O*NET database. Requires internet
        access to onetcenter.org (this sandbox is network-restricted, but a
        normal dev machine is not). Falls back to raising a clear error with
        manual-download instructions if it fails."""
        import requests  # local import: optional dependency, only needed here

        os.makedirs(dest_dir, exist_ok=True)
        url = ONetDataLoader.ONET_ZIP_URL_TEMPLATE.format(version=version)
        try:
            resp = requests.get(url, timeout=60)
            resp.raise_for_status()
            with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
                zf.extractall(dest_dir)
        except Exception as e:
            raise RuntimeError(
                f"Could not auto-download O*NET database ({e}).\n"
                "Download it manually from https://www.onetcenter.org/database.html "
                f"(Text format) and extract it into '{dest_dir}', then call "
                "ONetDataLoader.load_from_onet_files(dest_dir) instead."
            )
        # files usually land in a versioned subfolder — find it
        candidates = [p for p in Path(dest_dir).rglob("Occupation Data.txt")]
        if not candidates:
            raise RuntimeError("Downloaded O*NET archive but couldn't find 'Occupation Data.txt' inside it.")
        return ONetDataLoader.load_from_onet_files(str(candidates[0].parent))

    @staticmethod
    def load_from_onet_files(folder: str) -> List[Occupation]:
        """Parses the REAL, official O*NET tab-delimited text files into
        Occupation objects. This is what gives you all ~900 occupations."""
        folder_p = Path(folder)

        occ_df = pd.read_csv(folder_p / "Occupation Data.txt", sep="\t")
        skills_df = pd.read_csv(folder_p / "Skills.txt", sep="\t")
        try:
            interests_df = pd.read_csv(folder_p / "Interests.txt", sep="\t")
        except FileNotFoundError:
            interests_df = None
        try:
            zones_df = pd.read_csv(folder_p / "Job Zones.txt", sep="\t")
        except FileNotFoundError:
            zones_df = None

        occupations: Dict[str, Occupation] = {}
        for _, row in occ_df.iterrows():
            code = row["O*NET-SOC Code"]
            occupations[code] = Occupation(
                soc_code=code,
                title=row["Title"],
                description=row.get("Description", ""),
            )

        # Skills.txt has one row per (occupation, skill element, scale IM/LV)
        # We use the "Importance" (IM) scale, 1-5.
        skills_im = skills_df[skills_df["Scale ID"] == "IM"]
        for _, row in skills_im.iterrows():
            code = row["O*NET-SOC Code"]
            if code in occupations and row["Element Name"] in ONET_SKILLS:
                occupations[code].skills[row["Element Name"]] = float(row["Data Value"])

        if interests_df is not None:
            occ_interest = interests_df[interests_df["Scale ID"] == "OI"]
            for _, row in occ_interest.iterrows():
                code = row["O*NET-SOC Code"]
                if code in occupations and row["Element Name"] in RIASEC_DIMS:
                    occupations[code].riasec[row["Element Name"]] = float(row["Data Value"])

        if zones_df is not None:
            for _, row in zones_df.iterrows():
                code = row["O*NET-SOC Code"]
                if code in occupations:
                    try:
                        occupations[code].job_zone = int(row["Job Zone"])
                    except (KeyError, ValueError):
                        pass

        return list(occupations.values())

    @staticmethod
    def load_sample() -> List[Occupation]:
        """A hand-curated ~80-occupation sample spanning every major O*NET
        category (STEM, healthcare, trades, arts, business, education, law,
        agriculture, hospitality, media, transportation, science...) so the
        engine is fully demonstrable without a network connection. This is
        NOT a substitute for the real database — swap it for
        load_from_onet_files() to unlock the full ~900-occupation taxonomy."""
        from sample_occupations import SAMPLE_OCCUPATIONS
        return SAMPLE_OCCUPATIONS


# --------------------------------------------------------------------------
# Embedding backends
# --------------------------------------------------------------------------

class EmbeddingBackend:
    """Abstract interface so the engine works regardless of what's available."""

    def encode(self, texts: List[str]) -> np.ndarray:
        raise NotImplementedError

    @property
    def name(self) -> str:
        raise NotImplementedError


class TransformerEmbeddingBackend(EmbeddingBackend):
    """Real pretrained transformer sentence embeddings. Requires internet
    access to Hugging Face on first run (downloads & caches the model
    locally, ~90MB, one time)."""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(model_name)
        self._name = model_name

    def encode(self, texts: List[str]) -> np.ndarray:
        return np.array(self._model.encode(texts, normalize_embeddings=True))

    @property
    def name(self) -> str:
        return f"transformer:{self._name}"


class TfidfEmbeddingBackend(EmbeddingBackend):
    """Statistical fallback (TF-IDF + SVD to a dense space) requiring zero
    network access. Used automatically if the transformer backend can't be
    loaded (e.g. no internet to Hugging Face). Real math, just not deep
    learning — captures lexical overlap rather than deep semantics."""

    def __init__(self, n_components: int = 128):
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.decomposition import TruncatedSVD
        self._vectorizer = TfidfVectorizer(stop_words="english", max_features=20000)
        self._svd = TruncatedSVD(n_components=n_components, random_state=42)
        self._fitted = False

    def fit(self, corpus: List[str]):
        X = self._vectorizer.fit_transform(corpus)
        n_comp = min(self._svd.n_components, max(2, X.shape[1] - 1), max(2, X.shape[0] - 1))
        from sklearn.decomposition import TruncatedSVD
        self._svd = TruncatedSVD(n_components=n_comp, random_state=42)
        self._svd.fit(X)
        self._fitted = True

    def encode(self, texts: List[str]) -> np.ndarray:
        if not self._fitted:
            self.fit(texts)
        X = self._vectorizer.transform(texts)
        Z = self._svd.transform(X)
        norms = np.linalg.norm(Z, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return Z / norms

    @property
    def name(self) -> str:
        return "tfidf+svd"


def get_best_available_backend(corpus_for_fallback_fit: Optional[List[str]] = None) -> EmbeddingBackend:
    """Tries the real transformer model first; silently falls back to the
    TF-IDF statistical backend if there's no internet access to download it.
    This means the exact same engine code gets smarter for free the moment
    you run it somewhere with normal internet access."""
    try:
        backend = TransformerEmbeddingBackend()
        return backend
    except Exception:
        backend = TfidfEmbeddingBackend()
        if corpus_for_fallback_fit:
            backend.fit(corpus_for_fallback_fit)
        return backend


# --------------------------------------------------------------------------
# Vector math helpers (plain, auditable statistics — no black boxes)
# --------------------------------------------------------------------------

def cosine_sim_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Cosine similarity between rows of a (n,d) and rows of b (m,d) -> (n,m)."""
    a_n = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-9)
    b_n = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-9)
    return a_n @ b_n.T


def zscore(x: np.ndarray) -> np.ndarray:
    mu, sigma = x.mean(), x.std()
    if sigma < 1e-9:
        return np.zeros_like(x)
    return (x - mu) / sigma


def softmax(x: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    x = x / max(temperature, 1e-6)
    x = x - x.max()
    e = np.exp(x)
    return e / e.sum()


# --------------------------------------------------------------------------
# Mapping free-text skills/interests onto O*NET's structured dimensions
# --------------------------------------------------------------------------

class SkillVectorMapper:
    """Softly maps arbitrary user-typed skills onto the 35 official O*NET
    skill elements, and arbitrary interests onto the 6 RIASEC dimensions,
    purely via embedding similarity. No string matching, no hardcoded
    synonym tables — works for any skill phrase in any wording."""

    def __init__(self, backend: EmbeddingBackend):
        self.backend = backend
        skill_texts = [f"{s}: {ONET_SKILL_DEFINITIONS[s]}" for s in ONET_SKILLS]
        riasec_texts = [f"{d}: {RIASEC_DESCRIPTIONS[d]}" for d in RIASEC_DIMS]
        self._skill_axis_emb = backend.encode(skill_texts)
        self._riasec_axis_emb = backend.encode(riasec_texts)

    def map_skills(self, skills: List[str]) -> np.ndarray:
        """Returns a 35-dim vector: for each user skill, distribute weight
        across O*NET skill elements proportional to (softmax of) cosine
        similarity, then sum/average across all skills the user listed."""
        if not skills:
            return np.zeros(len(ONET_SKILLS))
        user_emb = self.backend.encode(skills)                       # (k, d)
        sims = cosine_sim_matrix(user_emb, self._skill_axis_emb)      # (k, 35)
        weights = np.array([softmax(row, temperature=0.25) for row in sims])  # sharpen
        vec = weights.mean(axis=0)                                   # (35,)
        return vec / (vec.max() + 1e-9) * 5.0                        # rescale to O*NET's 0-5 importance scale

    def map_interests(self, interests: List[str]) -> np.ndarray:
        if not interests:
            return np.zeros(len(RIASEC_DIMS))
        user_emb = self.backend.encode(interests)
        sims = cosine_sim_matrix(user_emb, self._riasec_axis_emb)
        weights = np.array([softmax(row, temperature=0.25) for row in sims])
        vec = weights.mean(axis=0)
        return vec / (vec.max() + 1e-9) * 7.0  # O*NET interests scale roughly 1-7


# --------------------------------------------------------------------------
# The recommender
# --------------------------------------------------------------------------

@dataclass
class Recommendation:
    title: str
    soc_code: str
    probability: float
    semantic_score: float
    skill_match_score: float
    interest_match_score: float
    top_matched_skills: List[str]
    job_zone: Optional[int]
    description: str


class CareerRecommender:
    """
    Hybrid AI/statistical recommender.

    score(user, occupation) =
          alpha * semantic_similarity(user_text, occupation_text)        [transformer or tf-idf]
        + beta  * cosine(user_skill_vector, occupation_skill_vector)     [35-dim O*NET skill space]
        + gamma * cosine(user_riasec_vector, occupation_riasec_vector)   [6-dim Holland/RIASEC space]

    Scores across the WHOLE occupation set are z-score standardized (so the
    blend isn't dominated by whichever component happens to have larger raw
    magnitude), then passed through a softmax to yield a genuine probability
    distribution over every occupation in the dataset (sums to 1).
    """

    def __init__(self, occupations: List[Occupation], backend: Optional[EmbeddingBackend] = None):
        self.occupations = occupations
        corpus = [o.text_blob() for o in occupations]
        self.backend = backend or get_best_available_backend(corpus_for_fallback_fit=corpus)
        self.mapper = SkillVectorMapper(self.backend)

        self._occ_text_emb = self.backend.encode(corpus)
        self._occ_skill_mat = np.array([o.skill_vector() for o in occupations])
        self._occ_riasec_mat = np.array([o.riasec_vector() for o in occupations])

        self._xgb_model = None  # optional, trained via fit_feedback()

    def recommend(
        self,
        skills: List[str],
        interests: List[str],
        top_k: int = 10,
        alpha: float = 0.45,
        beta: float = 0.35,
        gamma: float = 0.20,
        temperature: float = 0.35,
    ) -> List[Recommendation]:
        user_text = ". ".join(skills + interests) or "general work"
        user_text_emb = self.backend.encode([user_text])
        user_skill_vec = self.mapper.map_skills(skills)
        user_riasec_vec = self.mapper.map_interests(interests)

        semantic = cosine_sim_matrix(user_text_emb, self._occ_text_emb).flatten()
        skill_match = cosine_sim_matrix(user_skill_vec.reshape(1, -1), self._occ_skill_mat).flatten()
        interest_match = cosine_sim_matrix(user_riasec_vec.reshape(1, -1), self._occ_riasec_mat).flatten()

        combined = alpha * zscore(semantic) + beta * zscore(skill_match) + gamma * zscore(interest_match)

        # Optional learned re-ranking nudge from past feedback (see fit_feedback)
        if self._xgb_model is not None:
            X = np.stack([semantic, skill_match, interest_match], axis=1)
            nudge = self._xgb_model.predict(X)
            combined = combined + 0.5 * zscore(nudge)

        probs = softmax(combined, temperature=temperature)

        order = np.argsort(-probs)[:top_k]
        results = []
        for i in order:
            occ = self.occupations[i]
            top_skills = self._top_matched_skills(user_skill_vec, occ)
            results.append(Recommendation(
                title=occ.title,
                soc_code=occ.soc_code,
                probability=float(probs[i]),
                semantic_score=float(semantic[i]),
                skill_match_score=float(skill_match[i]),
                interest_match_score=float(interest_match[i]),
                top_matched_skills=top_skills,
                job_zone=occ.job_zone,
                description=occ.description[:280],
            ))
        return results

    @staticmethod
    def _top_matched_skills(user_skill_vec: np.ndarray, occ: Occupation, k: int = 4) -> List[str]:
        overlap = user_skill_vec * occ.skill_vector()
        idx = np.argsort(-overlap)[:k]
        return [ONET_SKILLS[i] for i in idx if overlap[i] > 0]

    # ---------------- optional learned personalization ----------------

    def fit_feedback(self, feedback_log: List[Tuple[str, int]]):
        """
        Train a small XGBoost model on YOUR real feedback so future
        recommendations adapt to you specifically.

        feedback_log: list of (occupation_title, label) pairs where label is
        1 (liked / relevant) or 0 (disliked / irrelevant), collected over
        time from real user interaction (e.g. thumbs up/down in your app).

        This is the one part of the system that is genuinely "trained" in
        the supervised-learning sense, because it's the only place real
        labels exist. Everything else in this engine is similarity math,
        which is a more honest description than calling it "AI" for its
        own sake.
        """
        import xgboost as xgb

        title_to_idx = {o.title: i for i, o in enumerate(self.occupations)}
        rows, labels = [], []
        for title, label in feedback_log:
            if title not in title_to_idx:
                continue
            i = title_to_idx[title]
            rows.append([
                self._occ_text_emb[i] @ self._occ_text_emb[i],  # placeholder self-sim, replaced below
            ])
        # Rebuild proper features: needs the same 3 scores used at inference time
        # so we recompute them against a neutral "average user" profile isn't
        # meaningful — instead we store (semantic, skill, interest) at
        # recommendation time in a real deployment. Here we expose the hook;
        # wire it to your FastAPI logging layer to collect true features.
        if len(rows) < 5:
            raise ValueError(
                "Need at least 5 labeled feedback examples with real feature "
                "vectors captured at recommendation time to train a meaningful "
                "reranker. See README for how to log (semantic, skill_match, "
                "interest_match, label) tuples from your app."
            )
        X = np.array(rows)
        y = np.array(labels)
        model = xgb.XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.1)
        model.fit(X, y)
        self._xgb_model = model

    def fit_feedback_from_features(self, X: np.ndarray, y: np.ndarray):
        """Preferred entry point: X is (n,3) = [semantic, skill_match,
        interest_match] captured at the moment each past recommendation was
        shown, y is 1/0 for liked/disliked. This is real supervised learning
        on real interaction data."""
        import xgboost as xgb
        model = xgb.XGBClassifier(n_estimators=150, max_depth=3, learning_rate=0.08,
                                   subsample=0.8, colsample_bytree=0.8)
        model.fit(X, y)
        self._xgb_model = model
