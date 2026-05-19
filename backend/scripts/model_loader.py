import tensorflow as tf
import json
import os
import h5py


def load_model_and_labels(model_path, labels_path):
    """Load the model and labels.

    This will try to load a full saved model first (model architecture + weights).
    If that fails (for example the file contains only weights), it will
    reconstruct the architecture and load weights into it.
    """
    # Load labels first
    with open(labels_path, "r") as f:
        class_labels = json.load(f)
    num_classes = len(class_labels)

    # Prefer a .keras full-model file if present next to the provided path
    stem = os.path.splitext(model_path)[0]
    keras_path = stem + '.keras'
    keras_converted = stem + '_converted.keras'
    tried_paths = []

    # prefer an explicit converted .keras if available
    if os.path.exists(keras_converted):
        tried_paths.append(keras_converted)
    if os.path.exists(keras_path):
        tried_paths.append(keras_path)
    # Always also try the provided path (it may be .h5 or .keras)
    tried_paths.append(model_path)

    for p in tried_paths:
        try:
            model = tf.keras.models.load_model(p, compile=False)
            print(f"Loaded full model from: {p}")
            return model, class_labels
        except Exception as e:
            print(f"Warning: loading full model from '{p}' failed: {e}")

    print("Falling back to recreating the architecture and loading weights (weights-only file expected).")

    # Fall back to recreating the architecture and loading weights
    # If the file contains a model_config (full architecture saved), rebuild from that first
    try:
        with h5py.File(model_path, 'r') as f:
            if 'model_config' in f.attrs:
                raw = f.attrs['model_config']
                if isinstance(raw, bytes):
                    model_json = raw.decode('utf-8')
                else:
                    model_json = str(raw)
                try:
                    model = tf.keras.models.model_from_json(model_json)
                    print('Reconstructed model architecture from model_config in file.')
                    try:
                        print('Reconstructed model layers:', len(model.layers))
                        print('First 8 layer names:', [l.name for l in model.layers[:8]])
                    except Exception:
                        pass
                    # Use by_name=True to tolerate naming / serialization differences
                    try:
                        model.load_weights(model_path, by_name=True)
                        return model, class_labels
                    except Exception as e_load:
                        print(f'load_weights(by_name=True) failed on reconstructed model: {e_load}')
                except Exception as e:
                    print(f'Failed to reconstruct model from model_config: {e}')
    except Exception:
        # file may not be HDF5 or accessible; fall through to manual recreation
        pass

    base_model = tf.keras.applications.EfficientNetB0(
        weights=None,
        include_top=False,
        input_shape=(224, 224, 3)
    )

    base_model.trainable = False

    inputs = tf.keras.Input(shape=(224, 224, 3))
    x = base_model(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.5)(x)
    x = tf.keras.layers.Dense(256, activation='relu')(x)
    outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)

    model = tf.keras.Model(inputs, outputs)

    # Load weights-only file into the recreated architecture
    try:
        # use by_name to be resilient to serialization naming differences
        model.load_weights(model_path, by_name=True)
    except Exception as e:
        print(f"Error loading weights into reconstructed model (by_name=True): {e}")
        raise

    return model, class_labels
