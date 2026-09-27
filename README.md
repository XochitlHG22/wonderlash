# Wonder Lash Rain · launch-day setup

Three pieces:
- **index.html**: the landing page the NFC sticker opens. Guests write their first name, get a personal welcome, and find the quiz button there. A second tap skips straight to the welcome.
- **finale.html**: the big screen. Names fall as bottles, brushes and swatches. Press **T** for the Thank-you finale, **L** for live arrivals, **F** for full screen.
- **Firebase** (free): the live database that connects phones to the screen.

## 1. Try it right now (demo mode, 2 minutes)
Leave `config.js` as it is. Open `finale.html` and `index.html` in two tabs of the same browser, add a name in one tab and watch it fall in the other. (Demo mode only works inside one browser.)

## 2. Make it live (about 20 minutes, free)
1. Go to console.firebase.google.com → **Add project** (Analytics off).
2. **Build → Firestore Database → Create database** (production mode, region europe-west).
3. Firestore → **Rules**, paste this and **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /events/{event}/names/{id} {
         allow read: if true;
         allow create: if request.resource.data.keys().hasOnly(['name','createdAt'])
                       && request.resource.data.name is string
                       && request.resource.data.name.size() > 0
                       && request.resource.data.name.size() <= 24;
         allow update, delete: if false;
       }
     }
   }
   ```
4. Project settings (gear) → **Your apps → Web (</>)** → register → copy `apiKey`, `authDomain`, `projectId`, `appId` into `config.js`.
5. `quizUrl` already points to your Google Form. Change it only if the form changes.
6. Host it on **GitHub Pages** (free):
   - github.com → **New repository** → name it e.g. `wonderlash` → Public → Create.
   - **Add file → Upload files** → drag in everything from this folder (not the folder itself) → Commit.
   - **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)` → Save.
   - After a minute your page is live at `https://YOUR-USERNAME.github.io/wonderlash/`. That is the link for the NFC stickers.
   - The big screen is the same link plus `finale.html`.

## 3. Write the NFC stickers
- Buy **NTAG213 or NTAG215** stickers (any works, 144 bytes is plenty).
- Install **NFC Tools** (free, iPhone and Android) → Write → Add a record → **URL** → your GitHub Pages link → Write, hold the phone on the sticker.
- Optional: in NFC Tools, **Lock tag** after testing so nobody can overwrite it.
- iPhone XS and newer read NFC automatically when unlocked. Android needs NFC switched on. Print a small QR code of the same link on the sticker or the card as a backup.

## 4. On the day
- Open `https://YOUR-USERNAME.github.io/wonderlash/finale.html` on the presentation laptop, press **F**. Keep it as a browser tab you switch to, or add it as a "web page" object in PowerPoint / a link slide in Canva.
- Opening: live arrivals. Closing: press **T** and let the names rain behind the Thank you.
- `finale.html#thanks` opens straight in the finale.
- A guest who taps twice skips the form and goes straight to their welcome screen.
- For a rehearsal, change `eventId` (e.g. `wonderlash-test`) so test names never reach launch day. Switch back before the event.

## Notes
- Names are trimmed to 24 characters and a basic word filter blocks the obvious rude ones. Add more words in `rain.js` (the `BLOCK` list).
- To swap visuals, replace `bottle.png`, `brush.png`, `swatch.png` with any transparent PNGs of the same names.
- Firebase free tier covers ~50,000 writes a day. A launch with a few hundred guests uses a tiny fraction.
