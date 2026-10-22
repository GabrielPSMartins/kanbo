from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.errors import ErrorResponse, register_error_handlers


def _operation_id(route: APIRoute) -> str:
    # operationIds limpos (ex.: "list_issues") para os tipos gerados no front
    return route.name


def create_app() -> FastAPI:
    app = FastAPI(
        title="Kanbo API",
        version="0.1.0",
        generate_unique_id_function=_operation_id,
        responses={
            400: {"model": ErrorResponse},
            404: {"model": ErrorResponse},
            409: {"model": ErrorResponse},
            422: {"model": ErrorResponse},
        },
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(api_router)

    @app.get("/api/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
