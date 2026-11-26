# Krushak Hithaishi V7 — conversational farmer voice assistant

This edition upgrades V6 without changing either trained crop model or the PostgreSQL schema.

## What works without paying for speech or AI

- Simple conversational Q&A in **Kannada, Telugu, Hindi and English** about: previous leaf scan, yellowing leaves, spots, curling, disease basics, watering, fertilizer vs treatment, pest inspection, disease prevention, shops, and scanning instructions.
- Answers displayed in a chat-style panel and spoken aloud when the device/browser has a suitable voice.
- Everyday, colloquial phrases rather than only precise commands. Browser speech recognition can still misunderstand dialects or fail on some devices.
- Improved browser recognition: five candidate transcriptions are considered, and known useful alternatives are preferred.
- Auto-read the crop result after a scan; ask about the *latest actual scan* from the same open session, or tap “Read result.”
- Manual language switching, device-voice selector, speaking-speed adjustment and test-voice button.
- Typed questions for use when speech recognition is unreliable. All existing crop-disease models, shop pages, login and maps remain available.
- The assistant never fabricates a diagnosis or determines growth stage from a disease label.

## Optional cloud speech and advanced farmer questions

Free browser-only recognition and speech cannot guarantee lifelike Kannada/Telugu voices. **If you want clearer Indian-language speech, add your own Azure Speech resource**. It incurs provider usage charges subject to its plan.

Azure Speech, when configured, provides:
- Cloud recognition for `kn-IN` (Kannada), `te-IN` (Telugu), `hi-IN` (Hindi), `en-IN` (Indian English)
- Telugu neural voice options: `te-IN-ShrutiNeural` or `te-IN-MohanNeural`
- Kannada neural voice options: `kn-IN-SapnaNeural` or `kn-IN-GaganNeural`
- Tap microphone to start, speak naturally, tap again to finish and send for recognition; the app reads its response aloud

Optional OpenAI API key enables answers to open-ended farmer questions beyond the built-in FAQ. It is **not** required for the basic assistant, and it may incur API usage charges. Open-ended replies are AI generated, not checked by an agricultural expert.

To activate paid providers, add these OPTIONAL variables to the EXISTING private `.env` in the project folder (do not share your real keys):

```dotenv
AZURE_SPEECH_KEY=YOUR_AZURE_SPEECH_RESOURCE_KEY
AZURE_SPEECH_REGION=centralindia
OPENAI_API_KEY=YOUR_OPTIONAL_OPENAI_KEY
KH_CHAT_MODEL=gpt-5-mini
```

You may add just Azure, just OpenAI, both or neither. Keep the old `POSTGRES_PASSWORD`, `SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE` exactly unchanged. Never paste credentials into the browser or send them in chat. Start/recreate backend after changing `.env`:

```powershell
docker compose up -d --force-recreate backend frontend
```

On the website, open the floating **Voice assistant** → Settings (sliders icon) → *Natural cloud voice* → choose a female or male voice → *Test voice*. This choice is available only if the backend has a valid-looking Azure configuration. A key still needs to be active with the right region; the app cannot verify that without making a paid provider call.

For cloud recognition, tap microphone, speak for a few seconds, then tap again to stop. It cannot remain always listening via that mode. For the browser option, “Continuous listening (experimental)” is available but **not** a reliable Alexa-style wake word and needs microphone permission.

## Safely upgrade from your currently working V6

1. Keep Docker Desktop running; do NOT delete its named volumes.
2. Extract the V7 ZIP into a **new folder**. Do not overwrite your running project's files.
3. Copy your existing private `.env` file from your working folder, e.g. `C:\Users\likhi\Downloads\krushak-hithaishi_2\.env`, to the extracted **V7 `krushak-hithaishi` project root**. Enable “Hidden items” in Windows Explorer if `.env` does not appear.
4. Open that V7 `krushak-hithaishi` root in VS Code, open a PowerShell terminal, then run:

```powershell
docker compose up --build -d
docker compose ps
```

5. Open `http://localhost:3000/detect`, use the Voice assistant button, select Kannada or Telugu and test a question. Try the typed question entry first; then microphone.

**Important:** Both V6 and V7 deliberately use the same Docker Compose project name (`krushak-hithaishi-v3`) so the existing PostgreSQL volume can be reused. Do not run `docker compose down -v`. If you need to roll back, open the old V6 folder and run `docker compose up --build -d` from there.

## Questions to try

| Kannada | Telugu | English |
|---|---|---|
| ನಮಸ್ಕಾರ | నమస్కారం | Hello Krushak |
| ನನ್ನ ಎಲೆ ಹಳದಿ ಆಗಿದೆ | టమాటా ఆకులు పసుపు అవుతున్నాయి | Why are my leaves yellow? |
| ಯಾವ ಗೊಬ್ಬರ ಹಾಕಬೇಕು | నాకు ఏ ఎరువు వేయాలి | What fertilizer should I use? |
| ಯಾವ ಔಷಧಿ ಹಾಕಲಿ | ఏ మందు వేయాలి | How can I treat this? |
| ನನ್ನ ಫಲಿತಾಂಶ ಏನು | నా ఫలితం ఏంటి | What disease did you find? |
| ಲೇಟ್ ಬ್ಲೈಟ್ ಅಂದ್ರೇನು | లేట్ బ్లైట్ అంటే ఏమిటి | What is late blight? |

To navigate, say a command such as `ಬೆಳೆ ಪರಿಶೀಲನೆ`, `పంట పరిశీలన తెరువు`, `Switch to Kannada`, `Select tomato`, `Find village shops`. Crop name and model selection shortcuts continue to work.

## Limitations and safety

- Siri/Alexa-level always-on recognition, wake words, arbitrary computer control and guaranteed native dialect understanding are **NOT** implemented. Browsers require microphone permissions and commonly require tapping to upload leaf photos. On Android, Chrome generally provides the best chance of Web Speech support, but your exact device still needs testing.
- Browser speech recognition may send audio to the browser vendor. In optional cloud mode, voice clips go to Azure for recognition, generated reply text to Azure for speech; if OpenAI Q&A is enabled, question text and a short recent conversation plus the last unverified predicted label go to that provider. The app itself does not persist voice recordings.
- Avoid spraying chemicals based solely on an AI label. Fertilizers do not cure infections. No fertilizer or pesticide product, quantity or application timing is prescribed in this release.
- Actual crop classification accuracy in fields remains unverified due to the PlantVillage training/evaluation overlap issue.
- Live browser microphone, paid STT/TTS and paid open-ended Q&A were **not** tested without provider keys. Validate them on your device.

## Debugging

- Browser mic fails? Use HTTPS or `localhost`, verify microphone permission, and try Chrome. You can always type your question.
- Wrong language? Select Kannada or Telugu in the dropdown before you speak. Browser recognition typically handles only one locale at a time.
- Voice sounds unnatural? Settings → *Installed voice*. If no suitable voice is available, add Kannada/Telugu speech voices on your phone/OS or use the optional Azure voices.
- Cloud voice fails? Verify Azure Speech key, region and resource usage/billing. The app falls back to browser speech when cloud TTS fails.
- Backend not healthy? Run `docker compose logs --tail=60 backend`; don't delete database volumes.

**Code/verification:** Built-in Q&A test `cd frontend; npm run test:farmer`; original voice regression `npm run test:voice`; backend tests `cd backend; python -m pytest -q`.
