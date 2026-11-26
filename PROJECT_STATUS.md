# Version 6 update

Class-label-only crop scan added; no trained model changes. Stage selector removed. Disease families mapped for 15 known labels, no fertilizer or treatment prescribed. Browser/Docker runtime requires deployment testing.

# Krushak Hithaishi — Current verification status (7 Nov 2026)

## Included and implemented
- Responsive village-inspired Next.js site; Kannada-first navigation plus English, Hindi and Telugu selections.
- Real MobileNetV2 Keras model file and **correct 15 ordered labels**; image-only tomato/potato/capsicum classification API.
- Additional EfficientNetB0 10-output tomato model **included but safely disabled for named predictions** (original training label order missing).
- Image quality rejection for obviously unsuitable small/near-blank photos; crop mismatch and low-confidence warnings; no unsupported crop diagnosis.
- Source-linked **general informational** crop notes (not locally expert-reviewed, no pesticides/dosages).
- Optional browser-only scan history with delete, no leaf-photo or GPS persistence.
- Owner registration/login; database-backed shop and products; map pin selection; stock toggles; admin verification and product moderation; public verified-shop search and call/directions.
- Production-style Next.js Dockerfile; same-origin proxy; DB/backend health checks; one-click Windows start and verification scripts.

## Checked here
- 8 backend API tests passed on isolated SQLite.
- Model loaded and ran numerical inference under Keras/Torch backend (functional execution test only).
- TypeScript/TSX source parsed successfully; Compose YAML parsed successfully.

## Not checked / not available
- **Could not complete full npm/Next.js production build or launch Docker containers in this environment**; run VERIFY_WEBSITE.bat on your laptop after building.
- No public website, SMS/OTP, paid geocoding/weather provider, live cloud data, expert-reviewed chemical recommendations, or field performance evidence.
- The team-reported ~90% accuracy is **not independently verified** or generalizable to field photography.
- User interface translations are most complete for core navigation and scan page; some detailed owner/admin and advisory texts remain English.
- Real-world use needs secure public deployment, model validation and expert review before farmers depend on the outputs.
