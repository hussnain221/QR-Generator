# QR & Barcode Scanner — React Native Architecture Document

> Uses **Expo with a Dev Client (EAS Build)** rather than plain "managed" Expo. Reason: `react-native-google-mobile-ads` requires native code, which plain managed Expo (Expo Go) can't run. A Dev Client gives you Expo's easy tooling while still supporting native modules.

## 1. Product Summary
An offline, ad-supported React Native app that scans QR codes/barcodes via camera and generates QR codes (text, URL, WiFi, contact/vCard, UPI/payment). No login, no backend, no server costs.

**Target user:** anyone sharing WiFi, paying via UPI QR, scanning product barcodes, or sharing contact info quickly.

---

## 2. Core Features (MVP)
1. Scan QR/barcode via camera (auto-detect, torch toggle)
2. Generate QR: plain text, URL, WiFi, contact (vCard), UPI/payment string
3. Scan history (saved locally, searchable)
4. Copy/share/open scanned result (auto-detect URL vs text vs WiFi vs contact)
5. Save generated QR as image / share it

**v2 (later, based on usage data):**
- Batch scan mode
- Custom QR styling (colors/logo in center) — good rewarded-ad gate
- Export history to CSV
- Dark mode

---

## 3. Tech Stack

| Layer | Package | Purpose |
|---|---|---|
| Framework | React Native via Expo (Dev Client + EAS Build) | Native module support with Expo's easier tooling |
| Scanning | `expo-camera` (built-in barcode scanning via `CameraView`) | Camera preview + QR/barcode detection, torch control included |
| QR generation | `react-native-qrcode-svg` + `react-native-svg` | Renders QR from string data |
| Permissions | `expo-camera`'s built-in `requestCameraPermissionsAsync` | No separate permissions package needed |
| Local storage | `expo-sqlite` | Scan/generate history, persisted and searchable |
| Settings storage | `@react-native-async-storage/async-storage` | Theme, simple flags |
| Share/export | `expo-sharing` | Share scanned text or generated QR image |
| Save image | `expo-media-library` + `react-native-view-shot` | Capture view and save generated QR to device gallery |
| Clipboard | `expo-clipboard` | Copy plain text / links to clipboard |
| Gestures | `react-native-gesture-handler` | Swipe-to-delete in history |
| Ads | `react-native-google-mobile-ads` | Banner, interstitial, rewarded |
| Navigation | `@react-navigation/native` + native-stack | Screen routing |
| State management | `zustand` | Simple global state, less boilerplate than Redux for this app's size |
| Crash/analytics (optional, add later) | Sentry (free tier) or skip for v1 | Not required to ship — add after first release once you have real users to monitor |

No backend. Everything is on-device.

---

## 4. Folder Structure

```
src/
  App.tsx
  navigation/
    RootNavigator.tsx
  theme/
    theme.ts
  core/
    ads/
      adManager.ts
      adUnitIds.ts
    scan/
      scannerService.ts        // wraps expo-camera scanning callback
      resultParser.ts          // detects: URL, WiFi, vCard, UPI, plain text
    generate/
      qrGeneratorService.ts    // builds WiFi/vCard/UPI strings for rendering
    storage/
      historyRepository.ts     // expo-sqlite CRUD for scan/generate history
      prefsRepository.ts       // AsyncStorage wrapper
  features/
    home/
      HomeScreen.tsx           // primary actions (Scan, Generate), recent history preview, banner
    scanner/
      ScannerScreen.tsx
      useScannerStore.ts       // zustand store for this screen's state
    generator/
      GeneratorScreen.tsx      // tabs: Text, URL, WiFi, Contact, UPI
      useGeneratorStore.ts
    result/
      ScanResultScreen.tsx     // shows parsed result + copy/share/open actions
    history/
      HistoryScreen.tsx
    settings/
      SettingsScreen.tsx
  shared/
    components/
      ResultTypeIcon.tsx
      HistoryTile.tsx
    utils/
      wifiQrBuilder.ts
      vcardBuilder.ts
      upiQrBuilder.ts
```

**Pattern:** each feature = screen + its own zustand store (or local `useState` if simple enough). Business logic (parsing, string-building) lives in `core/`, kept UI-independent and unit-testable with plain Jest.

---

## 5. Screen Flow

1. **Home** — two big buttons: Scan / Generate. Recent history preview below. Banner ad pinned at bottom.
2. **Scanner screen** — live camera view via `expo-camera`'s `CameraView` with `onBarcodeScanned` callback, torch toggle button. On detection → navigates to Result screen.
3. **Result screen** — shows decoded content, auto-detected type (URL/WiFi/contact/plain text/UPI), with contextual actions (Open link, Connect to WiFi, Save contact, Copy text). Saved to history automatically. **Interstitial ad shown here after result renders.**
4. **Generator screen** — tabbed: Text / URL / WiFi / Contact / UPI. User fills form → "Generate" → shows QR image → Save/Share. **Interstitial ad after generation.**
5. **History** — list of past scans/generations, tap to reopen result, swipe to delete. Banner ad on this screen.
6. **Settings** — theme, privacy policy link (required for Play Store — camera permission), about, rate app.

---

## 6. Data Flow
`ScannerScreen` → `expo-camera`'s scan callback fires with raw string → `resultParser.ts` classifies type → screen calls `historyRepository.insert()` → navigates to `ScanResultScreen` with the parsed object as a route param → `adManager.showInterstitial()`.

`GeneratorScreen` → user input → the matching builder (`wifiQrBuilder`/`vcardBuilder`/`upiQrBuilder`) constructs the standard-format string → `react-native-qrcode-svg` renders it → `historyRepository.insert()` → `adManager.showInterstitial()`.

---

## 7. Ad Placement Plan

| Ad type | Location | Trigger |
|---|---|---|
| Banner | Home, History screens | Always visible |
| Interstitial | After scan result renders, after QR generated | Max once per action, frequency-capped (no 2 within 60s — track last-shown timestamp in `adManager.ts`) |
| Rewarded | Unlock: QR styling/logo, CSV export of history | Opt-in, highest eCPM |

---

## 8. Permissions & Privacy
- Camera permission: request only when user taps "Scan," with a one-time in-app explainer shown *before* the OS prompt (`expo-camera` gives you the permission-denied state to build this around).
- Privacy Policy required for Play Store submission (camera usage) — host as a static page.
- If you skip crash/analytics tooling for v1 (recommended), there is no third-party data collection to disclose beyond ad SDK data, which AdMob already documents for the Play Console Data Safety form.

---

## 9. Non-Functional Requirements
- Cold start under 2.5 seconds on a mid-range device (RN has a slightly heavier JS-bridge startup than Flutter — keep the initial bundle lean, avoid loading ad SDKs before the home screen renders)
- Scanner must detect codes within ~1 second of the code being in frame
- App must work fully offline; only ad loading should fail gracefully without blocking core features
- APK size target: under 30MB (RN apps typically run a bit larger than Flutter equivalents)

---

## 10. Known React Native Build Gotchas (read before Stage 0)
- Because ads require native code, you cannot use Expo Go for testing — you must build a Dev Client (`eas build --profile development`) once at the start, then iterate normally with `expo start --dev-client`.
- `react-native-google-mobile-ads` needs a config plugin entry in `app.json`/`app.config.js` — this must be added before your first Dev Client build, not after.
- Keep Expo SDK, React Native, and all native-module package versions aligned to what the current Expo SDK release supports — mismatched versions are the most common cause of native build failures in RN/Expo projects.
