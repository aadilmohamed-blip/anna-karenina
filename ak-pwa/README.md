# Anna Karenina — Reading Companion (offline PWA)

A spoiler-safe companion for reading *Anna Karenina* (Maude translation):
a railway-map relationship web, a parallel timeline, places, motifs, a name
decoder, excerpts, and a glossary. Everything is gated to the Part + Chapter
you've reached, so nothing ahead of your bookmark is shown.

This is a **Progressive Web App**. After the first load it runs fully offline
and installs to your phone's home screen — no app store, no APK.

---

## Run it on your computer first (one time)

You need **Node.js 18+** installed (https://nodejs.org).

```bash
npm install        # downloads dependencies (needs internet, one time)
npm run dev        # starts a local server, prints a URL like http://localhost:5173
```

Open that URL in a browser and the app runs.

## Put it on your Android phone (offline)

The simplest path — serve the production build and install it from Chrome:

```bash
npm run build      # creates the optimized app in dist/
npm run preview    # serves it; prints a Network URL like http://192.168.1.X:4173
```

1. Make sure your **phone and computer are on the same Wi-Fi**.
2. On your phone, open Chrome and go to the **Network URL** that `npm run preview` printed.
3. Let the page load fully once (this caches it for offline use).
4. Chrome menu (⋮) → **Add to Home screen** / **Install app**.
5. Done. Launch it from the home-screen icon — it now works with **Wi-Fi off**.

> The app caches itself on first load, so after step 3 you can turn off Wi-Fi
> and it keeps working. The home-screen icon opens it full-screen, like a
> native app.

If you'd rather host it permanently, the `dist/` folder is plain static files —
drop it on any static host (Netlify, GitHub Pages, your own server) and install
from that URL the same way.

---

## Fonts

To stay 100% offline with zero downloads, the app uses your device's built-in
serif (for the display type) and system sans (for body). If you want the exact
original look with **Spectral** + **Inter**, see `FONTS.md`.

## Project layout

```
index.html             app entry
src/main.jsx           mounts React
src/App.jsx            the whole app (UI + data in one file)
vite.config.js         PWA / offline config
public/icons/          home-screen icons
```
