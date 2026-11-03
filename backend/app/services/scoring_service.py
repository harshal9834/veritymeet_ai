from typing import Dict, Any, List, Optional
from datetime import datetime

class FreshnessScoringService:
    @staticmethod
    def calculate_score(
        evidence_eval: Dict[str, Any],
        supporting_sources: List[Dict[str, Any]],
        contradicting_sources: List[Dict[str, Any]],
        meeting_date_str: str,
        is_time_sensitive: bool = True
    ) -> Dict[str, Any]:
        """
        Calculates a transparent, deterministic freshness score (0-100) using 4 factors:
        - Source reliability (30%)
        - Evidence agreement (30%)
        - Evidence recency (25%)
        - Claim matching (15%)
        """
        if not is_time_sensitive:
            return {
                "source_reliability": 1.0,
                "evidence_agreement": 1.0,
                "evidence_recency": 1.0,
                "claim_matching": 1.0,
                "total_score": 100.0,
                "interpretation": "Not time-sensitive",
                "is_time_sensitive": False
            }

        # 1. Source Reliability (Weight: 30%)
        # Based on average reliability score of supporting vs contradicting sources
        if supporting_sources:
            avg_reliability = sum(s.get("reliability_score", 0.5) for s in supporting_sources) / len(supporting_sources)
        elif contradicting_sources:
            # Strong contradictory sources indicate stale claim
            avg_reliability = sum(s.get("reliability_score", 0.5) for s in contradicting_sources) / len(contradicting_sources)
        else:
            avg_reliability = 0.35  # Insufficient sources

        source_reliability_score = round(max(0.1, min(1.0, avg_reliability)), 2)

        # 2. Evidence Agreement (Weight: 30%)
        # Extracted from evidence evaluation:
        # direct_confirmation: 1.0
        # partial_confirmation: 0.70
        # conflicting: 0.35
        # contradicted / stale: 0.05
        # no_evidence: 0.20
        status = evidence_eval.get("status", "UNCERTAIN").upper()
        contradiction_level = evidence_eval.get("contradiction_level", "none")

        if status == "FRESH":
            if contradiction_level == "none":
                agreement_score = 1.0
            else:
                agreement_score = 0.80
        elif status == "STALE":
            agreement_score = 0.05
        else: # UNCERTAIN
            if contradiction_level == "conflicting":
                agreement_score = 0.35
            else:
                agreement_score = 0.40

        # 3. Evidence Recency (Weight: 25%)
        # How recent is the supporting evidence compared to the meeting date
        recency_score = 0.5  # default if unknown
        dates = [s.get("published_date") for s in supporting_sources if s.get("published_date")]
        if dates:
            try:
                meeting_dt = datetime.strptime(meeting_date_str[:10], "%Y-%m-%d")
                days_diffs = []
                for d in dates:
                    try:
                        p_dt = datetime.strptime(d[:10], "%Y-%m-%d")
                        diff = abs((meeting_dt - p_dt).days)
                        days_diffs.append(diff)
                    except Exception:
                        pass
                if days_diffs:
                    min_diff = min(days_diffs)
                    if min_diff <= 7:
                        recency_score = 1.0
                    elif min_diff <= 14:
                        recency_score = 0.85
                    elif min_diff <= 30:
                        recency_score = 0.70
                    elif min_diff <= 60:
                        recency_score = 0.50
                    else:
                        recency_score = 0.30
            except Exception:
                recency_score = 0.5

        if status == "STALE":
            # If stale, the claim's currency is poor
            recency_score = min(recency_score, 0.20)

        # 4. Claim Matching (Weight: 15%)
        # Extracted from LLM evidence matching confidence
        match_confidence = evidence_eval.get("match_confidence", 0.7)
        claim_matching_score = round(max(0.1, min(1.0, float(match_confidence))), 2)

        # Weighted calculation
        # Formula: 0.30 * Source + 0.30 * Agreement + 0.25 * Recency + 0.15 * Matching
        raw_total = (
            (0.30 * source_reliability_score) +
            (0.30 * agreement_score) +
            (0.25 * recency_score) +
            (0.15 * claim_matching_score)
        )
        total_score = round(raw_total * 100, 1)

        # Hard guardrails:
        # If status is STALE, cap total score at 38
        if status == "STALE" and total_score >= 40:
            total_score = 35.0
        # If status is UNCERTAIN, cap between 40 and 69
        if status == "UNCERTAIN" and total_score >= 70:
            total_score = 65.0

        # Interpretation assignment
        if total_score >= 90:
            interpretation = "Fresh"
        elif total_score >= 70:
            interpretation = "Mostly Fresh"
        elif total_score >= 40:
            interpretation = "Uncertain"
        else:
            interpretation = "Stale"

        return {
            "source_reliability": source_reliability_score,
            "evidence_agreement": agreement_score,
            "evidence_recency": recency_score,
            "claim_matching": claim_matching_score,
            "total_score": total_score,
            "interpretation": interpretation,
            "is_time_sensitive": True
        }

scoring_service = FreshnessScoringService()
