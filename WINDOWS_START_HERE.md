# Krushak Hithaishi — start here on Windows

**Your uploaded MobileNetV2 `.keras` model and the matching 15 class labels are already included.** You do not need to upload them again.

## One-click start

1. Extract this entire ZIP. Do **not** open the project while it is still inside the ZIP file.
2. Open **Docker Desktop**. Check the bottom-left displays **Engine running**.
3. Open the extracted `krushak-hithaishi` folder and **double-click `START_WEBSITE.bat`**. Windows may ask you to allow the script. Only run a script you trust and downloaded from your own project.
4. On first run, enter your own administrator email, mobile number and a new administrator password (12+ characters). The script generates a strong random DB password and application key in a local `.env`; it **does not show your passwords**. Keep the `.env` file private.
5. The script checks Docker and starts the three containers. When ready, it opens **http://localhost:3000** automatically.

To stop the running containers later, double-click **`STOP_WEBSITE.bat`**. The database volume remains untouched.

## Important URLs

- Website: http://localhost:3000
- Leaf detection: http://localhost:3000/detect
- Model status: http://localhost:8000/api/model/status
- API docs: http://localhost:8000/docs

### Testing your AI model

1. Open the leaf detection page.
2. Choose **Tomato**, **Potato**, or **Bell pepper (capsicum)**.
3. Upload one photo of a leaf (JPEG/PNG/WEBP) and press Analyse.
4. The backend runs your **actual** Keras model. The score is not confirmed diagnostic accuracy.

The model does **not** support rice or generic chilli. Field validation is still required. Do not choose pesticides or dosages from an AI prediction alone.

## Troubleshooting

**`docker` not recognized**: The one-click launcher automatically adds Docker's location from this laptop's Docker Desktop installation path. If it cannot find Docker, verify Docker Desktop was installed for your account.

**Docker Engine not running**: Open Docker Desktop and check **Engine running**. Ubuntu WSL 2 has already been configured on your machine based on earlier screenshots.

**AI model not ready**: Run `docker compose logs --tail 80 backend` from the project folder in a terminal with Docker on PATH. Model loading uses the TensorFlow CPU runtime and requires available memory.

**Website cannot open**: Run `docker compose ps` and check whether port 3000 is already taken.

**Existing `.env`**: The launcher will never overwrite it. If your passwords or secret were visible in old screenshots, rotate them; if your PostgreSQL volume already exists, also rotate the password in the live database rather than only editing `.env`.

**No public website link yet**: `localhost` works only on your own PC. Publishing a public website requires deploying frontend, backend, database and model to hosting, configuring HTTPS and production security.


### New release: run VERIFY_WEBSITE.bat after starting
The site serves its API at `http://localhost:3000/api/health` and `http://localhost:3000/api/model/status` (same-origin proxy). The tomato EfficientNetB0 specialist is now available using the original ordered labels from its training notebook. Its status should show `ready`; select it explicitly for tomato only. The default MobileNetV2 still checks for crop mismatch. This new edition creates an isolated Compose project database to avoid silently reusing an older database volume.
