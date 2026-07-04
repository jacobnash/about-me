# about-me

Personal site for [jacob.nash.engineering](https://jacob.nash.engineering), hosted on Firebase.

| | |
|---|---|
| **Custom domain** | https://jacob.nash.engineering |
| **Firebase project** | `about-me-a66fd` |
| **Default Hosting URL** | https://about-me-a66fd.web.app |

## Customize

Edit `web/public/index.html` — name, bio, and contact links. Styles in `web/public/css/styles.css`.

## Local preview

```bash
npm install -g firebase-tools   # if needed
firebase login                  # once
npm run serve
```

## Deploy

Manual:

```bash
npm run deploy
```

Automatic: push to `main` — GitHub Actions deploys Hosting (see CI/CD below).

## CI/CD

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

- **Pull requests** — validates required site files exist
- **Push to `main`** — deploys Firebase Hosting to `about-me-a66fd`

### One-time GitHub setup

1. **Create a Firebase service account key**
   - [Firebase Console → Project settings → Service accounts](https://console.firebase.google.com/project/about-me-a66fd/settings/serviceaccounts/adminsdk)
   - Click **Generate new private key** and save the JSON file

2. **Add repository secret**
   - GitHub repo → **Settings → Secrets and variables → Actions**
   - New secret: `FIREBASE_SERVICE_ACCOUNT` = entire JSON file contents

3. **Optional: production environment**
   - GitHub repo → **Settings → Environments** → create `production` (can add approval rules later)

After the secret is set, every merge to `main` redeploys the site.

## DNS at Namecheap

Add these in **Namecheap → nash.engineering → Advanced DNS** (same pattern as `feather` and `pizza`):

| Site | Type | Host | Value |
|------|------|------|-------|
| jacob | CNAME | `jacob` | `about-me-a66fd.web.app` |
| jacob (SSL) | TXT | `_acme-challenge.jacob` | `npm run domain:status` |
| corefour | CNAME | `corefour` | `core-four-score.web.app` |
| corefour (SSL) | TXT | `_acme-challenge.corefour` | `XbivmWpOWAOOiKmLVdne-VvD0tymvNHFo-P0d7gO1bo` |
| chainwax | CNAME | `chainwax` | `chain-wax-bf20e.web.app` |
| chainwax (SSL) | TXT | `_acme-challenge.chainwax` | `cMvysx2QhfZ4MnPX-Aq10vXd2kZfp1e4BXs26Lr2qD4` |

Existing: `feather.nash.engineering`, `pizza.nash.engineering`.

### Automated DNS (optional)

Requires Namecheap API credentials:

```bash
export NAMECHEAP_API_USER=...
export NAMECHEAP_API_KEY=...
export NAMECHEAP_USERNAME=...
export NAMECHEAP_CLIENT_IP=...
npm run domain:dns
```
