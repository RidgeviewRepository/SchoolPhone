# SchoolPhone

SchoolPhone is a small, Firebase-backed 4-digit messaging prototype intended for school communities. Users claim a unique 4-digit ID and can send messages to a global school channel or start private (PM) conversations with other 4-digit IDs.

This repository contains:

- `index.html` — the client UI.
- `style.css` — basic styles for the UI.
- `app.js` — client-side Firebase code (replace `firebaseConfig` with your project values).
- `firebase.json` — CLI config referencing `database.rules.json` for Realtime Database rules.
- `database.rules.json` — Realtime Database rules (auth-based rules provided).
- `functions/` — Cloud Function that automatically removes inactive IDs.

## Overview

- Claiming IDs: Users request a random unused 4-digit ID. The client attempts multiple random claims via a transaction against `ids/{id}` in Realtime Database to ensure uniqueness.
- Messaging: Messages are stored under `messages/global` for the school-wide channel and `messages/pm/{a_b}` for private conversations between two IDs.
- Authentication: The client uses Firebase Anonymous Auth; the Realtime Database rules require `auth != null` for reads/writes.

## 5‑day cancellation (automatic cleanup)

- Purpose: To prevent `ids/*` from accumulating stale entries, a scheduled Cloud Function removes ID records that have been inactive for more than five days.
- How it works:
  1. Each claimed ID has a `lastActive` timestamp that is updated whenever the user sends a message.
  2. The Cloud Function `cleanupInactiveUsers` (in `functions/index.js`) runs once every 24 hours via Cloud Scheduler.
  3. The function reads all entries under `ids/`, calculates `now - lastActive`, and deletes any ID where the difference exceeds 5 days (5 * 24 * 60 * 60 * 1000 ms).
  4. Deleted IDs become available again for claiming by other users.

---

## Quick setup

1. Install the Firebase CLI and log in:

```bash
npm install -g firebase-tools
firebase login
```

2. Initialize / configure your Firebase project (if not done already):

```bash
cd /path/to/SchoolPhone
firebase init functions,database
```

3. Enable Anonymous Auth and Realtime Database in the Firebase Console.

4. Replace the `firebaseConfig` object in `app.js` with your project's credentials (found in Project Settings → SDK).

5. Deploy functions (from repo root):

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

6. Serve the static UI locally for quick testing (simple):

```bash
cd /path/to/SchoolPhone
python3 -m http.server 8000
# open http://localhost:8000
```

## Database rules

- Realtime Database rules are stored in `database.rules.json`. `firebase.json` is configured to reference that file for CLI-friendly deploys.

## Local testing with Firebase Emulator

- Install dependencies and start the emulator to run the Realtime Database and Functions locally. From the repo root:

```bash
# install CLI (if not already installed)
npm install -g firebase-tools

# install function deps
cd functions
npm install
cd ..

# start the emulators for database + functions (optionally hosting)
firebase emulators:start --only database,functions
```

- While the emulator is running you can point the client to the local emulator by using the SDK's `useDatabaseEmulator` during development or by running the UI that connects to the local host. The Functions emulator exposes logs and an HTTP interface for callable/HTTP functions.

- To test functions locally with the emulator, ensure `functions/node_modules` is installed and use the emulator UI or terminal logs.

## `functions/.gitignore`

- A `.gitignore` was added in `functions/` to ignore `node_modules`, runtime config, and debug files.

## Additional notes

- If you prefer deploying database rules via the CLI, `database.rules.json` is included and `firebase.json` is configured to reference it.

- Replace Firebase placeholders in `app.js` with your project's config and enable Anonymous Auth and Realtime Database in the Firebase console before testing.

---

Contact / Contribution

- This is a small demo project — feel free to open issues or PRs for improvements.
# SchoolPhone

SchoolPhone is a small, Firebase-backed 4-digit messaging prototype intended for school communities. Users claim a unique 4-digit ID and can send messages to a global school channel or start private (PM) conversations with other 4-digit IDs.

This repository contains:

- `index.html` — the client UI.
- `style.css` — basic styles for the UI.
- `app.js` — client-side Firebase code (replace `firebaseConfig` with your project values).
- `firebase.json` — Realtime Database rules (simple auth-based rules provided).
- `functions/` — Cloud Function that automatically removes inactive IDs.

Overview
 - Claiming IDs: Users request a random unused 4-digit ID. The client attempts multiple random claims via a transaction against `ids/{id}` in Realtime Database to ensure uniqueness.
 - Messaging: Messages are stored under `messages/global` for the school-wide channel and `messages/pm/{a_b}` for private conversations between two IDs.
 - Authentication: The client uses Firebase Anonymous Auth; the Realtime Database rules require `auth != null` for reads/writes.

5‑day cancellation (automatic cleanup)
 - Purpose: To prevent `ids/*` from accumulating stale entries, a scheduled Cloud Function removes ID records that have been inactive for more than five days.
 - How it works:
	 1. Each claimed ID has a `lastActive` timestamp that is updated whenever the user sends a message.
	 2. The Cloud Function `cleanupInactiveUsers` (in `functions/index.js`) runs once every 24 hours via Cloud Scheduler.
	 3. The function reads all entries under `ids/`, calculates `now - lastActive`, and deletes any ID where the difference exceeds 5 days (5 * 24 * 60 * 60 * 1000 ms).
	 4. Deleted IDs become available again for claiming by other users.


