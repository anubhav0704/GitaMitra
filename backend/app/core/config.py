from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "GitaMitra API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "gitamitra"
    POSTGRES_PORT: str = "5432"

    # JWT & OAuth Authentication
    JWT_SECRET: str = "super_secret_key_change_this_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    GOOGLE_CLIENT_ID: str = ""

    # RAG Settings
    RAG_TOP_K: int = 5
    RAG_MIN_SCORE: float = 0.05
    RAG_SEMANTIC_WEIGHT: float = 0.6
    RAG_KEYWORD_WEIGHT: float = 0.2
    RAG_METADATA_WEIGHT: float = 0.2

    # LLM Settings
    LLM_PROVIDER: str = "mock" # "mock", "openai", "gemini", "groq"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 1024
    CHAT_HISTORY_LIMIT: int = 6

    # Memory Settings (Step 6)
    MEMORY_ENABLED: bool = True
    MEMORY_MIN_IMPORTANCE: int = 2
    MEMORY_TOP_K: int = 5
    MEMORY_SEMANTIC_WEIGHT: float = 0.50
    MEMORY_IMPORTANCE_WEIGHT: float = 0.20
    MEMORY_RECENCY_WEIGHT: float = 0.15
    MEMORY_CONFIDENCE_WEIGHT: float = 0.15
    MEMORY_SIMILARITY_THRESHOLD: float = 0.85
    MEMORY_MIN_QUERY_LENGTH: int = 8

    # Voice Settings (Step 8)
    VOICE_ENABLED: bool = True
    STT_PROVIDER: str = "groq" # "groq", "openai", "mock"
    STT_MODEL: str = "whisper-large-v3"
    STT_API_KEY: str = ""
    TTS_PROVIDER: str = "mock" # "openai", "elevenlabs", "edge", "mock"
    TTS_MODEL: str = "tts-1"
    TTS_API_KEY: str = ""
    TTS_VOICE: str = "onyx" # Calm, deep, respectful spiritual persona
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = ""
    VOICE_LANGUAGE: str = "auto" # "auto", "en", "hi"
    VOICE_MAX_DURATION_SECONDS: int = 60
    VOICE_MAX_FILE_SIZE_MB: int = 10
    VOICE_CACHE_ENABLED: bool = True
    VOICE_CACHE_DIR: str = "/tmp/gitamitra_voice_cache"

    # Security & Session Settings
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # Rate Limiting & Cost Protections
    RATE_LIMIT_ENABLED: bool = True
    AUTH_RATE_LIMIT: str = "10/minute"
    CHAT_RATE_LIMIT: str = "20/minute"
    VOICE_RATE_LIMIT: str = "15/minute"
    MAX_MESSAGE_LENGTH: int = 2000

    # Database Pooling
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Error Tracking & Monitoring
    ERROR_TRACKING_ENABLED: bool = False
    ERROR_TRACKING_DSN: str = ""

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
