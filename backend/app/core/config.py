from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Career Predict Resume Parser"
    max_file_size_mb: int = 10
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    sqlite_db_path: str = "data/career_predict.db"
    llm_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("CAREER_PREDICT_LLM_API_KEY", "DEEPSEEK_API_KEY"),
    )
    llm_base_url: str = Field(
        default="https://api.deepseek.com",
        validation_alias=AliasChoices("CAREER_PREDICT_LLM_BASE_URL", "DEEPSEEK_BASE_URL"),
    )
    llm_model: str = Field(
        default="deepseek-chat",
        validation_alias=AliasChoices("CAREER_PREDICT_LLM_MODEL", "DEEPSEEK_MODEL"),
    )
    llm_timeout_seconds: int = Field(
        default=30,
        validation_alias=AliasChoices("CAREER_PREDICT_LLM_TIMEOUT_SECONDS", "DEEPSEEK_TIMEOUT_SECONDS"),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="CAREER_PREDICT_",
        extra="ignore",
    )


settings = Settings()
