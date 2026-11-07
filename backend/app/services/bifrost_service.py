import httpx
import json
import logging
import re
import time
from typing import Dict, Any, List, Optional
from backend.app.config import settings

logger = logging.getLogger(__name__)

class BifrostServiceError(Exception):
    pass

class BifrostService:
    def __init__(self):
        self.client = httpx.Client(timeout=120.0)

    def _get_provider_details(self):
        bifrost_key = settings.BIFROST_API_KEY.strip()
        bifrost_base = settings.BIFROST_BASE_URL.strip().rstrip("/")
        model = settings.BIFROST_MODEL.strip() or settings.GROK_MODEL.strip() or "llama-3.3-70b-versatile"

        # Priority 1: Bifrost Virtual Key Gateway integration (as required by specification)
        if bifrost_key:
            endpoint = bifrost_base if bifrost_base.endswith("/chat/completions") else f"{bifrost_base}/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {bifrost_key}",
                "Content-Type": "application/json"
            }
            return endpoint, headers, model

        # Fallback 2: Direct Groq API if GROK_API key is provided
        grok_api = settings.GROK_API.strip()
        if grok_api:
            endpoint = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {grok_api}",
                "Content-Type": "application/json"
            }
            direct_model = settings.GROK_MODEL if settings.GROK_MODEL and "openai/" in settings.GROK_MODEL else "llama-3.3-70b-versatile"
            return endpoint, headers, direct_model

        raise BifrostServiceError(
            "No Bifrost Virtual Key or LLM API key configured. Please set BIFROST_API_KEY in your .env file."
        )

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        json_output: bool = False,
        max_retries: int = 5
    ) -> str:
        """Invokes LLM (Groq / Bifrost) safely with retry and rate-limit handling."""
        endpoint, headers, model = self._get_provider_details()

        # Groq requires the word 'json' in messages when json_object response_format is used
        processed_messages = [dict(m) for m in messages]
        if json_output:
            has_json_word = any("json" in m.get("content", "").lower() for m in processed_messages)
            if not has_json_word:
                processed_messages[0]["content"] += "\nPlease provide your response in valid JSON format."

        payload: Dict[str, Any] = {
            "model": model,
            "messages": processed_messages,
            "temperature": temperature,
        }

        if json_output:
            payload["response_format"] = {"type": "json_object"}

        attempt = 0
        last_error_detail = None

        while attempt <= max_retries:
            try:
                response = self.client.post(endpoint, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
                    return ""
                elif response.status_code in (401, 403):
                    raise BifrostServiceError(
                        f"LLM Gateway Authentication Failed (HTTP {response.status_code}): Invalid API key."
                    )
                elif response.status_code == 429:
                    attempt += 1
                    # Parse Retry-After if present
                    retry_after = response.headers.get("retry-after")
                    wait_time = float(retry_after) if retry_after else (4.0 * attempt)
                    last_error_detail = f"Rate limit 429: {response.text[:200]}"
                    logger.warning(f"LLM rate limit encountered (429). Retrying in {wait_time}s (attempt {attempt}/{max_retries})...")
                    time.sleep(wait_time)
                    continue
                elif response.status_code >= 500:
                    attempt += 1
                    wait_time = 3.0 * attempt
                    last_error_detail = f"Server error {response.status_code}: {response.text[:200]}"
                    logger.warning(f"LLM server error (HTTP {response.status_code}). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    error_text = response.text[:300]
                    raise BifrostServiceError(
                        f"LLM API error (HTTP {response.status_code}): {error_text}"
                    )
            except httpx.RequestError as e:
                attempt += 1
                last_error_detail = f"Network error: {str(e)}"
                if attempt > max_retries:
                    raise BifrostServiceError(f"Network error connecting to LLM Gateway ({endpoint}): {str(e)}")
                time.sleep(2.0 * attempt)
            except BifrostServiceError:
                raise
            except Exception as e:
                attempt += 1
                last_error_detail = f"Unexpected error: {str(e)}"
                if attempt > max_retries:
                    raise BifrostServiceError(f"Unexpected error during LLM request: {str(e)}")
                time.sleep(2.0 * attempt)

        raise BifrostServiceError(f"Failed to communicate with LLM Gateway after {max_retries} retries. Last error: {last_error_detail}")

    def chat_json(self, messages: List[Dict[str, str]], temperature: float = 0.2) -> Dict[str, Any]:
        """Calls LLM and safely parses JSON output."""
        raw_text = self.chat_completion(messages, temperature=temperature, json_output=True)
        return self._extract_json(raw_text)

    def _extract_json(self, text: str) -> Dict[str, Any]:
        text = text.strip()
        try:
            return json.loads(text)
        except Exception:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                try:
                    return json.loads(match.group(1))
                except Exception:
                    pass

            first_brace = text.find("{")
            last_brace = text.rfind("}")
            if first_brace != -1 and last_brace > first_brace:
                try:
                    return json.loads(text[first_brace:last_brace + 1])
                except Exception:
                    pass

            logger.error(f"Failed to parse JSON response: {text[:300]}")
            return {}

bifrost_service = BifrostService()
