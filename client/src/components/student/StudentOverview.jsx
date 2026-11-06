import { Link } from "react-router-dom";
import { timeLabel } from "../../utils/timetable.js";
import { courseTones } from "../../utils/studentDashboard.js";

// The first thing a student sees: four key numbers, today's plan and quick links.
export default function StudentOverview({ data, plan, pendingCount, today, minutesNow }) {
  const tones = courseTones(data.registrations.map(r => r.courseCode));
  const retakes = data.outstandingFailures.length;
  const stats = [
    { label: "Credits earned", value: data.earnedCredits, to: "/student/grades", note: "Across all terms" },
    { label: "Courses this term", value: data.registrations.length, to: "/student/courses", note: data.registrations.length ? `${data.registrations.reduce((t, r) => t + (r.credits || 0), 0)} credits` : "None registered yet" },
    { label: "Pending requests", value: pendingCount ?? "–", to: "/student/requests", note: pendingCount ? "Waiting for your advisor" : "Nothing waiting", tone: pendingCount ? "attention" : "" },
    { label: "Retakes needed", value: retakes, to: "/student/grades", note: retakes ? "Courses to pass again" : "You're all caught up", tone: retakes ? "warning" : "" },
  ];

  return <>
    <ul className="stat-grid" aria-label="Key numbers">
      {stats.map(s => <li key={s.label}>
        <Link className={`stat-card ${s.tone ? `stat-${s.tone}` : ""}`} to={s.to}>
          <span className="stat-label">{s.label}</span>
          <strong className="stat-value">{s.value}</strong>
          <span className="stat-note">{s.note}</span>
        </Link>
      </li>)}
    </ul>

    <div className="overview-grid">
      <section className="dashboard-section today-card" aria-labelledby="today-title">
        <p className="eyebrow">{today}</p>
        <h2 id="today-title">Today's classes</h2>
        {plan.today.length === 0 ? <p className="muted-text">No classes today.</p>
          : <ul className="today-list">{plan.today.map(e => <li key={e.id} className={`course-tone-${tones[e.courseCode]}${e.end <= minutesNow ? " is-done" : ""}`}>
            <span className="today-time">{timeLabel(e.start)}–{timeLabel(e.end)}</span>
            <span><strong>{e.courseCode}</strong> · {e.courseName}<br /><small>{e.room} · Section {e.section}</small></span>
            {plan.current?.id === e.id && <span className="pill pill-open">Now</span>}
            {e.end <= minutesNow && <span className="pill pill-closed">Done</span>}
          </li>)}</ul>}
        {plan.next && <div className={`next-class course-tone-${tones[plan.next.courseCode]}`}>
          <span className="next-label">Next class</span>
          <strong>{plan.next.courseCode} · {plan.next.courseName}</strong>
          <span>{plan.next.isToday ? "Today" : plan.next.day}, {timeLabel(plan.next.start)}–{timeLabel(plan.next.end)} · {plan.next.room}</span>
        </div>}
        {!plan.next && data.registrations.length === 0 && <p className="muted-text">Once you're registered for courses, your next class will appear here.</p>}
        <Link className="text-link" to="/student/timetable">See full timetable →</Link>
      </section>

      <div className="overview-side">
        <section className="dashboard-section" aria-labelledby="quick-title">
          <h2 id="quick-title">Quick actions</h2>
          <div className="quick-actions">
            <Link className="button-link primary" to="/student/requests">Request an add or drop</Link>
            <Link className="button-link" to="/student/courses">View my courses</Link>
            <Link className="button-link" to="/student/grades">Check my grades</Link>
          </div>
        </section>
        <section className="dashboard-section" aria-labelledby="advisor-title">
          <h2 id="advisor-title">Your advisor</h2>
          {data.advisor ? <p className="advisor-line"><strong>{data.advisor.name}</strong><br /><a href={`mailto:${data.advisor.email}`}>{data.advisor.email}</a></p>
            : <p className="muted-text">No advisor assigned yet. Contact your department.</p>}
        </section>
      </div>
    </div>
  </>;
}
