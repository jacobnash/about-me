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

Add these records for `jacob.nash.engineering` in **Namecheap → nash.engineering → Advanced DNS**:

| Type | Host | Value |
|------|------|-------|
| CNAME | `jacob` | `about-me-a66fd.web.app` |
| TXT | `_acme-challenge.jacob` | run `npm run domain:status` for current value |

```bash
npm run domain:status
```

### Automated DNS (optional)

Requires Namecheap API credentials:

```bash
export NAMECHEAP_API_USER=...
export NAMECHEAP_API_KEY=...
export NAMECHEAP_USERNAME=...
export NAMECHEAP_CLIENT_IP=...
npm run domain:dns
```
