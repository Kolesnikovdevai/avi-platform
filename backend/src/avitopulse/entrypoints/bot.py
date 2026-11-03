import argparse
import logging

from aiogram import Dispatcher

from avitopulse.shared.observability import configure_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Bot scaffold: no polling or messages")
    parser.add_argument("--check", action="store_true", required=True)
    parser.parse_args()
    configure_logging()
    Dispatcher()  # Validate framework import/initialization without a token or network.
    logging.getLogger(__name__).info("", extra={"event": "process_started"})
