"""Optional user-trained EfficientNetB0 tomato specialist.

The 10 labels are from the SAME training notebook as this model, as confirmed
by the project team. This permits mapping outputs to labels but does not prove
a field diagnosis or independent test accuracy.

EfficientNetB0 inside the model applies its own rescaling. We supply RGB
float32 pixel values in 0..255 without dividing or preprocessing again.
"""
import json
import logging
import os
import threading
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

LOGGER = logging.getLogger(__name__)
TOMATO_MODEL_PATH = Path(os.getenv('TOMATO_MODEL_FILE', '/app/model_artifacts/tomato_disease_model.keras'))
TOMATO_LABELS_PATH = Path(os.getenv('TOMATO_CLASS_NAMES_FILE', '/app/model_artifacts/tomato_class_names.json'))

# Map the specialist model's labels to the main app's disease guidance keys.
# Do NOT infer this order from the MobileNetV2 label list: it is taken from
# the specialist model's own training class_names.json.
CANONICAL_TOMATO_LABELS = {
    'Bacterial Spot': 'Tomato_Bacterial_spot',
    'Early Blight': 'Tomato_Early_blight',
    'Healthy': 'Tomato_healthy',
    'Late Blight': 'Tomato_Late_blight',
    'Leaf Mold': 'Tomato_Leaf_Mold',
    'Septoria Leaf Spot': 'Tomato_Septoria_leaf_spot',
    'Spider Mites Two-spotted Spider Mite': 'Tomato_Spider_mites_Two_spotted_spider_mite',
    'Target Spot': 'Tomato__Target_Spot',
    'Tomato Mosaic Virus': 'Tomato__Tomato_mosaic_virus',
    'Tomato Yellow Leaf Curl Virus': 'Tomato__Tomato_YellowLeaf__Curl_Virus',
}



class TomatoModelService:
    def __init__(self, model_path=TOMATO_MODEL_PATH, labels_path=TOMATO_LABELS_PATH):
        self.model_path = Path(model_path)
        self.labels_path = Path(labels_path)
        self.model = None
        self.labels: list[str] = []
        self.error = None
        self._lock = threading.RLock()

    def load(self):
        with self._lock:
            if self.model is not None:
                return True
            if not self.model_path.is_file():
                self.error = 'Tomato EfficientNetB0 model file is missing.'
                return False
            if not self.labels_path.is_file():
                self.error = 'The 10 class names IN TRAINING ORDER are required for this model. Predictions are disabled until tomato_class_names.json is supplied.'
                return False
            try:
                labels = json.loads(self.labels_path.read_text(encoding='utf-8'))
                if not isinstance(labels, list) or len(labels) != 10:
                    raise ValueError('Need an ordered JSON list of exactly 10 class names')
                if not all(isinstance(s, str) and 0 < len(s.strip()) <= 100 for s in labels):
                    raise ValueError('Every label must be a nonempty text string')
                if len({s.strip().casefold() for s in labels}) != 10:
                    raise ValueError('Class labels must be distinct')
                if set(labels) != set(CANONICAL_TOMATO_LABELS):
                    raise ValueError('Unexpected tomato labels; update the verified mapping before using this model')
                import keras
                model = keras.models.load_model(str(self.model_path), compile=False, safe_mode=True)
                if tuple(model.input_shape[1:]) != (224, 224, 3) or int(model.output_shape[-1]) != 10:
                    raise ValueError('Tomato model input/output shape mismatch')
                self.model = model
                self.labels = labels
                self.error = None
                LOGGER.info('Loaded EfficientNetB0 tomato model with 10 class labels')
                return True
            except Exception:
                LOGGER.exception('Could not load the tomato specialist model')
                self.error = 'Tomato specialist model or labels could not be loaded; check the backend logs.'
                return False

    def status(self):
        ready = self.load()
        state = 'ready' if ready else ('pending_class_labels' if self.model_path.is_file() and not self.labels_path.is_file() else 'model_unavailable')
        return {
            'status': state,
            'model': 'EfficientNetB0 / Keras 3',
            'classes': 10,
            'crop': 'tomato',
            'message': 'Tomato specialist ready. Advisory model predictions are not diagnoses.' if ready else self.error,
        }

    def predict(self, image: Image.Image):
        if not self.load():
            return {'status':'model_unavailable','prediction':None,'confidence':None,'heatmap':None,
                    'message':self.error}
        with self._lock:
            rgb = ImageOps.exif_transpose(image).convert('RGB')
            pixels = np.asarray(rgb.resize((224,224), Image.Resampling.BILINEAR), dtype=np.float32)
            probabilities = np.asarray(self.model.predict(pixels[None,...], verbose=0))[0]
        if probabilities.shape != (10,) or not np.all(np.isfinite(probabilities)):
            return {'status':'inference_error','prediction':None,'confidence':None,'heatmap':None,
                    'message':'Unexpected model output.'}
        index = int(np.argmax(probabilities))
        label = self.labels[index]
        disease = label
        canonical_label = CANONICAL_TOMATO_LABELS[label]
        confidence = float(probabilities[index])
        is_uncertain = confidence < 0.60
        caution = ('Tomato-only model: the crop was selected by the user, not independently verified by this model. '
                   'AI suggestion only. Model confidence is not calibrated or validated on field conditions. '
                   'Confirm symptoms with a local agricultural expert before choosing treatment.')
        return {
            'status':'low_confidence' if is_uncertain else 'predicted',
            'prediction':canonical_label,
            'raw_label':label,
            'predicted_crop':'tomato',
            'disease_name':disease,
            'healthy':disease.strip().casefold()=='healthy',
            'confidence':round(confidence,4),
            'heatmap':None,
            'message':('Low model confidence. Retake a clear leaf photo. ' if is_uncertain else '') + caution,
        }


TOMATO_MODEL_SERVICE = TomatoModelService()
