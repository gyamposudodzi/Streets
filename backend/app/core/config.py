from dataclasses import dataclass
import os


def split_csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    app_name: str = "Streets API"
    environment: str = os.getenv("STREETS_ENV", "development")
    api_v1_prefix: str = "/api/v1"
    default_currency: str = os.getenv("STREETS_DEFAULT_CURRENCY", "USD")
    booking_hold_minutes: int = int(os.getenv("STREETS_BOOKING_HOLD_MINUTES", "15"))
    sqlite_path: str = os.getenv("STREETS_SQLITE_PATH", "backend/data/streets_dev.db")
    cors_origins: tuple[str, ...] = split_csv(
        os.getenv(
            "STREETS_CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
    )


settings = Settings()
