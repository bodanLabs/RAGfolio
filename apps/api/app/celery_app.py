"""Celery application configuration."""

import sys
from celery import Celery

from app.settings import settings

# Create Celery app
celery_app = Celery(
    "ragfolio",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks.document_processing"]
)

# Celery configuration
celery_config = {
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "timezone": "UTC",
    "enable_utc": True,
    "task_track_started": True,
    "task_time_limit": 30 * 60,  # 30 minutes
    "worker_prefetch_multiplier": 1,
}

# Windows-specific configuration
# Use 'solo' pool on Windows to avoid multiprocessing issues
if sys.platform == "win32":
    celery_config.update({
        "worker_pool": "solo",  # Run tasks in the same process (no multiprocessing)
        # Disable soft time limit on Windows (not supported)
        "task_soft_time_limit": None,
        "worker_max_tasks_per_child": None,  # Not needed with solo pool
    })
else:
    # Unix/Linux configuration
    celery_config.update({
        "task_soft_time_limit": 25 * 60,  # 25 minutes
        "worker_max_tasks_per_child": 1000,
    })

celery_app.conf.update(celery_config)
