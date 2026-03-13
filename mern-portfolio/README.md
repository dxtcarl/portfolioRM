# MERN Portfolio

This project converts your static portfolio into a MERN app with:
- Photo uploads (stored on disk under `server/uploads`)
- Editable sections (e.g., About)
- Minimal admin auth via JWT (single admin from `.env`)

## Structure
- `server/` Node/Express + MongoDB API
- `client/` React (Vite) frontend

## Setup
1) Server env
```
copy server/.env.example server/.env
# Edit server/.env: set MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
# To generate a password hash:
# node -e "console.log(require('bcrypt').hashSync('yourpassword', 10))"
```

2) Install dependencies
```
cd server && npm install
cd ../client && npm install
```

3) (Optional) Seed photos from your existing `img/` folder and create default sections
```
cd server
node scripts/seed.js
```

4) Run in development
- API: `npm run dev` (in `server/`)
- Frontend: `npm run dev` (in `client/`)

Frontend dev server: http://localhost:5173
API: http://localhost:5000

Set `client/.env` with `VITE_API_URL=http://localhost:5000` (already in `.env.example`).

## Production build (single deployment)
- Build frontend: `cd client && npm run build`
- Ensure server serves `client/dist` (already configured)
- Start server: `cd ../server && npm run start`

Uploads are served from `/uploads`.
