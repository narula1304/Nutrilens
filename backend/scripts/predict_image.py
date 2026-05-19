import numpy as np
from PIL import Image
import tensorflow as tf
from io import BytesIO  

def preprocess_image(image_file): # <-- 2. CHANGED argument to image_file
    # Load and resize image from file stream
    img_data = image_file.read()
    img = Image.open(BytesIO(img_data)).convert("RGB")
    img = img.resize((224, 224))  # EfficientNetB0 expects 224x224
    
    # Convert to numpy array
    img_array = np.array(img)
    
    # Convert to float32
    img_array = img_array.astype(np.float32)
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

def predict_image(model, class_labels, image_file): # <-- 2. CHANGED argument to image_file
    img_array = preprocess_image(image_file) # Pass the file stream
    
    # If the model already contains a Rescaling or Normalization layer...
    first_layer_types = [l.__class__.__name__ for l in model.layers[:6]]
    has_rescaling = any(n == 'Rescaling' for n in first_layer_types)
    has_normalization = any(n == 'Normalization' for n in first_layer_types)

    if not has_rescaling and not has_normalization:
        img_array = img_array / 255.0
    else:
        # model will handle scaling/normalization
        pass
        
    preds = model.predict(img_array)
    idx = int(np.argmax(preds))
    
    # class_labels may be a list or a dict with string numeric keys
    if isinstance(class_labels, dict):
        # try string key first, then integer key
        predicted_class = class_labels.get(str(idx), class_labels.get(idx, idx))
    else:
        predicted_class = class_labels[idx]
        
    confidence = float(np.max(preds)) # <-- 3. CONVERTED to standard float
    return predicted_class, confidence