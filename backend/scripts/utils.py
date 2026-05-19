import json
import os

def load_json(file_path: str):
    """Load JSON file safely."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ JSON file not found at {file_path}")
    with open(file_path, 'r') as f:
        return json.load(f)

def get_nutrition_info(label: str, nutrition_data: dict):
    """Fetch nutrition info for a predicted food label."""
    label = label.lower().strip()
    if label in nutrition_data:
        return nutrition_data[label]['per_100g']
    else:
        return None
