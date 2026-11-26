# Krushak Hithaishi v6 — four-language voice features + class-label-only crop analysis

This release is based on **v4 with BOTH trained AI models**. No trained weights,
class-order JSONs, inference endpoints, accounts or database schema were changed.

## What is new?

- **Automatic spoken analysis result** after scanning a leaf (enabled by default).
- **Listen to result** and **Stop audio** buttons on the detection page.
- Disease names and result safety messages are spoken in the currently selected
  **Kannada / English / Hindi / Telugu** (the same four languages as the website).
- A **Voice assistant** microphone button at the bottom right of every page.
- Change language by existing top-right selector, new voice panel selector, or by
  speaking a language command.
- Optional **Continuous listening (experimental)**: only when the user actively
  starts the microphone; it can stop automatically due to browser limitations.
- Voice commands to open home, farmer scanner, village shops, about, shop-owner
  dashboard; select tomato/potato/capsicum and an available model; request
  analysis; read result; stop speech; show
  shop maps, use location and search shop names/villages.
- Manual controls remain in place and work without voice support.

## Quick start on Windows

1. Extract the ZIP, open the **krushak-hithaishi** folder in VS Code.
2. If updating an existing installation, copy your private `.env` into this
   new folder. Do not post or share it.
3. Open Docker Desktop.
4. In the VS Code terminal, inside **krushak-hithaishi**, run:

   docker compose up --build -d

5. On your laptop visit http://localhost:3000/detect
6. In the top bar select **ಕನ್ನಡ / English / हिंदी / తెలుగు**.
7. Click **Voice assistant** (bottom right), then **Start voice commands**.
8. Allow microphone access. Speak a short command from the built-in Help list.
9. Upload/take a leaf photo by tapping the upload field, then click Analyse or
   say the language-appropriate command. The result will attempt to speak.
10. If it is silent, click **Listen to result**; verify the device has an
    installed voice for that language. The auto-read checkbox can be turned off.

## Supported example voice commands

| Task | English | Kannada | Hindi | Telugu |
|---|---|---|---|---|
| Open scanner | Open crop scanner | ಬೆಳೆ ಪರಿಶೀಲನೆ | फसल जाँच खोलो | పంట పరిశీలన తెరువు |
| Select tomato | Select tomato | ಟೊಮೇಟೊ ಆಯ್ಕೆಮಾಡಿ | टमाटर चुनो | టమాటా ఎంచుకో |
| Analyse photo | Analyse leaf | ಪರಿಶೀಲಿಸಿ | जाँच करो | పరిశీలించు |
| Read result | Read result | ಫಲಿತಾಂಶ ಹೇಳು | परिणाम सुनाओ | ఫలితం చెప్పు |
| Show shops | Find village shops | ಅಂಗಡಿಗಳು ತೋರಿಸು | दुकान दिखाओ | దుకాణాలు చూపించు |
| Switch to Kannada | Switch to Kannada | ಕನ್ನಡ ಭಾಷೆ | कन्नड़ भाषा | కన్నడ భాష |
| Stop microphone | Stop listening | ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸು | सुनना बंद करो | వినడం ఆపు |

There are more supported commands. Open voice assistant > Help for examples.

## Limitations — important for demonstrations and users

1. **It is not fully voice-only on every browser.** Web Speech recognition support
   differs between devices, and Google Chrome/Android often provide the best
   chance. Language recognition for Kannada/Telugu is not guaranteed.
2. **Photo/file selection requires touch or click** because browsers restrict
   opening the device's file picker without a direct user interaction. A voice
   "upload photo" command focuses the upload field and explains this.
3. **Microphone use is opt-in and permission-controlled.** On a phone, open the
   app over HTTPS for best browser mic support; `localhost` works for desktop
   development. Plain `http://192.168.x.x` on another device may block mic.
4. **Voice synthesis depends on available language voices.** Set language on
   device, install language packs/voices if needed, or use the text result.
5. **Recognition may use a browser cloud service.** Krushak Hithaishi's backend
   does not upload, process or store voice recordings; however, the browser
   itself may send microphone audio to its provider to transcribe it.
6. For account passwords, payments, sensitive actions, location permissions,
   and changes to shop/admin data, continue using the secure manual controls.
   There is **no promise of fully hands-free administrative operation**.
7. This does not improve model accuracy. Voice reads model suggestions and
   safety guidance, **not a confirmed agronomic diagnosis or prescription**.
   Growth stages are not estimated or collected by this scanner.
8. Automatic playback after a web request may be blocked by a browser's audio
   autoplay rules. The **Listen to result** button always remains available.

## Verify the update

- On `/detect`, upload a leaf and run either MobileNetV2 or tomato EfficientNetB0.
- Check that the result is read in the chosen language, then replay manually.
- Turn automatic result reading off and check that manual playback still works.
- Say a crop-selection, language, scan, shop and map command.
- Test all four languages with a real microphone and their installed voices.
- Test a denied microphone permission: the normal app must still work.
- Run `cd frontend` then `npm install` then `npm run test:voice` for the
  voice-command/safety-text smoke tests (does not test microphones).

### Technical implementation

`frontend/lib/voice.ts` — localized commands, disease names and speech text.
`frontend/components/VoiceAssistant.tsx` — microphone UI + recognition.
`frontend/app/detect/page.tsx` — result reading, voice selection + auto-read.
`frontend/app/shops/page.tsx` — voice-assisted shop search/map.
`frontend/app/layout.tsx`, `frontend/app/globals.css` — app-wide integration.

External references on browser constraints:
https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices

## Version 6 update
The growth-stage selector and corresponding voice commands have been removed. Class labels and reference issue groups are now shown next to each scan result. Growth stage, severity and fertilizer recommendations are *not assessed*. See `CLASS_LABEL_ONLY_RESULTS_READ_ME.md`.
