# Class-label-only crop analysis (Version 6)

This update changes **result presentation and API metadata**, not the trained model weights.

## What the model can report
1. User-selected crop (tomato/potato/capsicum). MobileNetV2 checks for crop mismatch. EfficientNetB0 assumes the leaf is tomato.
2. Exactly one class label from the 15-class MobileNetV2 or 10-class tomato EfficientNetB0 model.
3. A label-derived issue category: bacterial, fungal, oomycete (fungus-like), mite pest, viral or healthy. This is a static educational lookup, not another model prediction or a lab-confirmed pathogen.
4. A model output score (not calibrated diagnostic certainty).
5. Generic reference-linked checks only for a credible prediction. For crop mismatch or low-confidence results, there is **no named-disease guidance**.

## What is not determined
- Growth stage: not assessed. The former stage selector and voice stage commands are removed.
- Disease severity: not assessed.
- Soil fertility/nutrient deficiency: not assessed.
- Fertilizer, pesticide or treatment recommendations: not assessed. **Fertilizers do not cure infectious plant diseases**. Such advice would require verified symptoms, crop conditions, soil/nutrient context and local approved practices.

## API compatibility
`POST /api/detect` accepts `crop`, `model`, and `file`. A legacy `stage` query parameter is accepted but ignored; no result is changed by it.
Each success/failure response with a model result reports `class_label`, `disease_group`, `analysis_basis`, `growth_stage`, `disease_severity`, `fertilizer_recommendation`, and `crop_stage_used`. `class_label` and `disease_group` are null for mismatch and untrusted results.

## Running
Keep a safe copy of your original Version 5 and private `.env`, extract this archive to a NEW folder, copy `.env`, start Docker Desktop, then run `docker compose up --build -d` inside `krushak-hithaishi`. Open `http://localhost:3000/detect`. Check the language selector and voice result.

## Testing
- `python -m pytest -q` from `backend/` with test requirements installed.
- `npm run lint` and `npm run test:voice` from `frontend/` with npm dependencies installed.
- Test real browser microphone/voices on a trusted device; no full device voice validation has been claimed.
