# Course Portal: backend

This is the Express API for the Course Portal. For full setup, demo accounts and the feature list, see the [project README](../README.md).

## Stack

Node.js 24 · Express 5 · Mongoose 9 (MongoDB Atlas) · JSON Web Tokens · bcrypt. Tests use Node's built-in test runner.

## Setup

```bash
npm ci --prefix server
cp server/.env.example server/.env    # then fill in your own values
cd server && npm run dev              # API at http://localhost:5002/api
```

Run the server from inside `server/`. The scripts load `.env` with `node --env-file=.env`, so the file must be in the current folder. The environment variables are listed in the [project README](../README.md#2-configure-the-backend).

If `PORT` isn't set, the server falls back to `5001`. The `.env.example` sets it to `5002`, which is the port the frontend expects.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API and restarts it when files change |
| `npm start` | Starts the API without watching |
| `npm test` | Runs the unit tests in `tests/` (no database needed) |
| `npm run demo:preview` | Shows the fictional demo data without connecting to MongoDB |
| `npm run demo:seed` | Writes the demo data. Only accepts `MONGODB_DB_NAME=course_registration_seed_personal_dev`, and only when that database is empty |
| `npm run test:requests:integration` | Live check of Add/Drop requests against a temporary Atlas database |
| `npm run test:sessions:integration` | Live check that a password change ends old sessions |
| `npm run test:reset:integration` | Live check of the password-reset flow |
| `npm run seed:preview` / `npm run seed` | Inherited seed that reads the team's workbook (see the warning below) |
| `npm run test:integration` | Inherited live acceptance check. It keeps its test database afterwards |

The three `test:*:integration` checks each create a new database, run the real server against it and then delete it. They never touch the database in your `.env`.

> [!WARNING]
> The inherited `seed` script reads `CSC220-Project-Info_final_1.xlsx`, whose first 17 histories were reported to be based on real academic records. Use `demo:seed` instead. It reads no workbook and creates only fictional data.

## API

Every route is under `/api`. Apart from health, sign-in and password recovery, each request needs an `Authorization: Bearer <token>` header, and each role can only use its own routes.

| Area | Routes |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Student | `GET /student/dashboard`, `GET /student/request-offerings`, `GET`/`POST /student/requests`, `POST /student/requests/:requestId/cancel` |
| Advisor | `GET /advisor/students`, `GET /advisor/students/:id/history`, `GET`/`POST /advisor/students/:id/registrations`, `DELETE /advisor/students/:id/registrations/:registrationId`, `GET /advisor/students/:id/offerings`, `GET /advisor/requests`, `POST /advisor/requests/:requestId/review`, `GET /advisor/catalog`, `GET`/`POST /advisor/offerings`, `PATCH`/`DELETE /advisor/offerings/:offeringId`, `PATCH /advisor/offerings/:offeringId/add-drop` |
| Admin | `GET`/`POST /admin/users`, `PATCH`/`DELETE /admin/users/:id` (delete deactivates the account), `GET /admin/courses`, `GET /admin/sections` |

The forgot-password and reset-password routes are rate-limited per IP address: 5 link requests and 10 reset attempts every 15 minutes. Emails are also limited to 3 per address per hour. The limits are kept in memory, so they reset when the server restarts.

## Layout

```
server/
├── src/
│   ├── app.js          Express app: CORS, JSON parsing, routes
│   ├── server.js       Connects to MongoDB, creates indexes, starts listening
│   ├── config/         Database connection
│   ├── controllers/    Route handlers for each area
│   ├── middleware/     Sign-in token and role checks
│   ├── models/         AddDropRequest, Course, Offering, PasswordResetToken,
│   │                   Record, Registration, Term, User
│   ├── routes/         One file per area: auth, student, advisor, admin, health
│   └── utils/          Registration rules, auth helpers, mailer, rate limits
├── scripts/            Demo seed and live integration checks
├── tests/              Unit tests (*.test.js, *.test.mjs)
├── seed.cjs            Inherited workbook seed
└── seed-config.json    Credits, advisor assignments and offerings for the inherited seed
```
