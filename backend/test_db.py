from app.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()
        print("✅ Database connection successful!")
        print(f"PostgreSQL version: {version[0]}")
except Exception as e:
    print("❌ Database connection failed!")
    print(f"Error: {e}")