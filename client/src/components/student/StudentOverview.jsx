import { Link } from "react-router-dom";
import { timeLabel } from "../../utils/timetable.js";
import { courseTones } from "../../utils/studentDashboard.js";
import Icon from "../Icon.jsx";

const shortDate = date => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" }).format(date);

// The first thing a student sees: four key numbers, today's plan and quick links.
export default function StudentOverview({ data, plan, pendingCount, today, minutesNow, deadlines }) {
  const tones = courseTones(data.registrations.map(r => r.courseCode));
  const retakes = data.outstandingFailures.length;
  const stats = [
    { label: "Credits earned", value: data.earnedCredits, to: "/student/grades", note: "Across all terms", icon: "award" },
    { label: "Courses this term", value: data.registrations.length, to: "/student/courses", icon: "book", note: data.registrations.length ? `${data.registrations.reduce((t, r) => t + (r.credits || 0), 0)} credits` : "None registered yet" },
    { label: "Pending requests", value: pendingCount ?? "–", to: "/student/requests", icon: "inbox", note: pendingCount ? "Waiting for your advisor" : "Nothing waiting", tone: pendingCount ? "attention" : "" },
    { label: "Retakes needed", value: retakes, to: "/student/grades", icon: "alert", note: retakes ? "Courses to pass again" : "You're all caught up", tone: retakes ? "warning" : "" },
  ];

  return <>
    <ul className="stat-grid" aria-label="Key numbers">
      {stats.map(s => <li key={s.label}>
        <Link className={`stat-card ${s.tone ? `stat-${s.tone}` : ""}`} to={s.to}>
          <span className="stat-label"><Icon name={s.icon} />{s.label}</span>
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
        <Link className="text-link" to="/student/timetable">See full timetable <Icon name="arrow" /></Link>
      </section>

      <div className="overview-side">
        <section className="dashboard-section" aria-labelledby="upcoming-title">
          <h2 id="upcoming-title">Upcoming</h2>
          {deadlines.length === 0 && !pendingCount ? <p className="muted-text"><Icon name="check" /> Nothing due right now.</p>
            : <ul className="upcoming-list">
              {deadlines.map(d => <li key={`${d.courseCode}-${d.section}`} className={d.daysLeft <= 3 ? "is-soon" : ""}>
                <span className="upcoming-date">{shortDate(d.closesAt)}</span>
                <span>Add/drop closes for <strong>{d.courseCode}</strong>{d.daysLeft <= 3 && <span className="pill pill-warning">{d.daysLeft <= 1 ? "Tomorrow" : `${d.daysLeft} days`}</span>}</span>
              </li>)}
              {pendingCount > 0 && <li><span className="upcoming-date">Waiting</span><span>{pendingCount} {pendingCount === 1 ? "request is" : "requests are"} with your advisor</span></li>}
            </ul>}
        </section>
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
          {data.advisor ? <p className="advisor-line"><strong>{data.advisor.name}</strong><br /><a className="icon-link" href={`mailto:${data.advisor.email}`}><Icon name="mail" />{data.advisor.email}</a></p>
            : <p className="muted-text">No advisor assigned yet. Contact your department.</p>}
        </section>
      </div>
    </div>
  </>;
}
