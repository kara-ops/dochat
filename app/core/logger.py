import structlog
import logging

logging.basicConfig(level=logging.INFO)

structlog.configure(
    processors=[structlog.processors.TimeStamper(fmt="iso"),
                structlog.stdlib.add_log_level,
                structlog.processors.JSONRenderer()],
            wrapper_class=structlog.BoundLogger,
            logger_factory=structlog.PrintLoggerFactory()
)

logger = structlog.get_logger()