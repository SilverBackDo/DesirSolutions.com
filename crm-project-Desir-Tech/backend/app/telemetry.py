"""
OpenTelemetry setup for API and worker processes.
"""

from __future__ import annotations

from typing import Callable

from fastapi import FastAPI, Request
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

_provider_configured = False
_middleware_installed = False


class TraceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        tracer = trace.get_tracer("desirtech.http")
        span_name = f"{request.method} {request.url.path}"
        with tracer.start_as_current_span(span_name) as span:
            span.set_attribute("http.method", request.method)
            span.set_attribute("http.target", request.url.path)
            response = await call_next(request)
            span.set_attribute("http.status_code", response.status_code)
            return response


def configure_observability(app: FastAPI | None = None) -> None:
    global _provider_configured
    global _middleware_installed

    if not settings.otel_enabled:
        return

    if not _provider_configured:
        resource = Resource.create({"service.name": settings.otel_service_name})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(
            endpoint=settings.otel_traces_endpoint,
            timeout=5,
        )
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)
        _provider_configured = True

    if app and not _middleware_installed:
        app.add_middleware(TraceMiddleware)
        _middleware_installed = True
