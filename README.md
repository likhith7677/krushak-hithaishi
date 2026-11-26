<<<<<<< HEAD
> **V7 Voice Farmer Assistant:** Please read [VOICE_ASSISTANT_V7_READ_ME_FIRST.md](VOICE_ASSISTANT_V7_READ_ME_FIRST.md) for Kannada/Telugu questions, free and optional neural voices, privacy, and safe upgrade instructions.

# Version 6 — Class-label-only leaf analysis

The scanner now reports the original model class label and a static label-based disease/pest category; it does **not** infer crop growth stage, disease severity or fertilizer requirements. Trained models and four-language voice capabilities are preserved. See `CLASS_LABEL_ONLY_RESULTS_READ_ME.md`.

> **PUBLIC DEPLOYMENT:** Read [PUBLIC_DEPLOYMENT_GUIDE.md](PUBLIC_DEPLOYMENT_GUIDE.md) before putting this application online. It needs paid persistent hosting, Git repository access, production secrets, actual end-to-end testing, and agricultural expert review. The Render Blueprint is not deployed automatically.

# KRUSHAK HITHAISHI — Indian Village AI Platform

**Real trained crop-classification model + self-service agricultural shop registration and discovery.**

A runnable **local full-stack prototype** built with Next.js, FastAPI, PostgreSQL, Leaflet/OpenStreetMap and two uploaded Keras model files. The homepage has an Indian village theme, with Kannada-first navigation and English/Hindi/Telugu options.

**Important limitations:** This is not a hosted public website, an independently field-validated crop diagnosis, an agriculture expert-verified treatment service, or a production-certified marketplace. The existing MobileNetV2 model's ~90% accuracy was **reported by the project team**, not independently verified in this package. No AI model can be assumed accurate in Indian farms without field testing.

## 1. Quick start on Windows (recommended)

1. **Install Docker Desktop** with WSL2 support. Open it until the Docker Engine is running.
2. **Unzip** this package and open its inner `krushak-hithaishi` folder.
3. **Double-click `START_WEBSITE.bat`.** The launcher fixes typical Docker Desktop PATH issues, checks the engine, and asks for a fresh administrator email, phone, and strong password on the first launch. It also creates secure random local secrets in `.env` (which must never be published).
4. After the containers start, open **http://localhost:3000** in a browser on the **same laptop**. The model check is **http://localhost:3000/api/model/status**.
5. To verify your setup, double-click **`VERIFY_WEBSITE.bat`**. To shut it down, double-click **`STOP_WEBSITE.bat`**.

On the first run, Docker downloads official images/dependencies and builds the AI service. It needs internet access, sufficient free space, and enough memory; 16 GB RAM is preferable. No success claim is made until local verification completes.

### Manual PowerShell start

Inside this extracted folder:

```powershell
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
docker --version
docker compose version
docker compose up --build -d

docker compose ps
```

**Before running manually**, create `.env` from `.env.example` and replace ALL placeholder values with strong secrets, or use the one-click launcher which does this for you. Keep `.env` private. If a previous `.env` password or secret appeared in a screenshot, rotate it. Do not use `docker compose down -v` unless you intentionally want to delete the database and uploads.

### Why this edition connects more reliably

- The frontend now uses a **production-style optimized Next.js build** instead of the older hot-reload development process.
- Requests such as `/api/model/status` are proxied by Next.js to the FastAPI backend **on the same website origin**; the browser no longer needs a separate `http://localhost:8000` connection.
- The backend container has a health check and the frontend waits for backend readiness.
- The database no longer binds host port 5432, reducing local port conflicts.
- The Compose project is named `krushak-hithaishi-v3`, so **older project database volumes are not silently reused**. Existing data remains in the old volume, and is not automatically migrated to the new installation.

## 2. Full farmer workflow

`Homepage → Farmer Corner → Select crop → Upload a clear leaf image → AI inference → Confidence & crop-mismatch warnings → General source-linked crop information → Nearby approved shops → Call / Directions`

- **Active model:** the supplied `plant_disease_model.keras`, a MobileNetV2-based 15-class model. The matching `class_names.json` is bundled and kept in the original order.
- **Input:** 224×224 RGB, pixel values 0–255. The model contains its own rescaling layer. Do not divide by 255 again.
- **Supported crops:** tomato (10 classes), potato (3 classes), bell pepper/capsicum (2 classes).
- **File rules:** JPEG/PNG/WEBP, maximum 5 MB; extreme sizes, tiny images, blank/uniform images, unsupported crops or damaged files are rejected or labelled as image-quality problems.
- **Model uncertainty:** The top output is a candidate class, **not a certain diagnosis**. Softmax scores are not calibrated probabilities of correctness. The model cannot reliably tell whether an image contains a leaf at all; examine images before use.
- **Guidance:** general, non-prescriptive notes linked to University of Minnesota Extension sources. Not locally reviewed or approved for Indian farming conditions. **Never** buy or apply pesticides solely from the model output.
- **History:** After a scan, the user may choose **Save scan on this device**. Scan labels and timestamps are stored only in the user's browser. Uploaded leaf images and GPS coordinates are **not** saved. Delete saved scans in Farmer Corner.
- **No fake features:** The app does not fabricate heatmaps, measured weather, chemical doses, verified product availability, or a field-validated severity score.

### Optional second tomato model

`backend/model_artifacts/tomato_disease_model.keras` and `tomato_class_names.json` are included. The 10 labels came from the **same EfficientNetB0 training notebook**, as confirmed by the project team. The tomato specialist is enabled as an **optional experimental choice** on `/detect`; MobileNetV2 remains the default because it checks for cross-crop mismatches. The tomato-only model assumes the farmer has selected the correct crop. Its 98.8% observed accuracy on a 1,000-image PlantVillage collection is **not independent field validation** and may involve original training overlap. Never treat either model as an agricultural diagnosis.

## 3. Shop owner workflow

`Register as owner → Enter shop details → Confirm exact map pin (GPS/search/drag) → Add products/photos/prices/stock → Submit shop → Admin verifies → Public directory`.

- Owners can manage **only their own shops and products**; the backend checks this on every write.
- Approved shop locations appear on the public map; unapproved shops do not.
- New or edited product details are **pending moderation** before being shown to farmers.
- Owners update stock immediately, but availability is always labelled **owner-reported**.
- Material shop profile changes (identity, location, contact, photo) send an approved shop back for verification.
- No sample shops are represented as real. The database starts empty.

## 4. Administrator workflow

`Sign in with admin phone + password from .env → Review pending shops → Verify identity/location outside the app → Approve/reject → Review pending product listings`.

Administrator review is **not government verification**, and it does not prove that a product is appropriate for a particular disease. Contact ownership SMS/OTP and license/document verification services are **not configured** and would be required before broad public deployment.

## 5. Test locations (same computer)

| Purpose | URL |
|---|---|
| Homepage | http://localhost:3000 |
| Crop scan | http://localhost:3000/detect |
| Farmer history | http://localhost:3000/farmer |
| Shop registration | http://localhost:3000/owner/shop/new |
| Owner dashboard | http://localhost:3000/owner/dashboard |
| Nearby shops | http://localhost:3000/shops |
| Administrator | http://localhost:3000/admin |
| App/API health | http://localhost:3000/api/health |
| Database readiness | http://localhost:3000/api/readiness |
| Main/specialist model status | http://localhost:3000/api/model/status |
| Raw FastAPI docs (optional) | http://localhost:8000/docs |

No public internet link has been created.

## 6. Troubleshooting

If you see **"This site can't be reached"**:

```powershell
# Inside this project folder with Docker Desktop running
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
docker compose ps
docker compose logs --tail 120 frontend
docker compose logs --tail 120 backend
```

1. Make sure the **front** container reports *Up* and the backend reports *healthy*.
2. Open `http://localhost:3000/api/health` in the browser. A successful response shows `{ "status": "ok" ... }`.
3. The initial frontend/AI Docker build may use significant disk space and network downloads.
4. If the DB fails authentication, use **this edition's new `.env`**. Changing `POSTGRES_PASSWORD` in `.env` does **not** update an already-initialized PostgreSQL user password. Do not delete volumes without confirming that you can discard the data.
5. If the main model is unavailable, inspect `docker compose logs --tail 120 backend` and `http://localhost:3000/api/model/status`. The 10-class specialist should report `ready` with the confirmed label file. If not, check backend logs.
6. If the app opens but the map is blank, check your internet connection; OpenStreetMap tiles and address geocoding require external connectivity.
7. If Docker is not recognized in VS Code, reopen VS Code after Docker Desktop installation or use the PowerShell `$env:Path` command above.

## 7. Tests and validation performed while preparing the package

- **8/8 backend tests passed** using an isolated SQLite test DB. Coverage includes authenticated registration, owner-only editing, shop approval, products and moderation, reopening verification for important edits, image-input errors, model unavailability without labels, and reference-linked advisories.
- The **real uploaded MobileNetV2 model** loaded with Keras and executed numerical inference on a synthetic image. **This is a functional test, not a disease accuracy assessment.**
- All TypeScript and TSX files passed an AST syntax parse. The Docker Compose YAML parsed successfully.
- **NOT verified here:** full Next.js production compilation (npm dependency installation unavailable in this environment), completed Docker image builds, a complete browser test on the user's Windows machine, Indian field-image accuracy or agronomic approval.

## 8. Before a public real-world launch

This package is meant for a functional final-year project demonstration and further engineering work, not unmonitored advice for farmers. A deployment should first implement HTTPS/domain hosting, verified identities/contact numbers, permissions and regulatory checks on agricultural inputs, appropriate rate limiting, cloud object storage and backups, accessible localization of all explanatory text, qualified Indian agronomy review, and actual field-dataset testing with class-wise metrics, calibration and out-of-distribution testing.

**Software architecture:** `frontend` (Next.js / React) → same-origin `/api` proxy → `backend` (FastAPI, SQLAlchemy, Keras) → `db` (PostgreSQL). The backend uses the two model files in `backend/model_artifacts/` and a distinct volume for shop photos. Maps use OpenStreetMap, while Google's public directions URL opens when the user explicitly requests directions.

## New in v5 — voice output and voice commands

English, Kannada, Hindi and Telugu spoken crop results and a microphone-controlled
assistant have been added. See **VOICE_FEATURES_READ_ME_FIRST.md** for Windows
startup, examples, language switching, limitations and privacy information.
=======
# krushak-hithaishi
AI-powered crop disease dection and suggest fertilizers with nearby shops 
>>>>>>> 3c3fe8f29788829795a9a14359b9203ff30ab9af
