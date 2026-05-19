import os
import sys
from typing import List
# --- 1. IMPORT status AND Gemini library ---
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status # Added status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uvicorn
import google.generativeai as genai # Added Gemini import
# Near the top with other imports
import schemas
import traceback # Import traceback for detailed error logging

# --- ADD 'SCRIPTS' FOLDER TO PATH ---
SCRIPT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts")
if SCRIPT_DIR not in sys.path:
    sys.path.append(SCRIPT_DIR)

# --- IMPORT ALL OUR MODULES ---
try:
    from model_loader import load_model_and_labels # type: ignore
    from predict_image import predict_image # type: ignore
    from utils import get_nutrition_info, load_json # type: ignore

    import auth
    import db_models
    import schemas
    from database import engine, get_db

except ImportError as e:
    print(f"Error: Could not import modules. {e}")
    sys.exit(1)

# --- CONFIGURE GEMINI API ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None # Initialize as None
if not GEMINI_API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY environment variable not set. Chatbot will be disabled.")
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # --- CORRECTED MODEL NAME ---
        gemini_model = genai.GenerativeModel('models/gemini-flash-latest')
        print("✅ Gemini API configured successfully with model 'gemini-1.0-pro'.")



    except Exception as e:
        print(f"❌ ERROR: Failed to configure Gemini API: {e}. Chatbot will be disabled.")
        traceback.print_exc() # Print full traceback for configuration errors
        gemini_model = None

# --- CREATE DB TABLES ---
db_models.Base.metadata.create_all(bind=engine)

# --- APP INITIALIZATION ---
app = FastAPI(title="NutriLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Be more specific in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD ML MODEL ---
print("Loading ML model and data...")
MODEL_PATH = os.path.join("ml_models", "efficientnet_food_model.keras")
LABELS_PATH = os.path.join("data", "class_labels.json")
NUTRITION_PATH = os.path.join("data", "nutrition_data.json")
nutrition_data = None # Initialize
model = None
class_labels = None
try:
    model, class_labels = load_model_and_labels(MODEL_PATH, LABELS_PATH)
    nutrition_data = load_json(NUTRITION_PATH) # Load nutrition data globally
    print("Model and data loaded successfully. API is ready. 🚀")
except Exception as e:
    print(f"❌ ERROR: Failed loading model or essential data: {e}")
    traceback.print_exc()
    # Decide if you want to exit or continue with limited functionality
    # sys.exit(1) # Exit if essential data fails to load

# --- AUTH DEPENDENCIES ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
):
    user = auth.decode_access_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_user_profile(
    db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)
):
    profile = auth.get_profile_for_user(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the NutriLens API! 🍎"}

# --- AUTH ENDPOINTS ---
@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    new_user = auth.create_user(db=db, user=user)
    auth.create_user_profile(db=db, user=new_user)
    profile = auth.get_profile_for_user(db, user_id=new_user.id)
    return {"id": new_user.id, "email": new_user.email, "profile": profile, "meals": [] }

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    user_data = auth.get_user_by_email(db, email=current_user.email) # Re-fetch necessary if relationships aren't loaded automatically
    if not user_data: # Should not happen if token is valid, but good check
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    profile = auth.get_profile_for_user(db, user_id=user_data.id)
    meals = auth.get_meals_for_user(db, user_id=user_data.id)
    return {"id": user_data.id, "email": user_data.email, "profile": profile, "meals": meals}


# --- PROFILE ENDPOINTS ---
@app.get("/profile/me", response_model=schemas.Profile)
async def get_my_profile(profile: schemas.Profile = Depends(get_current_user_profile)):
    return profile

@app.put("/profile/me", response_model=schemas.Profile)
async def update_my_profile(profile_data: schemas.ProfileCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    updated_profile = auth.update_profile_for_user(db, user_id=current_user.id, profile_data=profile_data)
    if not updated_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return updated_profile


# --- PREDICTION & MEAL LOGGING ENDPOINTS ---
@app.post("/predict", response_model=schemas.PredictionResponse)
async def predict_food(image: UploadFile = File(...), current_user: schemas.User = Depends(get_current_user)):
    if not model or not class_labels:
         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Prediction model not loaded.")
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image.")
    try:
        image_bytes = await image.read() # Read bytes for Pillow
        await image.seek(0) # Reset stream position if needed elsewhere (though not strictly necessary here as we read all at once)
        # Pass the file-like object directly if predict_image handles it, or bytes
        predicted_class, confidence = predict_image(model, class_labels, image.file) # Assumes predict_image uses .read()
        nutrition_info = get_nutrition_info(predicted_class, nutrition_data)
        if nutrition_info is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Nutrition data not found for '{predicted_class}'.")
        return {"food_name": predicted_class, "confidence": confidence, "nutrition_per_100g": nutrition_info}
    except Exception as e:
        print(f"❌ ERROR during prediction: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error during prediction.")

@app.post("/meals", response_model=schemas.MealEntry)
def log_meal_entry(meal: schemas.MealEntryCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not nutrition_data:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Nutrition data not available.")
    try:
        db_meal = auth.create_meal_entry(db=db, meal=meal, user_id=current_user.id, nutrition_db=nutrition_data)
        if not db_meal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Food '{meal.food_name}' not found in nutrition database.")
        return db_meal
    except Exception as e:
        print(f"❌ ERROR logging meal: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not log meal.")


@app.get("/meals", response_model=List[schemas.MealEntry])
def get_my_meal_history(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    try:
        return auth.get_meals_for_user(db=db, user_id=current_user.id)
    except Exception as e:
        print(f"❌ ERROR fetching meal history: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not fetch meal history.")


@app.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    try:
        success = auth.delete_meal_entry(db=db, meal_id=meal_id, user_id=current_user.id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Meal with id {meal_id} not found or permission denied.")
        return None
    except Exception as e:
        print(f"❌ ERROR deleting meal {meal_id}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete meal.")


# --- NUTRITION DATA ENDPOINT ---
@app.get("/nutrition-data")
def get_nutrition_database():
    if nutrition_data:
        return nutrition_data
    else:
        # This means the server started without loading essential data
        print("❌ ERROR: /nutrition-data called but nutrition_data is None.")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Nutrition data not loaded on server startup.")


# --- UPDATED CHATBOT ENDPOINT ---
@app.post("/chatbot", response_model=schemas.ChatResponse)
async def handle_chat_message(
    chat_request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user) # PROTECTED
):
    """
    Handles incoming chat messages, gets context, calls Gemini API, and returns the reply.
    """
    user_message = chat_request.message
    print(f"Received message from user {current_user.id}: {user_message}")

    if not gemini_model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Assistant is currently unavailable. Check API key configuration."
        )

    # Fetch User Context
    profile = auth.get_profile_for_user(db, current_user.id)
    recent_meals = auth.get_meals_for_user(db, current_user.id)[-5:] # Get last 5

    # Construct the Prompt
    prompt_context = f"""
    You are NutriLens, a helpful AI nutrition assistant integrated into a web application.
    Your goal is to provide concise, helpful, and safe nutritional advice based on the user's context and question.
    Avoid giving medical advice. Focus on general nutrition, food information, and healthy habits.
    Keep your answers relatively brief and easy to understand. Format key points using markdown lists if appropriate.

    User Context:
    - Profile: {'Height: '+str(profile.height_cm)+'cm' if profile and profile.height_cm else ''}{', Weight: '+str(profile.weight_kg)+'kg' if profile and profile.weight_kg else ''}{', Age: '+str(profile.age) if profile and profile.age else ''}{', Daily Calorie Target: '+str(profile.daily_calorie_target)+'kcal' if profile and profile.daily_calorie_target else ''}. {'(No profile data available)' if not profile else ''}
    - Recent Meals (up to 5):
    """
    if recent_meals:
        for meal in recent_meals:
            meal_str = f"  - {meal.food_name or 'Unknown'} ({meal.grams:.0f}g"
            details = []
            if meal.calories is not None: details.append(f"{meal.calories:.0f}kcal")
            if meal.protein is not None: details.append(f"{meal.protein:.1f}g P")
            if meal.carbs is not None: details.append(f"{meal.carbs:.1f}g C")
            if meal.fat is not None: details.append(f"{meal.fat:.1f}g F")
            if details: meal_str += f", {', '.join(details)}"
            meal_str += ")"
            prompt_context += meal_str + "\n"
    else:
        prompt_context += "  - No recent meals logged.\n"

    full_prompt = prompt_context + f"\nUser Question: \"{user_message}\"\n\nAssistant Response:"

    # Call Gemini API
    try:
        print(f"Sending prompt to Gemini for user {current_user.id}...")
        # --- USE ASYNC CALL ---
        response = await gemini_model.generate_content_async(full_prompt)

        # Check for safety blocks or empty response
        if not response.parts:
             print(f"⚠️ WARNING: Gemini response blocked or empty for user {current_user.id}. Feedback: {response.prompt_feedback}")
             ai_reply = "I cannot provide a response to that request based on safety guidelines or lack of content."
        else:
             ai_reply = response.text
             print(f"Received reply from Gemini for user {current_user.id}.")

    except Exception as e:
        print(f"❌ ERROR: Gemini API call failed for user {current_user.id}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI assistant unavailable due to an API error." # Avoid exposing detailed error to user
        )

    # Return the Response (ai_reply already handles empty/blocked case from try block)
    return schemas.ChatResponse(reply=ai_reply)
# --- END OF UPDATED CHATBOT ENDPOINT ---


# --- RUN THE APP ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)