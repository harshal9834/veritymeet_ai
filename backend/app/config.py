import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file from project root
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)


class Settings(BaseModel):
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    BIFROST_BASE_URL: str = os.getenv("BIFROST_BASE_URL", "https://api.bifrost.maxim.ai/v1")
    BIFROST_API_KEY: str = os.getenv("BIFROST_API_KEY", "")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-2-latest")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./veritymeet.db")
    PORT: int = int(os.getenv("PORT", "8000"))

    def reload(self):
        load_dotenv(dotenv_path=env_path, override=True)
        self.TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
        self.BIFROST_BASE_URL = os.getenv("BIFROST_BASE_URL", "https://api.bifrost.maxim.ai/v1")
        self.BIFROST_API_KEY = os.getenv("BIFROST_API_KEY", "")
        self.GROK_MODEL = os.getenv("GROK_MODEL", "grok-2-latest")
        self.DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./veritymeet.db")
        self.PORT = int(os.getenv("PORT", "8000"))

    def validate_credentials(self) -> dict:
        """Returns the readiness status of external API credentials."""
        has_tavily = bool(self.TAVILY_API_KEY and len(self.TAVILY_API_KEY.strip()) > 5)
        has_bifrost = bool(self.BIFROST_API_KEY and len(self.BIFROST_API_KEY.strip()) > 5)

        missing = []
        if not has_tavily:
            missing.append("TAVILY_API_KEY")
        if not has_bifrost:
            missing.append("BIFROST_API_KEY")

        return {
            "ready": len(missing) == 0,
            "has_tavily": has_tavily,
            "has_bifrost": has_bifrost,
            "bifrost_base_url": self.BIFROST_BASE_URL,
            "grok_model": self.GROK_MODEL,
            "missing_keys": missing,
        }


settings = Settings()
