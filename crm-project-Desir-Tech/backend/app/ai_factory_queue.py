"""
Redis stream-backed queue helpers for AI Factory workers.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import os
from typing import Any
from uuid import uuid4

from redis import Redis
from redis.exceptions import ResponseError

from app.config import settings


@dataclass(frozen=True)
class EnqueuedAIFactoryRun:
    job_id: str
    message_id: str


@dataclass(frozen=True)
class QueuedAIFactoryRun:
    job_id: str
    message_id: str
    run_id: int


def get_redis_connection() -> Redis:
    return Redis.from_url(settings.ai_factory_redis_url)


def queue_name() -> str:
    return settings.ai_factory_queue_name


def consumer_group_name() -> str:
    return f"{queue_name()}:workers"


def worker_consumer_name() -> str:
    return f"{os.environ.get('HOSTNAME') or 'worker'}-{os.getpid()}"


def _as_text(value: bytes | str | int | Any) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return str(value)


def _ensure_consumer_group(connection: Redis) -> None:
    try:
        connection.xgroup_create(
            queue_name(),
            consumer_group_name(),
            id="0-0",
            mkstream=True,
        )
    except ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise


def _queued_run_from_entry(
    message_id: bytes | str,
    payload: dict[bytes | str, bytes | str | int],
) -> QueuedAIFactoryRun:
    normalized_payload = {
        _as_text(key): _as_text(value)
        for key, value in payload.items()
    }
    return QueuedAIFactoryRun(
        job_id=normalized_payload["job_id"],
        message_id=_as_text(message_id),
        run_id=int(normalized_payload["run_id"]),
    )


def enqueue_ai_factory_run(run_id: int) -> EnqueuedAIFactoryRun:
    connection = get_redis_connection()
    _ensure_consumer_group(connection)
    job_id = str(uuid4())
    message_id = connection.xadd(
        queue_name(),
        {
            "job_id": job_id,
            "run_id": str(run_id),
            "enqueued_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    return EnqueuedAIFactoryRun(job_id=job_id, message_id=_as_text(message_id))


def _claim_stale_ai_factory_run(
    connection: Redis,
    consumer_name: str,
    reclaim_idle_ms: int,
) -> QueuedAIFactoryRun | None:
    _, messages, _ = connection.xautoclaim(
        queue_name(),
        consumer_group_name(),
        consumer_name,
        reclaim_idle_ms,
        start_id="0-0",
        count=1,
    )
    if not messages:
        return None
    message_id, payload = messages[0]
    return _queued_run_from_entry(message_id, payload)


def dequeue_ai_factory_run(
    consumer_name: str,
    *,
    timeout: int = 5,
    reclaim_idle_ms: int,
) -> QueuedAIFactoryRun | None:
    connection = get_redis_connection()
    _ensure_consumer_group(connection)

    reclaimed = _claim_stale_ai_factory_run(connection, consumer_name, reclaim_idle_ms)
    if reclaimed:
        return reclaimed

    response = connection.xreadgroup(
        consumer_group_name(),
        consumer_name,
        {queue_name(): ">"},
        count=1,
        block=max(timeout, 1) * 1000,
    )
    if not response:
        return None
    _, messages = response[0]
    message_id, payload = messages[0]
    return _queued_run_from_entry(message_id, payload)


def ack_ai_factory_run(message_id: str) -> None:
    connection = get_redis_connection()
    _ensure_consumer_group(connection)
    connection.xack(queue_name(), consumer_group_name(), message_id)
    connection.xdel(queue_name(), message_id)
