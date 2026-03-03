# InfluencerHub Deployment (Render + Vercel)

This repo is configured for:

- Backend: Render web service (`Backend/`)
- MongoDB: Render private service (`mongo:7` container with persistent disk)
- Frontend: Vercel (`frontend/`)

## 1) Render setup

1. Install the official Render CLI from:
   `https://render.com/docs/cli`
2. Login:
   ```bash
   render login
   ```
3. Confirm CLI auth:
   ```bash
   render services
   ```

## 2) Create/Update Render services from blueprint

Validate the blueprint from repo root (where `render.yaml` exists):

```bash
render blueprints validate render.yaml
```

Create/sync the Blueprint in Render Dashboard once, then keep it Git-backed.
After that, pushes to `main` auto-deploy.

## 3) Required Render environment variables

Configured in `render.yaml`:

- `NODE_ENV=production`
- `JWT_SECRET` (auto-generated)
- `JWT_EXPIRES_IN=7d`
- `CLIENT_ORIGIN=https://influncerhub.vercel.app`
- `CORS_ORIGINS=https://influncerhub.vercel.app,http://localhost:3000`
- `MONGO_URI` (wired from Render private service host/port)

Set manually in Render dashboard (marked `sync: false`):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 4) Verify backend deployment

```bash
curl https://influncerhub.onrender.com/health
```

Expected: HTTP 200 with `{ "status": "ok", ... }`.

## 5) Vercel frontend env

Set these in Vercel project env vars:

- `REACT_APP_API_URL=https://influncerhub.onrender.com`
- `VITE_API_URL=https://influncerhub.onrender.com`

Then redeploy frontend:

```bash
vercel --prod
```

## 6) Git-based deploy flow

```bash
git add .
git commit -m "Production deployment hardening for Render + Vercel"
git push origin main
```

Optional manual backend deploy via CLI:

```bash
render deploys create <RENDER_SERVICE_ID> --wait
```

Render auto-deploys backend from `main`, and Vercel can auto-deploy frontend from `main` as configured.
