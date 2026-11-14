import { Link } from "react-router-dom";
import { courseTones } from "../../utils/studentDashboard.js";
import { meetingSummary } from "../../utils/punch.js";
import { Box, PunchGrid } from "../Punch.jsx";

const closingDate = value => value ? new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok",
}).format(new Date(value)) : null;

// Current registrations as punch cards. The holes punched in each card are its
// timetable: columns are days and rows are hours. The times are also written out.
export default function StudentCourses({ data, now }) {
  const tones = courseTones(data.registrations.map(r => r.courseCode));
  const windowOpen = r => r.addDropOpen && (!r.addDropClosesAt || new Date(r.addDropClosesAt).getTime() > now);
  const total = data.registrations.reduce((t, r) => t + (r.credits || 0), 0);

  return <section className="dashboard-section" aria-labelledby="courses-title">
    <div className="section-heading">
      <div><p className="eyebrow">This term</p><h2 id="courses-title">Registered courses</h2>
        <p className="section-description">{data.registrations.length} {data.registrations.length === 1 ? "course" : "courses"} and {total} credits. The holes on each card show when the class meets.</p></div>
    </div>
    {data.registrations.length === 0 ? <div className="portal-empty">
      <strong>You're not registered for any courses this term</strong>
      <p>Ask your advisor to register you, or send an add request.</p>
      <Link className="button-link primary" to="/student/requests">Request to add a course</Link>
    </div> : <div className="course-grid">
      {data.registrations.map(r => {
        const open = windowOpen(r);
        const rooms = [...new Set(r.meetings.map(m => m.room).filter(Boolean))].join(", ");
        return <article key={r.id} className={`pcard course-tone-${tones[r.courseCode]}`}>
          <div className="pcard-head">
            <strong className="course-code">{r.courseCode}</strong>
            <span className="course-meta">Section {r.section}</span>
            {r.credits ? <span className="course-meta">{r.credits} credits</span> : null}
          </div>
          <div className="pcard-body">
            <div className="pcard-main">
              <h3>{r.courseName}</h3>
              <dl className="boxes">
                <Box label="When">{meetingSummary(r.meetings) || "To be confirmed"}</Box>
                <Box label="Room">{rooms || "To be confirmed"}</Box>
                <Box label="Instructor">{r.instructor || "Not specified"}</Box>
              </dl>
            </div>
            <PunchGrid meetings={r.meetings} />
          </div>
          <div className="pcard-foot">
            <div>
              <span className={`status-pill ${open ? "status-active" : "status-inactive"}`}>Add/drop {open ? "open" : "closed"}</span>
              <small>{open ? (r.addDropClosesAt ? `Closes ${closingDate(r.addDropClosesAt)}` : "No closing date set") : "Contact your advisor for changes"}</small>
            </div>
            {open && <div className="actions"><Link className="button-link" to={`/student/requests?course=${encodeURIComponent(r.courseCode)}&section=${encodeURIComponent(r.section)}`}>Request a change</Link></div>}
          </div>
        </article>;
      })}
    </div>}
  </section>;
}
