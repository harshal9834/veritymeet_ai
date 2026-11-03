import httpx
import json
import logging
import re
from typing import Dict, Any, List, Optional
from backend.app.config import settings

logger = logging.getLogger(__name__)

class BifrostServiceError(Exception):
    pass

class BifrostService:
    def __init__(self):
        self.client = httpx.Client(timeout=60.0)

    def _get_headers(self) -> Dict[str, str]:
        api_key = settings.BIFROST_API_KEY.strip()
        if not api_key:
            raise BifrostServiceError(
                "BIFROST_API_KEY is missing. Please configure BIFROST_API_KEY in .env or the Settings panel."
            )
        return {
            "Authorization": f"Bearer {api_key}",
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }

    def _get_endpoint(self) -> str:
        base = settings.BIFROST_BASE_URL.rstrip("/")
        if base.endswith("/chat/completions"):
            return base
        return f"{base}/chat/completions"

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        json_output: bool = False,
        max_retries: int = 2
    ) -> str:
        """Invokes Grok through the Bifrost LLM Gateway."""
        endpoint = self._get_endpoint()
        headers = self._get_headers()
        model = settings.GROK_MODEL or "grok-2-latest"

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if json_output:
            payload["response_format"] = {"type": "json_object"}

        attempt = 0
        last_error = None

        while attempt <= max_retries:
            try:
                response = self.client.post(endpoint, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
                    return ""
                elif response.status_code == 401 or response.status_code == 403:
                    raise BifrostServiceError(
                        f"Bifrost Gateway Authentication Failed (HTTP {response.status_code}): Invalid BIFROST_API_KEY."
                    )
                elif response.status_code == 429:
                    logger.warning("Bifrost rate limit encountered. Retrying...")
                    attempt += 1
                    continue
                else:
                    error_text = response.text[:200]
                    raise BifrostServiceError(
                        f"Bifrost API error (HTTP {response.status_code}): {error_text}"
                    )
            except httpx.RequestError as e:
                last_error = e
                attempt += 1
                if attempt > max_retries:
                    raise BifrostServiceError(f"Network error connecting to Bifrost Gateway ({endpoint}): {str(e)}")
            except BifrostServiceError:
                raise
            except Exception as e:
                raise BifrostServiceError(f"Unexpected error during Bifrost request: {str(e)}")

        raise BifrostServiceError(f"Failed to communicate with Bifrost Gateway after {max_retries} retries: {str(last_error)}")

    def chat_json(self, messages: List[Dict[str, str]], temperature: float = 0.2) -> Dict[str, Any]:
        """Calls Grok and safely parses JSON output."""
        raw_text = self.chat_completion(messages, temperature=temperature, json_output=True)
        return self._extract_json(raw_text)

    def _extract_json(self, text: str) -> Dict[str, Any]:
        text = text.strip()
        # Direct parse attempt
        try:
            return json.loads(text)
        except Exception:
            pass

        # Try markdown block
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            candidate = match.group(1).strip()
            try:
                return json.loads(candidate)
            except Exception:
                pass

        # Try searching for outermost curly braces
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            try:
                return json.loads(text[first_brace:last_brace + 1])
            except Exception:
                pass

        # Fallback to empty dict
        logger.error(f"Failed to parse JSON response from Bifrost: {text[:300]}")
        return {}

bifrost_service = BifrostService()
