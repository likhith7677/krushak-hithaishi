# Release audit — 2026-11-08

## Actual checks completed in the ChatGPT container

- Unpacked `Krushak_Hithaishi_Real_World_Local_Website_v3.zip`: 73 files.
- Existing FastAPI tests: **8 passed** on isolated SQLite test DB after deployment fixes.
- Backend Python source bytecode compile: **passed**.
- Frontend TypeScript/TSX **syntax parsing**: **27 files parsed without syntax errors**.
- Render `render.yaml` YAML syntax: **parsed**, services and datastore enumerated.
- MobileNetV2 Keras file and 15-item JSON labels: present.
- Tomato EfficientNetB0 file: present; original ordered labels: **absent**. Specialist remains disabled.

## Changes made in this audited edition

1. PostgreSQL URL conversion to explicit `postgresql+psycopg` (runtime and Alembic).
2. Next.js same-origin API and upload proxies use backend internal hostname at **runtime**.
3. `KH_PUBLIC_DEPLOYMENT=true` requires strong secret, admin setup and secure cookies.
4. Protected API/image responses with conservative security headers and size checks.
5. Production Render Blueprint: paid Postgres, memory-appropriate backend, persistent upload disk.
6. Basic public smoke test script and setup instructions.
7. Added simple per-instance limit for AI scans to reduce abuse.

## Checks NOT completed

- `npm install` / Next.js production build (dependency download timed out in this container).
- Docker build or live browser tests (Docker binary unavailable in this runtime).
- Actual PostgreSQL integration tests (no connected test Postgres here).
- Real TensorFlow inference in this container (TensorFlow runtime unavailable).
- Public Render deployment (Git repository missing; paid plan needs explicit cost approval).
- Full security audit, full localization or real-field classification validation.

**No zero-error guarantee.** This is a tested release candidate, not a certified
field-ready agricultural service. Do not publish sensitive real farmer/shop data
before verifying logs, privacy/consent, backups and moderation.
- Next.js runtime proxy tested with four isolated request simulations:
  GET forwarding, cross-origin mutation blocking, POST cookie forwarding, upload-path validation: **4 passed**.
- Database Alembic migration applied on a fresh SQLite database: **passed**.
- Original MobileNetV2 `.keras` archive inspected: 224 x 224 RGB input layer, 15-unit output Dense layer.
- Local Docker Compose frontend runtime proxy address now explicitly configured.
