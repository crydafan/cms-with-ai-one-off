from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cms_api.settings import get_settings

settings = get_settings()

app = FastAPI(title="AI-assisted CMS API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
