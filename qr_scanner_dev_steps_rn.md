# QR & Barcode Scanner — React Native Step-by-Step Development Instructions

> Read this alongside `qr_scanner_architecture_rn.md` in the same project folder. Follow stages in order — do not skip ahead. Each stage lists exact deliverables and a "Definition of Done" so progress can be verified before moving on.

---

## Stage 0 — Project Setup
**Tasks:**
1. Verify Node.js (LTS) and optionally install EAS CLI: `npm install -g eas-cli` (if using cloud builds).
2. Create the project: `npx create-expo-app qr_scanner_app --template` (choose the TypeScript blank template).
3. Install core and native dependencies in one go so all native modules are bundled into the initial Dev Client build:
   `npx expo install expo-camera expo-sqlite expo-sharing expo-media-library expo-clipboard expo-splash-screen @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-svg react-native-qrcode-svg react-native-view-shot @react-native-async-storage/async-storage zustand react-native-google-mobile-ads`
4. Add the AdMob config plugin to `app.json` under `expo.plugins`, with Google's test App ID (`ca-app-pub-3940256099942544~3347511713`).
5. Set up the folder structure exactly as defined in `qr_scanner_architecture_rn.md` Section 4 (including `features/home/HomeScreen.tsx`).
6. Build and launch the Dev Client:
   - **Local option (fastest with connected device/emulator):** `npx expo run:android`
   - **Cloud option (EAS Build):** `eas build:configure` followed by `eas build --profile development --platform android`
7. Once the Dev Client installs on your test device, run `npx expo start --dev-client` and confirm the home screen loads.

**Definition of Done:** Dev Client build installs on a real device or emulator and the app launches without crashing, with all native modules (camera, ads, sqlite, svg, view-shot) compiled in.

---

## Stage 1 — Core Scanning
**Tasks:**
1. Build `core/scan/scannerService.ts`: a thin wrapper exposing a callback type for scan results (keeps `expo-camera` specifics out of the UI layer).
2. Build `core/scan/resultParser.ts`: takes a raw scanned string and classifies it into one of: `url`, `wifi`, `vcard`, `upi`, `plainText`. Use regex/prefix checks (`WIFI:`, `BEGIN:VCARD`, `upi://pay`, `http`/`https`).
3. Build `features/scanner/ScannerScreen.tsx`: full-screen `CameraView` from `expo-camera` with `barcodeScannerSettings` enabled, `onBarcodeScanned` handler, and a torch toggle button (`enableTorch` prop).
4. Build `features/scanner/useScannerStore.ts`: zustand store holding scanning state (active/paused) so the camera stops scanning after the first valid hit until the user returns.
5. Handle camera permission using `expo-camera`'s `useCameraPermissions()` hook, with a one-time explainer dialog shown before the OS prompt.

**Definition of Done:** Scanning a real QR code (any type) with the camera correctly navigates forward with the raw string decoded and classified.

---

## Stage 2 — Result Screen
**Tasks:**
1. Build `features/result/ScanResultScreen.tsx`: displays the decoded content with type-specific UI:
   - `url` → "Open Link" button (use `Linking.openURL`)
   - `wifi` → "Connect to WiFi" (parse SSID/password, show them; Android WiFi deep-link support varies by OS version, so show manual copy instructions as a fallback)
   - `vcard` → "Save Contact" (parse fields; use `expo-contacts` if you want direct save, or show details for manual entry to avoid adding another native dependency)
   - `upi` → "Open in Payment App" (`Linking.openURL` on the UPI intent string)
   - `plainText` → "Copy" button (`expo-clipboard`)
2. On screen load, save the result (type + raw string + timestamp) via `core/storage/historyRepository.ts`.
3. Add "Share" button using `expo-sharing`.

**Definition of Done:** Every one of the 5 result types displays correctly with working contextual actions, and each scan appears in the SQLite database afterward.

---

## Stage 3 — QR Generation
**Tasks:**
1. Build `shared/utils/wifiQrBuilder.ts`, `vcardBuilder.ts`, `upiQrBuilder.ts` — each takes structured input (e.g. SSID + password) and returns the correctly formatted string per that format's spec.
2. Build `features/generator/GeneratorScreen.tsx` with a tab UI (use `@react-navigation`'s material top tabs, or a simple custom segmented control to avoid an extra dependency): Text / URL / WiFi / Contact / UPI, each tab showing the relevant input form.
3. Build `features/generator/useGeneratorStore.ts`: on "Generate," builds the string via the correct builder, passes it to `react-native-qrcode-svg`'s `<QRCode value={...} />`.
4. Add "Save to Gallery" (`expo-media-library`, requires converting the SVG to a bitmap first — use `react-native-view-shot` to capture the QR view as an image) and "Share" buttons.
5. Save each generation to `historyRepository.ts` as well.

**Definition of Done:** All 5 generator tabs produce a scannable QR code (verify by scanning it back with the app's own scanner) and can be saved/shared.

---

## Stage 4 — History & Settings
**Tasks:**
1. Build `core/storage/historyRepository.ts`: `expo-sqlite` table with columns `id, type, rawContent, isScanOrGenerate, timestamp`. CRUD methods: insert, getAll (sorted newest first), delete, search by type/content.
2. Build `features/history/HistoryScreen.tsx`: `FlatList` with icons per type, tap to reopen the result screen, swipe-to-delete (use `react-native-gesture-handler`'s `Swipeable`, already included via `react-navigation`'s dependencies).
3. Build `features/settings/SettingsScreen.tsx`: theme toggle (light/dark, stored via `AsyncStorage`), "Rate App" link, "Privacy Policy" link (open via `Linking` or an in-app WebView), "About" section.

**Definition of Done:** History persists across app restarts, deleting works, and settings toggle is remembered on relaunch.

---

## Stage 5 — Ads Integration
**Tasks:**
1. Build `core/ads/adUnitIds.ts` with **Google's published test ad unit IDs only** during development — never use real IDs until store submission.
2. Build `core/ads/adManager.ts`: functions `loadBanner()`, `showInterstitial()` (with a frequency cap: no repeat within 60 seconds, track last-shown timestamp), `loadRewarded()` + `showRewarded(onReward)`, using `react-native-google-mobile-ads`'s hooks (`useInterstitialAd`, `useRewardedAd`) or imperative API.
3. Add a `<BannerAd>` component to Home and History screens.
4. Call `showInterstitial()` after scan result renders (Stage 2) and after QR generation completes (Stage 3).
5. Add a rewarded ad flow gating one v2-style bonus feature (e.g., QR styling) — implement the trigger point now even if the feature itself comes later.

**Definition of Done:** All 3 ad types load and display correctly using test IDs, with no crash when ads fail to load (e.g., airplane mode). Requires a fresh Dev Client rebuild since ad SDK native code changed.

---

## Stage 6 — Polish & Edge Cases
**Tasks:**
1. Add empty states: no history yet, camera permission denied (show a clear "Open Settings" button via `Linking.openSettings()`), no internet (ads simply don't show, core features still work).
2. Add error handling: malformed/corrupted QR data, camera initialization failure on older devices.
3. Add app icon, splash screen (`expo-splash-screen`), and consistent theming per `theme/theme.ts`.
4. Test on at least one low-end device (2GB RAM) to confirm camera performance and app responsiveness — RN's JS bridge can lag more than Flutter on weak hardware, so this check matters more here.

**Definition of Done:** App handles all edge cases above without crashing, and feels responsive on a low-end device.

---

## Stage 7 — Pre-Launch QA
**Tasks:**
1. Full regression pass: scan each QR type, generate each QR type, verify history, verify settings persist, verify ads (using test IDs).
2. Replace all test ad unit IDs with real AdMob IDs in `app.json` and `adUnitIds.ts` (only after AdMob account + app are approved), then rebuild the Dev Client / production build.
3. Verify `app.json`'s Android permissions are minimal (only camera + internet, nothing extra pulled in by a dependency).
4. Run a production build: `eas build --profile production --platform android`, and test the resulting APK/AAB on a real device — not just the Dev Client.

**Definition of Done:** Production build installs and runs correctly on a real device with real ad IDs, no dev menu or test data visible.

---

## Stage 8 — Play Store Submission
**Tasks:**
1. Create Google Play Developer account if not already done.
2. Host a Privacy Policy page (declares camera use, and any ad SDK data collection per AdMob's own disclosures).
3. Prepare store listing: icon (512×512), feature graphic (1024×500), 4–8 screenshots showing scan + generate flows.
4. Fill out Data Safety form in Play Console accurately.
5. Complete the required closed testing track (verify current Play Console requirement before submitting — this has changed in recent policy updates).
6. Submit via `eas submit` or manual upload of the AAB, then submit for review.

**Definition of Done:** App is live on the Play Store (or in the required testing track) with real ads serving.

---

## Notes for the AI coding agent
- Follow stages strictly in order — later stages depend on services built in earlier ones.
- Do not hardcode real AdMob IDs until Stage 7 — use Google's published test ad unit IDs throughout development.
- Any stage that adds or changes a native dependency (ads, media library, view-shot) requires a fresh Dev Client rebuild via `eas build --profile development` before it will work — a plain `expo start` reload is not enough for native changes.
- Keep all business logic (parsing, string-building, ad frequency capping) out of screen components — put it in `core/` per the architecture doc, so it stays testable with plain Jest.
- If a package listed here is deprecated or has a breaking change at build time, prefer its actively maintained equivalent, but keep the same folder/responsibility structure.
- Firebase/Crashlytics is intentionally left out of this plan. Add it only after your first Play Store release, once there's real usage data worth monitoring — it is not required to ship v1.
