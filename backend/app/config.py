from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_text_model: str = "llama-3.3-70b-versatile"
    groq_vision_model: str = "qwen/qwen3.6-27b"
    mock_mode: Literal["auto", "force", "off"] = "auto"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    max_upload_mb: int = 20
    min_image_px: int = 256
    alignment_tolerance_px: float = 1.5

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def llm_configured(self) -> bool:
        return bool(self.groq_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
