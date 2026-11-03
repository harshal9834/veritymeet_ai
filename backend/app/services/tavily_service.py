import httpx
import logging
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from backend.app.config import settings

logger = logging.getLogger(__name__)

class TavilyServiceError(Exception):
    pass

class TavilyService:
    def __init__(self):
        self.endpoint = "https://api.tavily.com/search"
        self.client = httpx.Client(timeout=45.0)

    def _get_api_key(self) -> str:
        key = settings.TAVILY_API_KEY.strip()
        if not key:
            raise TavilyServiceError(
                "TAVILY_API_KEY is missing. Please configure your Tavily API key in .env or the Settings panel."
            )
        return key

    def search(
        self,
        query: str,
        max_results: int = 5,
        days: int = 30,
        search_depth: str = "advanced",
        include_domains: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Executes a live search via Tavily Search API."""
        api_key = self._get_api_key()
        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "include_answer": False,
            "days": days
        }
        if include_domains and len(include_domains) > 0:
            payload["include_domains"] = include_domains

        try:
            response = self.client.post(self.endpoint, json=payload)
            if response.status_code == 200:
                data = response.json()
                raw_results = data.get("results", [])
                return self._normalize_results(raw_results)
            elif response.status_code == 401 or response.status_code == 403:
                raise TavilyServiceError(
                    f"Tavily API Authentication Failed (HTTP {response.status_code}): Invalid TAVILY_API_KEY."
                )
            elif response.status_code == 429:
                raise TavilyServiceError("Tavily Search API rate limit reached. Please wait or upgrade your plan.")
            else:
                raise TavilyServiceError(f"Tavily API error (HTTP {response.status_code}): {response.text[:200]}")
        except httpx.RequestError as e:
            raise TavilyServiceError(f"Network error communicating with Tavily Search API: {str(e)}")
        except TavilyServiceError:
            raise
        except Exception as e:
            raise TavilyServiceError(f"Unexpected error in Tavily search: {str(e)}")

    def _normalize_results(self, raw_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for item in raw_results:
            url = item.get("url", "").strip()
            if not url:
                continue

            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith("www."):
                domain = domain[4:]

            # Generate stable ID from URL
            url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()[:8]
            source_id = f"src_{url_hash}"

            pub_date = item.get("published_date")
            if not pub_date or pub_date == "null" or pub_date == "None":
                pub_date = None

            # Calculate source domain reliability tier
            reliability_score, reliability_tier = self._assess_domain_authority(domain)

            normalized.append({
                "id": source_id,
                "title": item.get("title", "Untitled Web Result").strip(),
                "url": url,
                "domain": domain,
                "snippet": item.get("content", "").strip(),
                "published_date": pub_date,
                "reliability_score": reliability_score,
                "reliability_tier": reliability_tier,
                "raw_score": item.get("score", 0.5)
            })

        return normalized

    def _assess_domain_authority(self, domain: str) -> tuple[float, str]:
        """Categorizes domain authority based on official/reputable tiers."""
        high_authority = [
            "bloomberg.com", "reuters.com", "wsj.com", "ft.com", "techcrunch.com",
            "theverge.com", "forbes.com", "sec.gov", "prnewswire.com", "businesswire.com",
            "cnbc.com", "nytimes.com", "wired.com", "venturebeat.com", "github.com"
        ]
        gov_or_edu = domain.endswith(".gov") or domain.endswith(".edu") or domain.endswith(".org")

        if gov_or_edu or any(domain == ha or domain.endswith("." + ha) for ha in high_authority):
            return (0.90, "high_authority")
        elif "blog" in domain or "forum" in domain or "reddit.com" in domain:
            return (0.45, "community_blog")
        else:
            return (0.70, "standard_web")

    def deduplicate_and_filter(
        self,
        sources: List[Dict[str, Any]],
        meeting_date_str: str,
        cutoff_days: int = 30
    ) -> List[Dict[str, Any]]:
        """Deduplicates sources by normalized URL and applies research window."""
        seen_urls = set()
        unique_sources = []

        try:
            meeting_date = datetime.strptime(meeting_date_str, "%Y-%m-%d")
        except Exception:
            meeting_date = datetime.utcnow()

        window_start = meeting_date - timedelta(days=cutoff_days)

        for s in sources:
            norm_url = s["url"].rstrip("/").lower()
            if norm_url in seen_urls:
                continue
            seen_urls.add(norm_url)

            # Date filtering if published_date is available
            pub_date_str = s.get("published_date")
            if pub_date_str:
                try:
                    # Parse standard ISO or YYYY-MM-DD
                    if "T" in pub_date_str:
                        pub_dt = datetime.fromisoformat(pub_date_str.split("T")[0])
                    else:
                        pub_dt = datetime.strptime(pub_date_str[:10], "%Y-%m-%d")

                    # If publication date is after meeting date (for future or past meetings), or older than window
                    if pub_dt < window_start:
                        # Keep it but mark recency factor lower
                        s["outside_window"] = True
                except Exception:
                    pass

            unique_sources.append(s)

        return unique_sources

tavily_service = TavilyService()
