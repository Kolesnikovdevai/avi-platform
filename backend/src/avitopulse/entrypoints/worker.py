import argparse
import logging

from avitopulse.shared.observability import configure_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Worker scaffold: no jobs are executed")
    parser.add_argument("--check", action="store_true", required=True)
    parser.parse_args()
    configure_logging()
    logging.getLogger(__name__).info("", extra={"event": "process_started"})
