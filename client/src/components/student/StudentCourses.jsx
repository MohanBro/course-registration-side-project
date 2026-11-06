import { Link } from "react-router-dom";
import { courseTones } from "../../utils/studentDashboard.js";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const byDay = (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);

const closingDate = value => value ? new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok",
}).format(new Date(value)) : null;

// Current registrations as cards (they stack nicely on phones, unlike a wide table).
export default function StudentCourses({ data, now }) {
  const tones = courseTones(data.registrations.map(r => r.courseCode));
  const windowOpen = r => r.addDropOpen && (!r.addDropClosesAt || new Date(r.addDropClosesAt).getTime() > now);
  const total = data.registrations.reduce((t, r) => t + (r.credits || 0), 0);

  return <section className="dashboard-section" aria-labelledby="courses-title">
    <div className="section-heading">
      <div><p className="eyebrow">This term</p><h2 id="courses-title">Registered courses</h2>
        <p className="section-description">{data.registrations.length} {data.registrations.length === 1 ? "course" : "courses"} · {total} credits</p></div>
    </div>
    {data.registrations.length === 0 ? <div className="portal-empty">
      <strong>You're not registered for any courses this term</strong>
      <p>Ask your advisor to register you, or send an add request.</p>
      <Link className="button-link primary" to="/student/requests">Request to add a course</Link>
    </div> : <div className="course-grid">
      {data.registrations.map(r => {
        const open = windowOpen(r);
        return <article key={r.id} className={`course-card course-tone-${tones[r.courseCode]}`}>
          <header>
            <div><strong className="course-code">{r.courseCode}</strong><h3>{r.courseName}</h3></div>
            <span className="course-meta">Sec {r.section}{r.credits ? ` · ${r.credits} cr` : ""}</span>
          </header>
          <ul className="course-meetings">
            {r.meetings.length ? [...r.meetings].sort(byDay).map((m, i) => <li key={`${m.day}-${i}`}><span>{m.day}</span>{m.time} · {m.room || "Room to be confirmed"}</li>)
              : <li>Meeting times to be confirmed</li>}
          </ul>
          <p className="course-instructor">Instructor: {r.instructor || "Not specified"}</p>
          <footer>
            <div>
              <span className={`pill ${open ? "pill-open" : "pill-closed"}`}>Add/drop {open ? "open" : "closed"}</span>
              <small>{open ? (r.addDropClosesAt ? `Closes ${closingDate(r.addDropClosesAt)}` : "No closing date set") : "Contact your advisor for changes"}</small>
            </div>
            {open && <Link className="button-link" to={`/student/requests?course=${encodeURIComponent(r.courseCode)}&section=${encodeURIComponent(r.section)}`}>Request a change</Link>}
          </footer>
        </article>;
      })}
    </div>}
  </section>;
}
