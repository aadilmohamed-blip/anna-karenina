# Optional: the original fonts (Spectral + Inter)

The app ships using system fonts so it works offline with no downloads. If you
want the exact original typography, bundle the two Google Fonts locally — they
stay offline because the files live inside the app.

1. Download the font files (woff2) from https://fonts.google.com:
   - **Spectral** — weights 400, 500, 600, 700
   - **Inter** — weights 400, 500, 600
   Put the `.woff2` files in `public/fonts/`.

2. Create `src/fonts.css` with `@font-face` rules pointing at them, e.g.:

   ```css
   @font-face {
     font-family: "Spectral";
     src: url("/fonts/Spectral-Regular.woff2") format("woff2");
     font-weight: 400; font-display: swap;
   }
   /* …repeat for each weight and for Inter… */
   ```

3. Import it in `src/main.jsx`:

   ```js
   import "./fonts.css";
   ```

4. In `src/App.jsx`, change the font stacks back:
   - `Georgia,'Times New Roman',serif`  →  `'Spectral',Georgia,serif`
   - `system-ui,-apple-system,'Segoe UI',Roboto,sans-serif`  →  `'Inter',system-ui,sans-serif`

Rebuild (`npm run build`) and the fonts are baked in — still fully offline.
