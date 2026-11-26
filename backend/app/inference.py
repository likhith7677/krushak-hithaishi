"""Load the user-trained Keras 3 MobileNetV2 model for real 15-class inference.

Important: Keras model includes Rescaling(1/127.5, offset=-1), so images must
remain in 0..255 RGB space. No extra MobileNet preprocess_input or /255.
"""
import json
import logging
import os
import threading
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

LOGGER = logging.getLogger(__name__)
MODEL_PATH = Path(os.getenv("MODEL_FILE", "/app/model_artifacts/plant_disease_model.keras"))
LABELS_PATH = Path(os.getenv("CLASS_NAMES_FILE", "/app/model_artifacts/class_names.json"))
IMAGE_SIZE = (224, 224)
CROP_NAMES = {"tomato": "Tomato", "potato": "Potato", "bell_pepper": "Bell pepper (capsicum)"}


def crop_for_label(label: str) -> str | None:
    if label.startswith("Tomato_"):
        return "tomato"
    if label.startswith("Potato___"):
        return "potato"
    if label.startswith("Pepper__bell___"):
        return "bell_pepper"
    return None


def disease_for_label(label: str) -> str:
    if label.startswith("Tomato_"):
        value = label.removeprefix("Tomato_")
    elif label.startswith("Potato___"):
        value = label.removeprefix("Potato___")
    elif label.startswith("Pepper__bell___"):
        value = label.removeprefix("Pepper__bell___")
    else:
        value = label
    return " ".join(value.replace("__", "_").replace("_", " ").split())


class ModelService:
    def __init__(self, model_path=MODEL_PATH, labels_path=LABELS_PATH):
        self.model_path = Path(model_path)
        self.labels_path = Path(labels_path)
        self._lock = threading.RLock()
        self.model = None
        self.labels: list[str] = []
        self.error = None

    def load(self):
        with self._lock:
            if self.model is not None:
                return True
            if not self.model_path.is_file() or not self.labels_path.is_file():
                self.error = 'Trained model or matching class names file not found.'
                return False
            try:
                with self.labels_path.open(encoding="utf-8") as f:
                    labels = json.load(f)
                if not isinstance(labels, list) or len(labels) != 15 or not all(isinstance(x, str) for x in labels):
                    raise ValueError('Expected a list of 15 class names')
                if len(set(labels)) != len(labels) or any(crop_for_label(x) is None for x in labels):
                    raise ValueError('Invalid or duplicate crop labels')
                # Lazy import keeps shop features available if the ML runtime is absent.
                import keras
                model = keras.models.load_model(str(self.model_path), compile=False, safe_mode=True)
                if tuple(model.input_shape[1:]) != (224,224,3) or int(model.output_shape[-1]) != len(labels):
                    raise ValueError('Model input/output shape does not match class names')
                self.model = model
                self.labels = labels
                self.error = None
                LOGGER.info('Loaded actual crop classifier: %s', self.model_path)
                return True
            except Exception:
                LOGGER.exception('Crop disease model could not be loaded')
                self.error = 'AI model files were found but could not be loaded. Check backend logs.'
                return False

    def status(self):
        ready = self.load()
        return {
            'status': 'ready' if ready else 'model_unavailable',
            'model': 'MobileNetV2 / Keras 3' if ready else None,
            'classes': len(self.labels) if ready else 0,
            'crops': list(CROP_NAMES.keys()),
            'message': 'Model loaded. Predictions are advisory, not verified diagnoses.' if ready else self.error,
        }

    def predict(self, image: Image.Image, selected_crop: str):
        if not self.load():
            return {'status':'model_unavailable','prediction':None,'confidence':None,'heatmap':None,'message':self.error}
        with self._lock:
            image = ImageOps.exif_transpose(image).convert('RGB')
            # Pixel values 0..255, float32. Internal Rescaling transforms to -1..1.
            pixels = np.asarray(image.resize(IMAGE_SIZE, Image.Resampling.BILINEAR),dtype=np.float32)
            output = np.asarray(self.model.predict(pixels[None,...],verbose=0))[0]
        if output.shape != (len(self.labels),) or not np.all(np.isfinite(output)):
            return {'status':'inference_error','prediction':None,'confidence':None,'heatmap':None,'message':'Unexpected result from trained model.'}
        index = int(np.argmax(output)); label = self.labels[index]; score = float(output[index])
        predicted_crop = crop_for_label(label)
        human_name = disease_for_label(label)
        caution = 'AI suggestion only; model confidence is not a calibrated accuracy guarantee. Verify with a local agricultural expert before taking action.'
        if predicted_crop != selected_crop:
            return {
                'status':'crop_mismatch','prediction':None,'raw_label':label,
                'predicted_crop':predicted_crop,'disease_name':None,'healthy':None,
                'confidence':score,'heatmap':None,
                'message':f'The model favored {CROP_NAMES.get(predicted_crop,"a different crop")} classes, but you selected {CROP_NAMES[selected_crop]}. Check the crop selection and upload a clear, single-leaf image. No reliable diagnosis was made. {caution}'
            }
        status='low_confidence' if score < 0.60 else 'predicted'
        return {
            'status':status,'prediction':label,'raw_label':label,'predicted_crop':predicted_crop,
            'disease_name':human_name,'healthy':human_name.lower()=='healthy',
            'confidence':round(score,4),'heatmap':None,
            'message':('The model is uncertain. Try a clearer photo; do not rely on this label. ' if status=='low_confidence' else '') + caution,
        }


MODEL_SERVICE = ModelService()
