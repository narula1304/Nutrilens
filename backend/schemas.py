from pydantic import BaseModel
from typing import Optional, List
import datetime

# --- ADDED: Base schema for nutrition ---
class NutritionInfo(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None

# --- ADDED: New response for /predict ---
class PredictionResponse(BaseModel):
    food_name: str
    confidence: float
    nutrition_per_100g: NutritionInfo


# --- Meal Schemas ---

# --- MODIFIED: MealEntryBase now uses NutritionInfo ---
class MealEntryBase(NutritionInfo):
    food_name: str

# --- MODIFIED: This is what user sends to log a meal ---
class MealEntryCreate(BaseModel):
    food_name: str
    grams: float

# --- MODIFIED: This is returned from the DB ---
class MealEntry(MealEntryBase):
    id: int
    user_id: int
    timestamp: datetime.datetime
    grams: float # Added grams

    class Config:
        orm_mode = True 


# --- Profile Schemas (Unchanged) ---
class ProfileBase(BaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    age: Optional[int] = None
    daily_calorie_target: Optional[int] = None

class ProfileCreate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True


# --- User & Auth Schemas (Unchanged) ---
class UserCreate(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: int
    email: str
    profile: Optional[Profile] = None
    meals: List[MealEntry] = []

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

    # --- ADD THESE SCHEMAS in schemas.py ---
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str