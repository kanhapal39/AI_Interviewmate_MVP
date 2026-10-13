"""Application configuration and environment validation."""

import os
from functools import lru_cache
from typing import List
from pydantic import PostgresDsn, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Mistral AI
    MISTRAL_API_KEY: str = Field(..., env="MISTRAL_API_KEY")
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # Object storage (S3-compatible)
    AWS_ACCESS_KEY_ID: str = Field("", env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field("", env="AWS_SECRET_ACCESS_KEY")
    AWS_S3_BUCKET_NAME: str = Field("interviewmate-documents", env="AWS_S3_BUCKET_NAME")
    AWS_ENDPOINT_URL: str = Field("https://s3.amazonaws.com", env="AWS_ENDPOINT_URL")
    
    # Security
    SECRET_KEY: str = Field("interviewmate-change-in-production", env="SECRET_KEY")
    ALLOWED_ORIGINS_STR: str = Field("http://localhost:3000,http://localhost:8000", env="ALLOWED_ORIGINS")
    
    # Feature flags
    ENABLE_MOCK_PROVIDER: bool = Field(True, env="ENABLE_MOCK_PROVIDER")
    ENABLE_ANALYTICS: bool = Field(False, env="ENABLE_ANALYTICS")
    
    # Cost/token budget limits
    MAX_TOKENS_PER_REQUEST: int = Field(8000, env="MAX_TOKENS_PER_REQUEST")
    MAX_COST_PER_DAY: float = Field(10.0, env="MAX_COST_PER_DAY")
    
    # Retention policies
    AUDIO_RETENTION_DAYS: int = Field(30, env="AUDIO_RETENTION_DAYS")
    TRANSCRIPT_RETENTION_DAYS: int = Field(90, env="TRANSCRIPT_RETENTION_DAYS")
    
    # Prompt versioning
    DEFAULT_PROMPT_VERSION: str = Field("v1.0.0", env="DEFAULT_PROMPT_VERSION")

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [s.strip() for s in self.ALLOWED_ORIGINS_STR.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()