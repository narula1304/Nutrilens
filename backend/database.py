from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# We'll use SQLite for development. It creates a file 'nutrilens.db'
DATABASE_URL = "sqlite:///./nutrilens.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} # check_same_thread is only for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# This function will be used by our API endpoints to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()