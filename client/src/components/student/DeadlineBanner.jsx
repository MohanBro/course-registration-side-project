import { Link } from "react-router-dom";
import Icon from "../Icon.jsx";

const when = date => new Intl.DateTimeFormat("en-GB", {
  weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
}).format(date);

// A notification banner for an add/drop window that closes soon.
// It cannot be dismissed: it disappears by itself once the deadline passes.
export default function DeadlineBanner({ deadline }) {
  const days = deadline.daysLeft <= 1 ? "within a day" : `in ${deadline.daysLeft} days`;
  return <div className="notice-banner" role="region" aria-labelledby="notice-title">
    <Icon name="clock" className="icon notice-icon" />
    <div>
      <p id="notice-title" className="notice-title">Add/drop closes {days}</p>
      <p>Changes to <strong>{deadline.courseCode} · {deadline.courseName}</strong> must be requested by {when(deadline.closesAt)} (Bangkok time).</p>
    </div>
    <Link className="button-link" to={`/student/requests?course=${encodeURIComponent(deadline.courseCode)}&section=${encodeURIComponent(deadline.section)}`}>Request a change</Link>
  </div>;
}
