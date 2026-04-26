from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    news_api_key: str = ""
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "market_intel"
    app_env: str = "development"
    log_level: str = "INFO"
    jwt_secret_key: str = "market-intel-secret-key-change-in-production-2024"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
