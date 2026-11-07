import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.meetings import router as meetings_router
from backend.app.api.auth import router as auth_router
from backend.app.database.db import init_db
from backend.app.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("veritymeet")

app = FastAPI(
    title="VerityMeet AI",
    description="Pre-Meeting Briefing Agent with Stale-Answer Detection and Evidence Verification Engine",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    status = settings.validate_credentials()
    logger.info(f"VerityMeet AI initialized. External credentials ready: {status['ready']}")
    if not status["ready"]:
        logger.warning(f"Missing API credentials: {status['missing_keys']}")

# Mount API routes under /api
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(meetings_router, prefix="/api", tags=["meetings"])

@app.get("/")
def root():
    return {
        "app": "VerityMeet AI",
        "description": "Pre-Meeting Briefing Agent with Stale-Answer Detection Engine",
        "status": "online"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=settings.PORT, reload=False)
