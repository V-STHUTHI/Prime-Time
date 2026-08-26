# ⚡ Prime-Time: Circadian Rhythm & Sleep Optimizer

**Prime-Time** is a circadian rhythm planning application that dynamically maps your daily schedule, energy levels, and tasks based on your sleep duration and peak productivity times. 

It provides customized task advice, sleep-debt warnings, and power-nap injections to ensure you work during your biological peaks and rest during your troughs.

---

## 🔗 Live Deployed Links

You can access the live, running applications directly on your phone or desktop:

*   **💻 Deployed Website (Permanent)**: [https://v-sthuthi.github.io/Prime-Time/](https://v-sthuthi.github.io/Prime-Time/)
*   **📱 Native Mobile App Preview (Tunnel)**: [https://9957c0c34fb4db.lhr.life](https://9957c0c34fb4db.lhr.life)

---

## 📂 Repository Structure

This is a monorepo containing both the web and mobile implementations:

*   **[`/web`](./web)**: The HTML5 / Tailwind CSS / Javascript web application.
*   **[`/mobile`](./mobile)**: The React Native Expo mobile application.

---

## 🛠️ How to Run Locally

### 1. Web Version
Open the web app directly in your browser:
- Open [`web/index.html`](./web/index.html) (or press `Ctrl + O` in your browser and select the file).

To run a local web server:
```bash
cd web
npx serve -l 5000
```

### 2. Mobile Version (React Native & Expo)
To run the native app on your phone:
1. Make sure you have **Expo Go** installed on iOS or Android.
2. In your terminal, go to the mobile folder and install packages:
    ```bash
    cd mobile
    npm install
    ```
3. Start the bundler:
    ```bash
    npm run start
    ```
4. Scan the QR code with your phone camera to run the app natively.

To run it in your browser as a web simulator:
```bash
npx expo start --web
```
