# Manual walkthrough for Phase-2 / project review

**Prerequisite:** Double-click `START_WEBSITE.bat`, then `VERIFY_WEBSITE.bat`; these checks must pass. Use real photos only with appropriate permissions and do not treat scans as verified diagnosis.

## A. Farmer crop scan
- Open `/detect` and confirm the main MobileNetV2 status is **ready** with 15 classes.
- Choose tomato / potato / capsicum, upload a clear real leaf photo, and inspect the result and confidence warning.
- Check that unsupported crops (such as rice) are unavailable, and that a tiny/uniform photo is rejected as unsuitable.
- Read general source-linked guidance; note that no pesticide dosage, fake severity score or fabricated weather is shown.
- Optionally save the scan to the browser and confirm it can be deleted under `/farmer`.
- On Tomato, explicitly choose EfficientNetB0 specialist and check the result (10 labels supplied from its training notebook). For Potato/Capsicum, MobileNetV2 stays active. The specialist assumes the crop is Tomato.

## B. Shop owner
- Open `/login`, register a shop-owner account (use unique mobile number and strong password).
- Register a shop with your real or permissioned demo details. Select a map pin deliberately; do not rely on the default map centre.
- Add product details, price, WEBP photo and stock state.
- Submit the shop and check that it is pending, not public.

## C. Administrator
- Sign out, then sign in with the administrator phone/password created by `START_WEBSITE.bat`.
- Open `/admin`, verify the shop location and identify the product; approve **only** permissioned and lawful test listings.
- Return to `/shops` and verify the shop is visible. Open the shop page; check product prices are shown as owner-reported, use the call link and Google Maps directions.
- As the owner, edit shop contact details. The shop should return to **pending** and disappear from public search until approved again.

## D. If anything fails
- Run `VERIFY_WEBSITE.bat` and copy **redacted** terminal logs from `docker compose logs --tail 100`.
- Do not send `.env`, passwords, tokens, administrator credentials, or actual farmer images without consent.
- No public live URL is included. The URLs in this package work on the same laptop where Docker Desktop is running.
