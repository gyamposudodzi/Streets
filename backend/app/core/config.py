from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    app_name: str = "Streets API"
    environment: str = os.getenv("STREETS_ENV", "development")
    api_v1_prefix: str = "/api/v1"
    default_currency: str = os.getenv("STREETS_DEFAULT_CURRENCY", "USD")
    booking_hold_minutes: int = int(os.getenv("STREETS_BOOKING_HOLD_MINUTES", "15"))
    sqlite_path: str = os.getenv("STREETS_SQLITE_PATH", "backend/data/streets_dev.db")


settings = Settings()
