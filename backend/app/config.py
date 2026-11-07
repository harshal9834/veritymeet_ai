import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file from project root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class Settings(BaseModel):
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    BIFROST_BASE_URL: str = os.getenv("BIFROST_BASE_URL", "http://localhost:8080")
    BIFROST_API_KEY: str = os.getenv("BIFROST_API_KEY", "")
    BIFROST_MODEL: str = os.getenv("BIFROST_MODEL", os.getenv("GROK_MODEL", "llama-3.3-70b-versatile"))
    GROK_API: str = os.getenv("GROK_API", "")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "llama-3.3-70b-versatile")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./veritymeet.db")
    PORT: int = int(os.getenv("PORT", "8000"))

    def reload(self):
        load_dotenv(dotenv_path=env_path, override=True)
        self.TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
        self.BIFROST_BASE_URL = os.getenv("BIFROST_BASE_URL", "http://localhost:8080")
        self.BIFROST_API_KEY = os.getenv("BIFROST_API_KEY", "")
        self.BIFROST_MODEL = os.getenv("BIFROST_MODEL", os.getenv("GROK_MODEL", "llama-3.3-70b-versatile"))
        self.GROK_API = os.getenv("GROK_API", "")
        self.GROK_MODEL = os.getenv("GROK_MODEL", "llama-3.3-70b-versatile")
        self.DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./veritymeet.db")
        self.PORT = int(os.getenv("PORT", "8000"))

    def validate_credentials(self) -> dict:
        """Returns the readiness status of external API credentials."""
        has_tavily = bool(self.TAVILY_API_KEY and len(self.TAVILY_API_KEY.strip()) > 5)
        has_bifrost = bool(self.BIFROST_API_KEY and len(self.BIFROST_API_KEY.strip()) > 5)
        has_direct_groq = bool(self.GROK_API and len(self.GROK_API.strip()) > 5)
        has_llm = has_bifrost or has_direct_groq

        missing = []
        if not has_tavily:
            missing.append("TAVILY_API_KEY")
        if not has_llm:
            missing.append("BIFROST_API_KEY")

        return {
            "ready": len(missing) == 0,
            "has_tavily": has_tavily,
            "has_bifrost": has_bifrost,
            "has_direct_groq": has_direct_groq,
            "bifrost_base_url": self.BIFROST_BASE_URL,
            "bifrost_model": self.BIFROST_MODEL,
            "grok_model": self.BIFROST_MODEL or self.GROK_MODEL,
            "missing_keys": missing,
            "auth_mode": "bifrost_virtual_key" if has_bifrost else ("direct_groq" if has_direct_groq else "none")
        }


settings = Settings()
