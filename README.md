# NutriLens

NutriLens is a full-stack nutrition tracking application that combines image-based food recognition, meal logging, calorie and macro tracking, and an AI nutrition chatbot. The project uses a React frontend with a FastAPI backend, SQLite for local development, and a trained TensorFlow model for food classification.

## Features

- User registration and login with token-based authentication
- Personal profile management with nutrition goals
- Food image upload and prediction using a trained ML model
- Nutrition lookup from local food data
- Meal logging with calorie, protein, carbohydrate, and fat values
- Dashboard with daily progress and weekly consistency insights
- Meal history with delete support
- AI chatbot support using Gemini API

## Tech Stack

**Frontend**

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Chart.js

**Backend**

- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- TensorFlow
- Pillow
- Google Generative AI

## Project Structure

```text
nutrilens_project/
├── backend/
│   ├── data/                 # Nutrition data and class labels
│   ├── ml_models/            # Trained food recognition model
│   ├── scripts/              # Model loading, prediction, utility helpers
│   ├── auth.py               # Authentication logic
│   ├── database.py           # SQLite database configuration
│   ├── db_models.py          # SQLAlchemy models
│   ├── main.py               # FastAPI app and API routes
│   ├── requirements.txt      # Python dependencies
│   └── schemas.py            # Pydantic schemas
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

Install the following tools before running the project:

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- Git

## Backend Setup

Open a terminal in the project root and run:

```powershell
cd backend
```

Create and activate a virtual environment if one is not already available:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
pip install -r requirements.txt
```

Optional: set a Gemini API key to enable chatbot responses:

```powershell
$env:GEMINI_API_KEY="your_gemini_api_key"
```

Start the backend server:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will run at:

```text
http://127.0.0.1:8000
```

API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open a second terminal in the project root and run:

```powershell
cd frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

The frontend API client is configured to call the backend at `http://127.0.0.1:8000`.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Health/welcome route |
| POST | `/register` | Create a new user account |
| POST | `/token` | Log in and receive an access token |
| GET | `/users/me` | Get the current authenticated user |
| GET | `/profile/me` | Get the current user's profile |
| PUT | `/profile/me` | Update profile and nutrition targets |
| POST | `/predict` | Predict food from an uploaded image |
| POST | `/meals` | Log a meal |
| GET | `/meals` | Get meal history |
| DELETE | `/meals/{meal_id}` | Delete a meal entry |
| GET | `/nutrition-data` | Get available nutrition data |
| POST | `/chatbot` | Ask the AI nutrition chatbot |

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Enables Gemini chatbot responses when provided |

If `GEMINI_API_KEY` is not set, the application can still run, but chatbot functionality may be disabled.

## Notes

- The project uses SQLite for local development, and the database file is generated locally.
- The ML model files are stored in `backend/ml_models/`.
- Do not commit virtual environments, `node_modules`, local database files, or secret environment files.

## GitHub Upload

After making changes, push updates with:

```powershell
git add .
git commit -m "Update README"
git push
```

## Author

Developed by [narula1304](https://github.com/narula1304).
