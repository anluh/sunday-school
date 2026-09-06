# Недільна школа — відповіді та бали

Mobile-first Vue/Firebase app for collecting Sunday school answers and manually assigning points.

## Stack

- Vue 3 + TypeScript + Vite
- Tailwind CSS
- Firebase Auth for teacher login
- Firestore for sessions, submissions, and child same-day receipts
- GitHub Pages deploy via GitHub Actions

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Firebase access can be added later by filling `.env.local`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BASE_PATH=/
```

## Scripts

```bash
npm run test
npm run build
npm run preview
```

## Main flows

### Child

- Opens `/`.
- If a Sunday is open, enters name and fills 5 answers.
- Can submit once per opened Sunday for the same normalized name.
- After submit, browser stores a same-day local receipt token.
- On the same device/browser during the same day, child can see only their own submitted answers and submitted time.
- Child never sees points.

### Teacher

- Opens `/#/admin/login`.
- Logs in with Firebase Email/Password account.
- Creates and opens a Sunday session.
- Reviews submissions by Sunday.
- Assigns 1–5 points per answer.
- Marks submissions reviewed.
- Opens leaderboard to see total reviewed points.

## Firebase setup later

1. Enable Firestore.
2. Enable Authentication → Email/Password.
3. Create teacher user manually.
4. Add Firebase web app config to `.env.local` and GitHub repo variables.
5. Deploy `firestore.rules` and `firestore.indexes.json`.

## GitHub Pages

Set `VITE_BASE_PATH` to:

- `/` for custom domain/root deploy;
- `/repo-name/` for normal GitHub Pages project deploy.
