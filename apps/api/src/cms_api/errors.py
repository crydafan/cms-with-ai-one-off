from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

ERROR_STATUS_CODES = {
    "input_invalid": 422,
    "candidate_missing": 409,
    "candidate_source_mismatch": 409,
    "slug_taken": 409,
    "post_not_found": 404,
    "metadata_generation_failed": 503,
}


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str, field: str | None = None) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.field = field


def _detail(code: str, message: str, field: str | None = None) -> dict[str, str]:
    result = {"code": code, "message": message}
    if field:
        result["field"] = field
    return result


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, error: ApiError) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={"detail": _detail(error.code, error.message, error.field)},
        )

    @app.exception_handler(HTTPException)
    async def http_error_handler(request: Request, error: HTTPException) -> JSONResponse:
        if isinstance(error.detail, dict) and {"code", "message"}.issubset(error.detail):
            detail = error.detail
        else:
            detail = _detail("http_error", str(error.detail))
        return JSONResponse(status_code=error.status_code, content={"detail": detail}, headers=error.headers)

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
        errors = error.errors()
        field_path = errors[0].get("loc", ()) if errors else ()
        field = str(field_path[-1]) if field_path else None
        return JSONResponse(
            status_code=422,
            content={"detail": _detail("input_invalid", "Request validation failed.", field)},
        )

    @app.exception_handler(Exception)
    async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"detail": _detail("internal_error", "An unexpected server error occurred.")},
        )
