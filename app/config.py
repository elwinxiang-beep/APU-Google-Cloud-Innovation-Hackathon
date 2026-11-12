import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

class Settings:
    """Application configuration settings."""
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")

    @property
    def has_gemini_key(self) -> bool:
        """Check if a real Gemini API key is configured."""
        return bool(
            self.GEMINI_API_KEY
            and self.GEMINI_API_KEY != "your_gemini_api_key_here"
            and not self.GEMINI_API_KEY.startswith("mock_")
        )

settings = Settings()
