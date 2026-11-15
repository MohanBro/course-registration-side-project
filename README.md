<div align="center">

# Course Portal

**A course registration portal for students, academic advisors and administrators.**

Built with React, Express and MongoDB. It has a navy-and-teal interface, a weekly timetable and Add/Drop requests that advisors approve inside the app.

[![CI checks](https://github.com/MohanBro/course-registration-side-project/actions/workflows/ci.yml/badge.svg?branch=feature/portal-redesign)](https://github.com/MohanBro/course-registration-side-project/actions/workflows/ci.yml)
![Node.js 24](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

</div>

> [!TIP]
> **You're on the `feature/portal-redesign` branch.** It was merged into `main` in [pull request #1](https://github.com/MohanBro/course-registration-side-project/pull/1). This README describes the project as of this branch. For the latest version, see [`main`](https://github.com/MohanBro/course-registration-side-project/tree/main).

> [!NOTE]
> This is a personal continuation by Sham Bahadu of a team course project (see [Attribution](#attribution)). It runs locally for development only. It is **not deployed** and **not ready for real student records**.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing workflow](#contributing-workflow)
- [Attribution](#attribution)

## Features

### 🎓 Students
- **Dashboard**: academic summary, current registrations, grade history by term, failed courses still to retake, and advisor contact details.
- **Weekly timetable** with Week and List views. It handles classes that meet more than once a week, weekend classes, missing schedules and overlapping older meetings (shown side by side). Backend registration rules still decide what is allowed.
- **Add/Drop requests**: submit a request with a reason, cancel a pending one and read the advisor's decision.

### 🧑‍🏫 Advisors
- **Request inbox** with a pending count. Approving a request rechecks every registration rule and updates the registration in one atomic, repeat-safe step.
- **My students**: grade history, current registrations, and eligible offerings with the reason when one is blocked. Advisors can register or drop students directly.
- **Offerings**: create, edit and remove sections (schedule, room, instructor, capacity), see remaining seats, and open or close each add/drop window.

### 🛠️ Administrators
- **Accounts**: create, edit, deactivate and assign advisors. Safeguards stop the last active admin from being removed.
- **Courses and sections** overview.

### ♿ Interface and accessibility
- Light navy-and-teal theme with a redesigned, responsive sign-in page and shared styling for the admin and advisor workspaces.
- Accessible focus states, and animations stop when the device asks for reduced motion.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, Oxlint |
| Backend | Node.js 24, Express 5, Mongoose 9, JSON Web Tokens, bcrypt |
| Database | MongoDB Atlas |
| Tests and CI | Node's built-in test runner, GitHub Actions |

## Getting started

### Prerequisites

- **Node.js 24** (the version CI uses) and npm
- A **MongoDB Atlas** cluster with a new, empty database for this project

### 1. Install

```bash
git clone https://github.com/MohanBro/course-registration-side-project.git
cd course-registration-side-project
npm ci --prefix server
npm ci --prefix client
```

### 2. Configure the backend

```bash
cp server/.env.example server/.env
```

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `5002`) |
| `CLIENT_ORIGIN` | Frontend address allowed by CORS (default `http://localhost:5174`) |
| `MONGODB_URI` | Your own Atlas connection string |
| `MONGODB_DB_NAME` | A separate personal database name |
| `JWT_SECRET` | A new, long random secret |
| `SEED_PASSWORD` | Shared password for the demo accounts |

> [!WARNING]
> Never commit `server/.env`, and never reuse the original team's database or secrets.

### 3. Load demo data (optional)

```bash
npm run demo:preview --prefix server   # shows what would be created, without connecting
npm run demo:seed --prefix server      # fills a NEW, EMPTY database with fictional data
```

The seed refuses to run on a database that already has data. See [demo data](docs/demo-data.md) for every scenario it sets up.

### 4. Run

Use two terminals:

```bash
cd server && npm run dev          # API → http://localhost:5002/api
npm run dev --prefix client       # Web → http://localhost:5174
```

Start the backend from inside `server/`, because it reads `.env` from that folder. Then open **http://localhost:5174**.

## Demo accounts

After `demo:seed`, every active account signs in with your `SEED_PASSWORD`:

| Account | Role | Scenario |
|---|---|---|
| `admin@example.test` | Admin | The only admin, so last-admin safeguards apply |
| `advisor001@example.test` | Advisor | Advises DEMO001–DEMO013 |
| `advisor002@example.test` | Advisor | Advises DEMO014–DEMO025 |
| `student001@example.test` | Student | Active registrations and varied eligibility cases |
| `student002@example.test` | Student | Passed a course they had failed; fills the only THA101 seat |
| `student004@example.test` | Student | Dropped STA101 earlier and can register again |
| `student025@example.test` | Student | Inactive account, so sign-in fails |

Demo addresses end in `.test` and cannot receive real email.

## Testing

**Offline checks** (no database needed). GitHub Actions runs these on every push to `main` or `feature/**` and on every pull request to `main`:

```bash
npm test --prefix server          # 50 backend tests
npm test --prefix client          # 4 frontend tests: timetable
npm run lint --prefix client
npm run build --prefix client
```

**Live Atlas check.** It creates a temporary database, runs the real server against it and then deletes it. Your demo database is not touched.

```bash
npm run test:requests:integration --prefix server   # Add/Drop requests
```

> [!CAUTION]
> The older inherited `test:integration` script keeps its test database afterwards. Read `server/scripts/acceptance.mjs` before running it.

## Project structure

```
.
├── client/                 React + Vite frontend
│   ├── src/
│   │   ├── components/     Timetable, Add/Drop requests…
│   │   ├── pages/          Student, advisor, admin and auth pages
│   │   └── utils/          Timetable helpers
│   └── tests/              Frontend unit tests
├── server/                 Express API
│   ├── src/
│   │   ├── controllers/    Route handlers
│   │   ├── models/         Mongoose models
│   │   ├── routes/         /api/auth, /student, /advisor, /admin, /health
│   │   └── utils/          Registration rules and auth
│   ├── scripts/            Demo seed and live integration checks
│   └── tests/              Backend unit tests
├── docs/                   Guides, roadmap, diagrams and screenshots
└── .github/workflows/      CI
```

## Documentation

| Guide | What it covers |
|---|---|
| [Development roadmap](docs/development-roadmap.md) | Milestones and feature decisions |
| [In-app requests](docs/in-app-requests.md) | Add/Drop request workflow and tests |
| [Demo data](docs/demo-data.md) | Demo accounts and scenarios |
| [Learning milestone 1](docs/learning-milestone-1.md) | How the timetable works |
| [Database diagram](docs/database-diagram.svg) | Collections and relationships |
| [Original group README](docs/original-group-readme.md) | The team's submitted project |

## Roadmap

- [x] Interface foundation and weekly timetable
- [x] Personal repository and fictional demo data
- [x] Add/Drop requests inside the app
- [ ] Password recovery
- [ ] Public release readiness: real email provider, hosting, accessibility checks in CI, and a production readiness review

## Contributing workflow

- `origin` is this repository. `upstream` is the original team repository; it is kept for reference and pushing to it is disabled.
- New work goes on `feature/...` branches and is merged into `main` through pull requests.
- Local `main` still tracks `upstream/main`, so update it from this repository explicitly:

  ```bash
  git checkout main
  git pull --ff-only origin main
  ```

- The app uses ports `5174` and `5002`, which differ from the team project's ports, so sign-ins in the browser stay separate.

## Attribution

The original Course Registration System was built by **Rachaphon Bhetcharut, Sham Bahadu, Panruethai Thubthimthong, Hathairat Deesrisuk and Trithep Sik**. The original repository is [Captansleepy/ITE220-Final-Project-Course-Registration-System](https://github.com/Captansleepy/ITE220-Final-Project-Course-Registration-System), and its Git history is preserved here. The redesign and the later features are personal additions. They are described separately, so the inherited application is not presented as solo work.

> [!IMPORTANT]
> The inherited workbook `server/CSC220-Project-Info_final_1.xlsx` is still in the repository, and its first 17 histories were reported to be based on real academic records. The demo seed does not read it.
