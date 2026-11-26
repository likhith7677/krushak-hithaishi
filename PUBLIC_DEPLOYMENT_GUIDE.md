# Krushak Hithaishi — public deployment readiness (Render)

## Current status (Nov 2026)

This is a **deployment-configured source package**, not a publicly deployed site. Its
existing eight backend tests passed in this workspace. A complete Docker-based
build, Next.js production build, and live browser smoke test have **not** been
performed in this environment. A successful publish needs a Git repository,
paid hosting, valid administrator credentials, and on-host verification.

## Why paid hosting is configured

Render's free PostgreSQL database expires after 30 days, and free web services
lose local file uploads on spin-down/redeploy. MobileNetV2 with TensorFlow needs
more memory than a typical free-tier service provides. The included `render.yaml`
therefore specifies a 2 GB API web service, 512 MB frontend web service, paid
PostgreSQL, and a 1 GB persistent disk for uploads. This **incurs charges**.
Review the current prices before approving the Render Blueprint; this package
does not deploy or charge anything by itself.

## Setup steps

1. Extract this archive; upload `krushak-hithaishi/` as a **private GitHub repo**.
   Do not upload a real `.env` file, passwords or private test data. The two `.keras`
   model weights are included; check that you have rights to upload them to GitHub
   and the hosting provider.
2. In Render, open **Blueprints → New Blueprint**, connect your GitHub repo, and
   select `render.yaml` from the repository root.
3. Check the proposed **paid resource costs** and review the plan before approval.
4. Set Render's requested values: `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters),
   and `ADMIN_PHONE`. The `SECRET_KEY` is generated automatically. The email should
   be yours; the phone must match the schema pattern (+ followed by 10-13 digits).
5. Deploy the Blueprint. Wait for **both web services and Postgres** to become healthy.
6. Open the Render frontend public URL ending in `.onrender.com`. Confirm
   `/`, `/detect`, `/shops`, `/login`, and `/api/readiness` all work. Verify
   `GET /api/model/status` reports the MobileNetV2 status as `ready`.
7. Create a test shop-owner account. Register a sample shop, add a photo/product,
   submit for review, approve using your admin account, search for it, and verify
   the image persists after a redeploy. Remove test data before going live.

## Runtime and privacy

The frontend proxies `/api/*` requests to the backend via an internal Render
hostname at runtime; no browser requests go to a localhost API. The backend
Postgres URL is normalized for psycopg3. Backend photo uploads live on the Render
persistent disk. User-session cookies are Secure, HttpOnly, SameSite=Lax.

**Do not claim agricultural diagnosis accuracy or approved treatment** based only
on clean PlantVillage images. The 90% figure is team-reported and not field-
validated. The EfficientNetB0 tomato specialist remains disabled until its
original class-label ordering is supplied. General advice is educational only.

## What still requires independent verification

- Actual Render build and runtime (not run from this environment)
- Mobile browser flows, local-language translations, input accessibility
- HTTPS session behavior and multi-user load/performance
- Field-image testing, confidence calibration, agronomist review
- Moderation processes, Indian privacy/consent requirements, backups, disaster recovery
- Email/SMS verification (not configured)
- Independent security review for public user data

## Local checks

Use Docker Desktop, set `.env` with strong credentials, then run:

```
docker compose up --build -d
docker compose ps
docker compose logs --tail=100
docker compose exec backend python -m pytest -q
```

To test endpoints locally use `http://localhost:3000/api/readiness` and
`http://localhost:3000/api/model/status`.

**Do not delete your existing application data volumes while troubleshooting.**
