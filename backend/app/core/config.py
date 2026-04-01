from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Career Predict Resume Parser"
    max_file_size_mb: int = 10
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    sqlite_db_path: str = "data/career_predict.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="CAREER_PREDICT_",
        extra="ignore",
    )


settings = Settings()
