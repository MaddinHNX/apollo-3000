# 🚀 Apollo 3000 – Smartes Haushalts-Management (2-Personen-Haushalt)

**Apollo 3000** ist eine Mobile-First Progressive Web App (PWA) für das reibungslose Haushalts-Management zu zweit. Sie kombiniert 1-Tap-Status-Updates für die Spülmaschine, eine visuelle 5-Stufen-Wäsche-Pipeline (für 6 Wäschesorten), einen Müllkalender mit 18:00-Uhr-Vorabend-Alarm sowie wiederkehrende Standard-Aufgaben mit automatischer **A/B-Rotation**.

---

## ✨ Features & Kernmodule

1. **Spülmaschinen-Quick-Toggle (`DishwasherQuickToggle.tsx`)**
   - 4 Zustände: `empty` (Leer) → `loading` (Wird eingeräumt) → `running` (Spült gerade) → `needs_unloading` (Fertig – Ausräumen!).
   - 1-Tap-Umschaltung inkl. Tracking, wer zuletzt aktiv war (`lastHandledBy`) und Zeitstempel.
2. **Wäsche-Tracker State Machine (`LaundryTracker.tsx`)**
   - 6 vordefinierte Sorten: `hell`, `dunkel`, `bunt`, `60_bettwaesche`, `60_unterwaesche`, `60_geschirrtuecher`.
   - 5 Stages: `idle` → `washing` → `hanging` → `folding` → `done`.
3. **Müll-Management & Vorabend-Banner (`WasteAlertBanner.tsx`)**
   - 5 Fraktionen: `pappe`, `gelber_sack`, `bio`, `restmuell`, `altglas`.
   - Automatischer Vorabend-Reminder (ab 18:00 Uhr + per 1-Tap im UI testbar).
4. **Standard-Aufgaben mit A/B-Rotation (`TodayChoresList.tsx`)**
   - Kernaufgaben: *Fenster putzen*, *Saugen & nass wischen*, *Klo reinigen*.
   - Erledigung per Tap oder Rechts-Swipe rotiert die Zuständigkeit automatisch zwischen Person A und Person B.

---

## 🛠️ Tech-Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (inkl. Mobile Safe-Area-Utilities `.pt-safe`, `.pb-safe` für iOS Notch & Home-Indicator)
- **Icons:** `lucide-react`
- **Backend / Realtime DB:** Firebase SDK v10+ (Firestore & Authentication vorbereitet in `src/config/firebase.ts`)
- **PWA:** `vite-plugin-pwa` (`display: standalone`, Portrait-Modus, Offline-ready)

---

## 📂 Projektstruktur

```text
src/
├── components/
│   ├── dashboard/
│   │   ├── DishwasherQuickToggle.tsx   # 1-Tap Spülmaschinen-Steuerung
│   │   ├── TodayChoresList.tsx         # Aufgabenliste mit Swipe & A/B-Rotation
│   │   └── WasteAlertBanner.tsx        # 18:00+ Vorabend-Warnbanner
│   ├── laundry/
│   │   └── LaundryTracker.tsx          # 6 Wäschesorten mit 5-Stufen-Pipeline
│   └── layout/
│       └── BottomNav.tsx               # Feste mobile Bottom-Navigation (4 Tabs)
├── config/
│   └── firebase.ts                     # Firebase v10+ Initialisierung & Env-Check
├── data/
│   └── mockData.ts                     # Sofort nutzbare Mock-Daten für 2 Personen
├── types/
│   └── household.ts                    # Strikte TypeScript-Interfaces & Typen
├── App.tsx                             # Mobile-First Cockpit (390px-430px Viewport)
├── index.css                           # Tailwind CSS + Safe-Area-Insets
└── main.tsx                            # React Entrypoint
```

---

## 🚀 Lokaler Start (Sofort-Demo mit Mock-Daten)

Die App startet standardmäßig im **Mock-Modus** (inkl. `localStorage`-Persistenz) und kann sofort ohne Firebase-Account im mobilen Browser-Viewport (z. B. 390×844 px) getestet werden:

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten
npm run dev

# 3. Produktions-Build & PWA-Bundle testen
npm run build
npm run preview
```

---

## 🔥 Firebase Setup (Optional für Echtzeit-Sync zwischen 2 Smartphones)

1. Erstelle ein neues Projekt in der [Firebase Console](https://console.firebase.google.com/).
2. Aktiviere **Cloud Firestore** und **Authentication** (z. B. Google Sign-In oder E-Mail/Passwort).
3. Kopiere `.env.example` zu `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Trage deine Firebase-Credentials in `.env.local` ein:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
5. Sobald gültige Werte hinterlegt sind, wechselt das Badge im Header automatisch von `Mock-Modus` auf `Firebase Live`.
