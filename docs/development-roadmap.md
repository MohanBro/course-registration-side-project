# Course Portal development roadmap

Goal: a polished course portal that can be prepared for real use later. Working style: implement one complete milestone, review the result and code together, then advance. Do not treat this document as a claim that future milestones exist already.

## Milestone 1 — Interface foundation and timetable

Completed on 28 October 2026 and merged into `main` with pull request #1: separate checkout and branch; upstream push disabled; no inherited local environment files; separate ports; navy-and-teal theme; redesigned login and consistent workspace styling; a student recurring timetable with Week/List view and schedule edge-case tests. Screenshots and browser tests use invented API fixtures. Neither the shared database nor the submitted folder was edited.

Still to do within the wider redesign: a shared navigation shell for every role, route-based workspace navigation rather than large dashboard pages, account forms and status components, and more concise mobile course views. The current styling is a first pass over the existing screens, not the final information architecture.

## Milestone 2 — Personal repository and development data

Completed. The GitHub fork MohanBro/course-registration-side-project is connected as origin; the team repository remains upstream with pushes disabled. A personal MongoDB Atlas database with new secrets and a dedicated fictional demo generator was set up and verified on 28 October 2026, and the student, advisor and admin flows were manually verified with Sham. See [demo accounts and scenarios](demo-data.md). Original history and team attribution are preserved; no real records or credentials are published.

## Milestone 3 — Requests inside the website

Completed and merged into `main` on 6 November 2026 (pull request #1). See [workflow, decisions and manual tests](in-app-requests.md).

Students submit Add or Drop requests with a reason, can cancel pending ones and see advisor decisions. Advisors see requests only for their currently assigned students, with a pending count based on saved request state. Approval rechecks the term, assignment, account status, capacity, history, duplicates and clashes, and updates registration in one atomic, repeat-safe step. Submitting alone never reserves a seat. Windows must be open at both submission and approval, and reassignment moves review authority to the current advisor. The PDF remains an optional download, and the pending count refreshes every 15 seconds. Sham manually verified an approved add, an approved drop, a rejection and a cancellation.

## Milestone 4 — Password recovery

Completed and merged into `main` on 6 November 2026 (pull request #2).

- **Sessions end on password change.** Each user has a `sessionVersion`. Login tokens carry it, and the server rejects tokens from an older version. A reset and an admin password change both raise it, so old sessions stop working everywhere.
- **Forgot password.** `POST /api/auth/forgot-password` gives the same reply for registered, unknown and inactive emails. Only active accounts get a link. The reply is sent before any lookup so response time does not reveal whether an account exists.
- **Reset links.** 32 random bytes; only a SHA-256 hash is stored. Links last 30 minutes, work once and are used up in a single atomic database step, so two simultaneous resets cannot both succeed. A newer request cancels older links, and expired rows are removed automatically a day later. The token is placed after `#` in the link and removed from the address bar when the page opens.
- **Rate limits.** 5 link requests and 10 reset attempts per computer per 15 minutes; at most 3 emails per address per hour (extra requests are silently not sent). Limits are kept in memory, which suits one local server; a hosted setup with several servers would need shared storage.
- **Email.** `MAIL_TRANSPORT=console` prints the email in the backend terminal, clearly labelled as development-only, and is refused when `NODE_ENV=production`. No real email provider is configured yet.
- **Pages.** Forgot Password and Reset Password pages in the navy/teal style, a "Forgot your password?" link on sign-in, and a return to sign-in with a notice whenever a signed-in request is refused.
- **Tests.** Backend and frontend unit tests, plus `test:sessions:integration` and `test:reset:integration`, which run against a temporary Atlas database and delete it afterwards.
- **Manual check.** On 6 November 2026 the full flow was run in Chrome with the real servers and demo database using the disposable DEMO026 account: link requested, development email received, new password saved, sign-in succeeded, and reusing the link was refused.

## Milestone 5 — Public release

Run both role workflows and mobile/keyboard checks. Add continuous checks for the new frontend tests, integration tests against isolated data, accessibility checks and request/reset paths. Document your own contributions, architecture, screenshots and known limitations. Choose hosting and mail delivery after the main flow is stable. Real use needs a separate readiness review covering identity/account onboarding, backups, monitoring, HTTPS, actual institutional policies, data handling and recovery procedures. Do not equate a polished interface with production readiness.

## Current status

Milestones 1–4 are merged into `main`. Milestone 5 has not been planned in detail yet; the summary above is the original outline only.
