import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import settings
from app.services.gemini_client import gemini_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

app = FastAPI(
    title="Gemini Hostel Triage & Concierge Brain",
    description="Multimodal AI Fault Triage Engine & Status Concierge Agent powered by Google Gemini",
    version="1.0.0"
)

# Enable CORS for local client development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

# Mount static folder for web UI
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    @app.get("/", include_in_schema=False)
    def serve_index():
        """Serve the interactive web demonstration interface."""
        return FileResponse(STATIC_DIR / "index.html")


@app.on_event("startup")
def startup_event():
    mode_str = f"LIVE Gemini API ({gemini_manager.model_name})" if gemini_manager.is_live else "Simulation / Offline Fallback Mode"
    logger.info(f"=== Gemini Hostel Triage Engine Initialized ===")
    logger.info(f"Operating Mode: {mode_str}")
    logger.info(f"Swagger API Docs: http://{settings.HOST}:{settings.PORT}/docs")
    logger.info(f"Web Dashboard:    http://{settings.HOST}:{settings.PORT}/")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
