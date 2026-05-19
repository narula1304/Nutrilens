from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import db_models
import schemas

# --- 1. Security & Password Hashing ---

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "YOUR_SUPER_SECRET_KEY_HERE"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)


# --- 2. Authentication & JWT (Token) Functions ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None 
    
    user = get_user_by_email(db, email=email)
    if user is None:
        return None
    return user


# --- 3. Database Helper (CRUD) Functions ---

def get_user_by_email(db: Session, email: str):
    return db.query(db_models.User).filter(db_models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = db_models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_user_profile(db: Session, user: db_models.User):
    db_profile = db_models.Profile(user_id=user.id)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# --- MODIFIED: This function now does the math ---
def create_meal_entry(db: Session, meal: schemas.MealEntryCreate, user_id: int, nutrition_db: dict):
    """
    Saves a new meal entry.
    Calculates nutrition based on grams.
    """
    
    # Get the 100g data
    food_name_lower = meal.food_name.lower()
    if food_name_lower not in nutrition_db:
        return None # Food not in our nutrition list
        
    per_100g_data = nutrition_db[food_name_lower]['per_100g']
    
    # Calculate the multiplier
    multiplier = meal.grams / 100.0
    
    # Calculate final values
    final_calories = per_100g_data['calories'] * multiplier
    final_protein = per_100g_data['protein'] * multiplier
    final_carbs = per_100g_data['carbs'] * multiplier
    final_fat = per_100g_data['fat'] * multiplier
    final_fiber = per_100g_data.get('fiber', 0) * multiplier
    
    # Create the database object with the calculated values
    db_meal = db_models.MealEntry(
        food_name=meal.food_name,
        grams=meal.grams,
        calories=final_calories,
        protein=final_protein,
        carbs=final_carbs,
        fat=final_fat,
        fiber=final_fiber,
        user_id=user_id
    )
    
    db.add(db_meal)
    db.commit()
    db.refresh(db_meal)
    return db_meal
# --- End of modification ---

# --- ADD THIS FUNCTION ---
def delete_meal_entry(db: Session, meal_id: int, user_id: int):
    """Deletes a specific meal entry if it belongs to the user."""
    db_meal = db.query(db_models.MealEntry).filter(
        db_models.MealEntry.id == meal_id,
        db_models.MealEntry.user_id == user_id # Ensure the meal belongs to the current user
    ).first()

    if db_meal:
        db.delete(db_meal)
        db.commit()
        return True # Indicate success
    return False # Indicate meal not found or not owned by user


def get_meals_for_user(db: Session, user_id: int):
    return db.query(db_models.MealEntry).filter(db_models.MealEntry.user_id == user_id).all()

def get_profile_for_user(db: Session, user_id: int):
    return db.query(db_models.Profile).filter(db_models.Profile.user_id == user_id).first()

def update_profile_for_user(db: Session, user_id: int, profile_data: schemas.ProfileCreate):
    db_profile = get_profile_for_user(db, user_id)
    if db_profile:
        update_data = profile_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_profile, key, value)
        
        try:
            if db_profile.weight_kg and db_profile.height_cm and db_profile.age:
                # Placeholder for BMR calculation
                bmr = 10 * db_profile.weight_kg + 6.25 * db_profile.height_cm - 5 * db_profile.age + 5
                db_profile.daily_calorie_target = int(bmr * 1.2)
        except Exception as e:
            print(f"Could not calculate BMR: {e}")

        db.commit()
        db.refresh(db_profile)
    return db_profile