import logging
from typing import Optional
from google import genai
from app.config import settings

logger = logging.getLogger("gemini_client")


class GeminiClientManager:
    """
    Manages the Google GenAI SDK client lifecycle.
    Gracefully handles live API and intelligent mock/fallback modes.
    """

    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._initialize()

    def _initialize(self):
        if settings.has_gemini_key:
            try:
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Initialized Google GenAI SDK Client with provided API key.")
            except Exception as e:
                logger.warning(f"Failed to initialize GenAI Client: {e}. Falling back to simulation mode.")
                self._client = None
        else:
            logger.info("No GEMINI_API_KEY found in environment or .env. Running in Mock/Simulation mode.")
            self._client = None

    @property
    def is_live(self) -> bool:
        """Return True if connected to live Google Gemini API."""
        return self._client is not None and settings.has_gemini_key

    @property
    def client(self) -> Optional[genai.Client]:
        """Return the underlying genai.Client or None."""
        return self._client

    @property
    def model_name(self) -> str:
        """Configured Gemini model name (e.g. gemini-2.5-flash or gemini-1.5-flash)."""
        return settings.GEMINI_MODEL


# Global client manager instance
gemini_manager = GeminiClientManager()
