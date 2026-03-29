"""
DesirTech CRM - Backend API
FastAPI application entry point
"""

import logging
import sys
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.alerts import send_operations_alert_async
from app.config import settings
from app.routes import (
    agent_blueprints,
    ai_factory,
    auth as auth_routes,
    clients,
    contact,
    dashboard,
    health,
    invoices,
    leads,
    opportunities,
    payments,
    pipeline,
)
from app.telemetry import configure_observability

# ─── Logging ───
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("desirtech")

app = FastAPI(
    title="DesirTech CRM API",
    description="CRM + Client Portal Backend",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)
configure_observability(app)

# ─── Global exception handler ───


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        traceback.format_exc(),
    )
    if settings.operations_alert_notify_unhandled_exceptions:
        await send_operations_alert_async(
            "critical",
            "Unhandled backend exception",
            str(exc) or exc.__class__.__name__,
            category="backend_exception",
            source="fastapi",
            details={
                "method": request.method,
                "path": request.url.path,
            },
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# ─── Routes ───
app.include_router(health.router, tags=["Health"])
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(ai_factory.router, prefix="/api/ai-factory", tags=["AI Factory"])
app.include_router(agent_blueprints.router, prefix="/api/agent-blueprints", tags=["Agent Blueprints"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(opportunities.router,
                   prefix="/api/opportunities", tags=["Opportunities"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["Pipeline"])
app.include_router(
    dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

logger.info(
    "DesirTech CRM API started (env=%s); schema managed externally via SQL runbooks.",
    settings.env,
)


@app.get("/")
async def root():
    return {"message": "DesirTech CRM API is running"}
