# Krushak Hithaishi — EfficientNetB0 specialist integration

## Original class labels

The 10 ordered tomato labels were provided from the SAME training notebook as the EfficientNetB0 `.keras` file, confirmed by the project team. The backend file is `backend/model_artifacts/tomato_class_names.json`.

## Evaluation, November 10, 2026

The uploaded `images.zip` contains 100 images per tomato disease/healthy class (1,000 total). We performed actual inference with the supplied EfficientNetB0 using 224×224 RGB pixels without extra scaling.

| Metric | Value |
| --- | ---: |
| Images | 1,000 |
| Correct | 988 |
| Incorrect | 12 |
| Accuracy | 98.8% |
| Macro-F1 | 98.8% |

Earlier MobileNetV2 evaluation on the same 1,000 tomato images: 88.2%. **Do not treat this as an independent scientific comparison** without verifying that neither model has previously trained on the images.

**Limitations:** The sample is PlantVillage-style controlled-background photography. Training-image overlap is unknown. No independent Indian farm validation, growth-stage evaluation, calibration or external disease-review confirmation has been performed. An EfficientNetB0 confidence score is not a diagnosis or calibrated probability.

## Website operation

1. Choose Tomato → AI Model dropdown → `EfficientNetB0 — 10-class tomato specialist (experimental)` to use the new model.
2. The default selection keeps `MobileNetV2` for all three crops, which can signal cross-crop mismatch.
3. The specialist only predicts tomato disease labels; it **does not verify that the photo really depicts tomato**.
4. For the specialist, class output is mapped to the 15-class project's canonical tomato label IDs, so the reference-linked advisory page can display approved *general educational* information.
5. The result page discloses that crop stage is not used by either model and no explainability heatmap is implemented.

## Local installation (Windows, VS Code)

Extract this ZIP to a **new folder**. If you have an existing working installation and database, copy your existing `.env` to the new folder; do not send it to other people. Do not delete Docker database volumes. In the new folder run `docker compose up --build -d` with Docker Desktop Engine running. If you do not already have an `.env`, run `START_WEBSITE.bat` and follow first-time setup.

Open http://localhost:3000/api/model/status and verify `tomato_specialist.status` is `ready`. Then open http://localhost:3000/detect and select Tomato → EfficientNetB0.

This release was tested with Keras (Torch backend locally) and FastAPI; a full Docker and browser build on your Windows PC is still not independently verified.
