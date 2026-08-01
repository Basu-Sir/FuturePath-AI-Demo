"""
demo.py
========
Command-line demo for the career recommendation engine.

Usage:
    python demo.py
        -> interactive prompts

    python demo.py --skills "python, statistics, public speaking" --interests "solving puzzles, helping people, technology"
        -> non-interactive, prints top matches directly

By default this uses the bundled ~80-occupation sample dataset so it runs
with zero setup. To use the REAL, full O*NET database (~900 occupations),
see the instructions printed at the bottom of this file / in README.md.
"""
import argparse

from career_ai_engine import CareerRecommender, ONetDataLoader


def print_results(results):
    print()
    print(f"{'#':<3}{'Career':<32}{'Prob.':<8}{'Semantic':<10}{'SkillFit':<10}{'InterestFit':<12}Job Zone")
    print("-" * 90)
    for i, r in enumerate(results, 1):
        print(f"{i:<3}{r.title:<32}{r.probability*100:>5.1f}%  "
              f"{r.semantic_score:>7.3f}   {r.skill_match_score:>7.3f}   "
              f"{r.interest_match_score:>7.3f}     {r.job_zone or '-'}")
        if r.top_matched_skills:
            print(f"      matched skills: {', '.join(r.top_matched_skills)}")
    print()
    print("Probabilities are a softmax over z-scored similarity across every")
    print("occupation in the dataset — they sum to 1 across ALL occupations,")
    print("not just the ones shown above.")


def main():
    parser = argparse.ArgumentParser(description="AI-assisted career recommender")
    parser.add_argument("--skills", type=str, default=None,
                         help="comma-separated list of skills")
    parser.add_argument("--interests", type=str, default=None,
                         help="comma-separated list of interests")
    parser.add_argument("--top", type=int, default=10)
    parser.add_argument("--onet-dir", type=str, default=None,
                         help="path to full O*NET text-file database, if you have it")
    args = parser.parse_args()

    if args.onet_dir:
        print(f"Loading full O*NET database from {args.onet_dir} ...")
        occupations = ONetDataLoader.load_from_onet_files(args.onet_dir)
        print(f"Loaded {len(occupations)} real O*NET occupations.")
    else:
        occupations = ONetDataLoader.load_sample()
        print(f"Loaded {len(occupations)} sample occupations "
              f"(pass --onet-dir for the full ~900-occupation O*NET database).")

    print("Building embeddings & vector index...")
    engine = CareerRecommender(occupations)
    print(f"Embedding backend in use: {engine.backend.name}")

    if args.skills:
        skills = [s.strip() for s in args.skills.split(",") if s.strip()]
    else:
        skills = [s.strip() for s in input("\nList your skills (comma-separated): ").split(",") if s.strip()]

    if args.interests:
        interests = [s.strip() for s in args.interests.split(",") if s.strip()]
    else:
        interests = [s.strip() for s in input("List your interests (comma-separated): ").split(",") if s.strip()]

    results = engine.recommend(skills, interests, top_k=args.top)
    print_results(results)


if __name__ == "__main__":
    main()