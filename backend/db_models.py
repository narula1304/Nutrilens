from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    meals = relationship("MealEntry", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    daily_calorie_target = Column(Integer, nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="profile")

class MealEntry(Base):
    __tablename__ = "meal_entries"
    id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String, index=True)
    
    grams = Column(Float, nullable=True) # <-- MODIFIED: Added this line
    
    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)
    fiber = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="meals")