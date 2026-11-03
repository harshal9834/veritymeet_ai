import unittest
from datetime import datetime
from backend.app.services.scoring_service import scoring_service
from backend.app.services.tavily_service import tavily_service
from backend.app.config import settings

class TestScoringAndClassification(unittest.TestCase):
    def test_fresh_scoring_calculation(self):
        # 1. Test FRESH claim with strong evidence
        evidence_eval = {
            "status": "FRESH",
            "contradiction_level": "none",
            "match_confidence": 0.95
        }
        supporting = [
            {"reliability_score": 0.9, "published_date": "2026-10-30"},
            {"reliability_score": 0.85, "published_date": "2026-10-28"}
        ]
        result = scoring_service.calculate_score(
            evidence_eval=evidence_eval,
            supporting_sources=supporting,
            contradicting_sources=[],
            meeting_date_str="2026-11-03",
            is_time_sensitive=True
        )
        self.assertGreaterEqual(result["total_score"], 85.0)
        self.assertIn(result["interpretation"], ["Fresh", "Mostly Fresh"])

    def test_stale_scoring_calculation(self):
        # 2. Test STALE claim with contradiction
        evidence_eval = {
            "status": "STALE",
            "contradiction_level": "direct_contradiction",
            "match_confidence": 0.90
        }
        contradicting = [
            {"reliability_score": 0.9, "published_date": "2026-10-25"}
        ]
        result = scoring_service.calculate_score(
            evidence_eval=evidence_eval,
            supporting_sources=[],
            contradicting_sources=contradicting,
            meeting_date_str="2026-11-03",
            is_time_sensitive=True
        )
        self.assertLessEqual(result["total_score"], 39.0)
        self.assertEqual(result["interpretation"], "Stale")

    def test_stable_non_time_sensitive(self):
        # 3. Test stable claim
        result = scoring_service.calculate_score(
            evidence_eval={},
            supporting_sources=[],
            contradicting_sources=[],
            meeting_date_str="2026-11-03",
            is_time_sensitive=False
        )
        self.assertEqual(result["interpretation"], "Not time-sensitive")
        self.assertFalse(result["is_time_sensitive"])

    def test_domain_authority_ranking(self):
        # 4. Domain reliability tier verification
        high_score, high_tier = tavily_service._assess_domain_authority("bloomberg.com")
        self.assertEqual(high_tier, "high_authority")
        self.assertGreaterEqual(high_score, 0.85)

        blog_score, blog_tier = tavily_service._assess_domain_authority("randomblog.com")
        self.assertEqual(blog_tier, "community_blog")
        self.assertLessEqual(blog_score, 0.50)

    def test_url_deduplication(self):
        # 5. Deduplication and date filtering
        sources = [
            {"url": "https://company.com/news/1", "title": "News 1", "published_date": "2026-10-20"},
            {"url": "https://company.com/news/1/", "title": "News 1 duplicate", "published_date": "2026-10-20"},
            {"url": "https://company.com/news/2", "title": "News 2", "published_date": "2026-10-15"},
        ]
        deduped = tavily_service.deduplicate_and_filter(sources, "2026-11-03", cutoff_days=30)
        self.assertEqual(len(deduped), 2)

if __name__ == "__main__":
    unittest.main()
