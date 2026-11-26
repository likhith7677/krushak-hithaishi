# Add your trained model to Krushak Hithaishi — already completed

This edition **already contains your uploaded 15-class Keras model** and its matching class-name list. You do not need to copy those uploads again.

## Where they are

```text
backend/model_artifacts/plant_disease_model.keras
backend/model_artifacts/class_names.json
backend/app/inference.py
frontend/app/detect/page.tsx
```

## Start on Windows

1. Extract `krushak-hithaishi-ai-integrated.zip`.
2. You can open its extracted `krushak-hithaishi` folder in VS Code, or copy the updated project code into your existing Krushak Hithaishi folder. **Keep your own existing `.env` file private and do not overwrite it.**
3. Open Docker Desktop; ensure **Engine running**.
4. VS Code > Terminal > New Terminal; run these commands in the project folder:

```powershell
# Use this only if VS Code still says "docker is not recognized":
$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"

docker --version
docker compose up --build
```

5. Test `http://localhost:8000/api/model/status` — should display `"status":"ready"` and `"classes":15`.
6. Open `http://localhost:3000/detect`, select **Tomato**, **Potato**, or **Capsicum (bell pepper)**, and upload a leaf image.

The first Docker build downloads a TensorFlow CPU runtime. You need an internet connection and disk space.

## Your model is limited to

- Tomato: 10 classes
- Potato: 3 classes
- Bell pepper/capsicum: 2 classes

**It cannot diagnose generic chilli, rice or other plants.** It is image-only; weather and crop growth stage are not used. The returned percentage is a softmax model score, not verified prediction accuracy. Do not use it as the sole basis for pesticides or other chemical treatment.

## Common problems

- **`docker not recognized`**: run the PATH command above in the same VS Code terminal or reopen VS Code after adding Docker to your User PATH.
- **`model_unavailable`**: check `docker compose logs backend` for detailed model load errors.
- **`Can't reach server`**: confirm `http://localhost:8000/api/health` is reachable and that the backend container is running.
- **`port is already allocated`**: stop the other process or conflicting container using the same port.
- **Old website still showing**: ensure you extracted the **new AI-integrated ZIP** and ran `docker compose up --build` from that updated folder.

If `.env` secrets or passwords were visible in screenshots, change them. If the PostgreSQL volume was already initialized, simply changing `POSTGRES_PASSWORD` in `.env` will not rotate the live DB user password.
