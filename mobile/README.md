# ChronoSchedule Mobile App (React Native)

This is the mobile-optimized version of **ChronoSchedule**, written in React Native using the Expo framework. It features touch-interactive SVG wheels, local persistent database syncing, animated sun-moon loaders, and sleep-debt alerts.

---

## 📱 How to Run on Your Mobile Phone

### Step 1: Install Expo Go
- **iPhone / iOS**: Download **Expo Go** from the Apple App Store.
- **Android**: Download **Expo Go** from the Google Play Store.

### Step 2: Install Node Dependencies
Open your terminal inside this project directory (`C:\Users\sthut\Downloads\tracker app mobile`) and run:
```bash
npm install
```

### Step 3: Start the Development Server
Run the following command to start the bundler:
```bash
npm run start
```

### Step 4: Scan and Launch!
- A **QR Code** will appear in your terminal.
- **Android**: Open the **Expo Go** app and tap **"Scan QR Code"**, then point it at the terminal.
- **iOS / iPhone**: Open your standard **Camera app**, point it at the QR code, and tap the browser link notification (which will open Expo Go).
- The app will build in a few seconds and run natively on your phone!

---

## 🛠️ Code Architecture

- **`App.js`**: Contains the complete React Native components, stylesheet configurations, orbital loaders, AsyncStorage adapters, and circadian mathematics.
- **`package.json`**: Expo SDK 51 and React Native dependencies.
- **`app.json`**: Configures the mobile bundle identifier, loading splash screen colors, and device layout defaults.
