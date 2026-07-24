# ShareShelf

A hyperlocal, verified community platform for donating, requesting, and affordably reselling books,
stationery, and academic equipment — built from the ShareShelf PRD, covering all four MVP phases:

- **Phase 1 — Core MVP:** auth & role-based verification, listings with geo-search, request-to-claim
  flow with contact gating, safe pre-approved meetup points, two-way ratings.
- **Phase 2 — Trust & discovery:** wishlist/request board with auto-matching, in-app real-time chat
  (Socket.IO), reporting & admin moderation queue, no-show tracking.
- **Phase 3 — Institutional & admin tooling:** school/institution accounts, admin verification queue,
  admin reports queue, user suspension, full audit log.
- **Phase 4 — Insights:** admin stats dashboard (active listings, completed transactions, verified
  users, flagged accounts) with charts.

Loophole mitigations from the PRD are implemented directly in the code (see inline comments), including:
duplicate-account detection via one-way document-number hashing, contact info only revealed on request
acceptance, price-cap enforcement for paid listings, listing-creation rate limiting, no-show tracking, and
auto-flagging (not auto-banning) of low-rated accounts for human review.

## Tech stack

- **Backend:** Node.js, Express, MongoDB/Mongoose, JSON Web Tokens (access + rotating refresh tokens),
  Socket.IO for real-time notifications/chat, Multer for file uploads, bcrypt for password hashing.
- **Frontend:** React 18 (Vite), React Router, Tailwind CSS, Leaflet/react-leaflet for maps, Recharts for
  the admin dashboard, Axios with automatic token refresh, Socket.IO client.

## Project structure

```
shareshelf/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── models/           # Mongoose schemas (User, Listing, Request, TransactionRequest, Rating, Report, ...)
│   ├── middleware/        # auth, role checks, rate limiting, file upload, error handling
│   ├── controllers/       # business logic per resource
│   ├── routes/            # Express routers
│   ├── utils/             # jwt, hashing, OTP stub, email stub, socket.io setup
│   ├── seed/seed.js        # demo data (accounts, listings, meetup points)
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js          # API client w/ refresh-token interceptor
    │   ├── context/               # Auth + Socket React contexts
    │   ├── components/            # Navbar, ListingCard, RatingStars, AdminLayout, ...
    │   └── pages/                 # all 16+ pages, incl. pages/admin/*
    ├── tailwind.config.js
    └── vite.config.js
```

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB connection string,
# and change JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to random strings

npm install
npm run seed     # optional: creates demo admin, students, school, listings, meetup points
npm run dev       # starts on http://localhost:5000
```

Demo accounts created by `npm run seed` (password `Passw0rd!` unless noted):
- **Admin:** `admin@shareshelf.app` / value of `ADMIN_PASSWORD` in `.env` (default `Admin@12345`)
- **Student (verified):** `rohan@example.com`
- **Student (verification pending):** `priya@example.com`
- **School:** `admin@greenvalley.example.com`
- **Public donor:** phone `+919876500001` (use the OTP login tab — check the backend console log for
  the dev-mode OTP code, since no real SMS provider is configured out of the box)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173, proxies /api and /uploads to :5000
```

Open `http://localhost:5173`.

### Notes on stubs / providers

To make the app runnable immediately without any paid third-party accounts, a few integrations are
stubbed and clearly marked in the code — swap them for real providers before production use:

- **OTP/SMS** (`backend/utils/otp.js`): logs the code to the server console instead of sending a real SMS.
  Set `OTP_PROVIDER=twilio` and fill in Twilio credentials to go live.
- **Email** (`backend/utils/email.js`): logs to console unless `EMAIL_PROVIDER=smtp` and SMTP credentials
  are set.
- **File storage** (`backend/middleware/upload.js`): stores uploads on local disk under `backend/uploads/`
  and serves them at `/uploads/...`. Swap for Cloudinary/S3 for production (direct streaming upload is
  recommended over routing files through the API server).

### Security/privacy notes baked into the code

- Verification documents are hashed (not stored in plaintext long-term); the raw uploaded file is deleted
  automatically the moment an admin approves or rejects it.
- Contact details (phone/email) for a transaction are only included in the API response once the listing
  owner accepts the request.
- Exact user location is never returned in listing/profile responses — only the `areaLabel` and a
  geo-filtered search are exposed.
- All destructive/administrative actions (verification decisions, suspensions, report resolutions) are
  written to an `AdminAuditLog` collection, viewable in the admin stats dashboard.

## Production checklist (not included, by design, since this is a functional MVP build)

- Move OTP store from in-memory `Map` to Redis with TTL.
- Add HTTPS/reverse proxy (e.g. Nginx) in front of both services.
- Swap local file storage for Cloudinary/S3 and set up scheduled deletion for expired/completed listing
  photos.
- Add automated tests (the codebase is structured with clear controller/route separation to make this
  straightforward to add).
- Add a background job (e.g. `node-cron`) to auto-expire listings past `expiresAt`.
