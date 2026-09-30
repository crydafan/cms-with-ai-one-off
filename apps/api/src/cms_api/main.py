from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cms_api.errors import install_error_handlers
from cms_api.routers import drafts, metadata, posts
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
install_error_handlers(app)
app.include_router(drafts.router)
app.include_router(metadata.router)
app.include_router(posts.router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
