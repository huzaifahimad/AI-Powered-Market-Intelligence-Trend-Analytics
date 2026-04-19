from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    news_api_key: str = ""
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "market_intel"
    app_env: str = "development"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
