# Krushak Hithaishi — second tomato model integration

The uploaded `tomato_disease_model.keras.zip` was inspected, and **it is already a valid Keras `.keras` model archive** (it contains `metadata.json`, `config.json`, and `model.weights.h5`). It has been renamed (without extracting the internal contents) to:

`backend/model_artifacts/tomato_disease_model.keras`

This is a **Keras 3 EfficientNetB0** model, separate from the existing **MobileNetV2 15-class model**:

| Model | Shape | Outputs | Labels present | Integration |
| --- | --- | --- | --- | --- |
| MobileNetV2 | 224×224×3 | 15 | Yes, `class_names.json` | Enabled |
| EfficientNetB0 tomato model | 224×224×3 | 10 | **No** | Included but locked pending labels |

The model itself was loaded and a forward pass returned a finite 10-output softmax vector. This does **not** establish its class meanings or validation accuracy.

## Exactly what is still needed

**Required to activate the tomato specialist:** the original **ten** class names **in exactly the same index order** used when training this specific EfficientNetB0 model. Export them to this path:

`backend/model_artifacts/tomato_class_names.json`

The file must be a JSON array of ten unique non-empty text strings, for example `['...']` in the source training notebook, serialized as JSON. **Do not copy the ten tomato labels from the MobileNetV2 `class_names.json` unless you have verified that the class-to-index mapping was identical when this EfficientNetB0 model was trained.** The model file itself does not store those names.

Training scripts commonly expose the mapping as `train_generator.class_indices`, `train_dataset.class_names`, or `train_data.class_names` (depending on library). Preserve the exact original class-to-index order.

Once you supply the actual `tomato_class_names.json`, rebuild Docker with:

```powershell
docker compose up --build -d
```

Then visit `http://localhost:8000/api/model/status`. The `tomato_specialist.status` will be `ready` if the labels and model load properly. At `http://localhost:3000/detect`, tomato scans can use the specialist. Without that file, auto mode uses the existing MobileNetV2 model.

### Other items needed before agricultural use

- Validation metrics for **this** EfficientNetB0 model, not the earlier MobileNetV2 accuracy estimate: test accuracy, confusion matrix, per-class precision/recall and actual independent farm-photo evaluation.
- Training data provenance, splits and preprocessing documentation; 224×224×3 is confirmed, but the ten disease identities are not.
- Human-reviewed crop guidance and field testing before farmers rely on any AI diagnosis.
- Functional Docker/browser testing on your Windows laptop (container builds were not run here).

## Technical details and safety

- The EfficientNetB0 model contains its own `Rescaling` preprocessing. The backend sends resized RGB `float32` pixels in the **0–255** range. It does not apply `/255`, `preprocess_input`, or another normalization.
- The serialized preprocessing includes random flip/rotation/zoom/contrast augmentation, which is inactive during prediction.
- An explicit API choice `model=tomato_specialist` returns `model_unavailable` without fabricating a disease when labels are missing.
- `model=auto` keeps the MobileNetV2 behavior as a safe fallback. `model=general` always uses the MobileNetV2.
- Image-only models do **not** consume weather, growth stage, or soil. Scores are uncalibrated model probabilities, not accuracy estimates.
- Do not share `.env` secrets or screenshots of them.
