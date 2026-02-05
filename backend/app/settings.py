"""
Application settings loaded from environment variables.

Environment Variables:
    SUPABASE_URL: URL of your Supabase instance
    SUPABASE_KEY: Supabase service role key (for backend use)
    SUPABASE_ANON_KEY: Supabase anonymous key (optional)
    CORS_ORIGINS: Comma-separated list of allowed origins

CORS Configuration for Multi-Platform:
    - Web dev: http://localhost:5173
    - Desktop dev: Uses the same Vite dev server URL
    - Mobile dev: http://<YOUR_LOCAL_IP>:5173 (or Expo dev client origin)
    - Production: Your deployed frontend domain(s)

Example CORS_ORIGINS for local development:
    CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://192.168.1.100:5173
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Settings are loaded from environment variables.
    For local dev, create a .env file in the backend/ directory.
    """

    supabase_url: str
    supabase_key: str
    supabase_anon_key: str | None = None

    # CORS origins - comma-separated list
    # For mobile development, add your machine's local IP address
    # Example: "http://localhost:5173,http://192.168.1.100:5173"
    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_cors_origins(self) -> list[str]:
        """
        Parse comma-separated CORS origins into a list.

        Returns all non-empty, stripped origins from the CORS_ORIGINS env var.
        """
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
