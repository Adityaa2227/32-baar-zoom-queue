# 32 Baar Support Desk

A mobile-first participant request form for the 32 Baar community, backed by a protected Anushka coordinator API.

## Local setup

1. Install frontend dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `VITE_API_URL`.
3. In `render-api`, run `npm install`, copy `.env.example` to `.env`, then set MongoDB and admin values.
4. Run `npm run dev` in each folder.

## Deployment

**Render:** Create a Blueprint service from this repository or create a Node web service with root directory `render-api`. Add `MONGODB_URI`, `ADMIN_PASSWORD`, and `ALLOWED_ORIGINS` as environment variables.

**Vercel:** Import this repository. Set `VITE_API_URL` to `https://YOUR-RENDER-API.onrender.com/api`, then deploy. Add the final Vercel URL to the Render `ALLOWED_ORIGINS` variable.

## Admin API

The dashboard can call `GET /api/admin/requests?status=pending` and `PATCH /api/admin/requests/:id/done` with an `x-admin-password` header. Never expose that password in the public form.


