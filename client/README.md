# Course Portal: frontend

This is the React single-page app for the Course Portal. For setup, demo accounts and the full feature list, see the [project README](../README.md).

## Stack

React 19 · React Router 7 · Vite 8 · Oxlint. There is no CSS framework; styles are plain CSS files next to the components.

## Scripts

Run these from the repository root with `--prefix client`, or from inside `client/` without it.

| Command | What it does |
|---|---|
| `npm run dev --prefix client` | Starts the dev server at http://localhost:5174 |
| `npm run build --prefix client` | Builds for production into `client/dist` |
| `npm run preview --prefix client` | Serves the production build locally |
| `npm test --prefix client` | Runs the unit tests in `tests/` with Node's built-in test runner |
| `npm run lint --prefix client` | Runs Oxlint |

The app expects the API at `http://localhost:5002/api`, so start the backend too (see the project README).

## Layout

```
client/
├── public/        Static files: favicon, icons, fonts and the fillable Add/Drop PDF form
├── src/
│   ├── api.js     API client and session handling
│   ├── components/ App shell, timetable, punch cards, request slips
│   ├── hooks/     usePageTitle (sets each page's browser-tab title)
│   ├── pages/     Sign-in, password reset, student, advisor and admin pages
│   ├── styles/    Shared portal styles
│   └── utils/     Pure logic (timetable, calendar export, punch cards), covered by tests/
└── tests/         *.test.mjs unit tests
```

The logic in `src/utils/` has no React or browser dependencies, so it can be tested directly with `node --test`.
