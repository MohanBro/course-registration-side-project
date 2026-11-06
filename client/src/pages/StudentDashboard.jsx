import { useEffect, useState } from "react";
import { Navigate, NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api.js";
import AddDropRequests from "../components/AddDropRequests.jsx";
import WeeklyTimetable from "../components/WeeklyTimetable.jsx";
import StudentOverview from "../components/student/StudentOverview.jsx";
import StudentCourses from "../components/student/StudentCourses.jsx";
import StudentGrades from "../components/student/StudentGrades.jsx";
import DeadlineBanner from "../components/student/DeadlineBanner.jsx";
import Icon from "../components/Icon.jsx";
import { buildTimetable } from "../utils/timetable.js";
import { bangkokNow, greeting, planForNow, upcomingDeadlines, urgentDeadline } from "../utils/studentDashboard.js";
import "./StudentDashboard.css";

// The sections of the student workspace. Each has its own address, e.g. /student/grades.
const SECTIONS = [
  { key: "overview", path: "/student", label: "Overview", title: null, icon: "home" },
  { key: "timetable", path: "/student/timetable", label: "Timetable", title: "Timetable", icon: "calendar" },
  { key: "courses", path: "/student/courses", label: "My courses", title: "My courses", icon: "book" },
  { key: "grades", path: "/student/grades", label: "Grades", title: "Grades", icon: "award" },
  { key: "requests", path: "/student/requests", label: "Requests", title: "Requests", icon: "inbox" },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const sectionKey = params["*"] || "overview";
  const section = SECTIONS.find(s => s.key === sectionKey);

  const [data, setData] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Keep "now" fresh so "Today" and "Next class" stay correct if the page stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Load the dashboard and the number of pending requests.
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setError("");
      try {
        const [result, requests] = await Promise.all([
          apiRequest("/student/dashboard", { signal: controller.signal }),
          // The count is a nice extra: if it fails, the page still works.
          apiRequest("/student/requests", { signal: controller.signal }).catch(() => null),
        ]);
        if (controller.signal.aborted) return;
        setData(result);
        setPendingCount(requests ? requests.requests.filter(r => r.status === "pending").length : null);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }
    load();
    return () => controller.abort();
  }, [attempt]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  if (!section) return <Navigate to="/student" replace />;

  const clock = bangkokNow(new Date(now));
  const todayLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Bangkok" }).format(new Date(now));

  // At most one banner, shown above the page heading (GOV.UK guidance).
  const urgent = data ? urgentDeadline(upcomingDeadlines(data.registrations, now)) : null;

  let content;
  if (error) {
    content = <section className="dashboard-section" role="alert">
      <h2>We couldn't load your records</h2><p>{error}</p>
      <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
    </section>;
  } else if (!data) {
    content = <p role="status" className="muted-text">Loading your student records…</p>;
  } else {
    const plan = planForNow(buildTimetable(data.registrations).events, clock);
    const deadlines = upcomingDeadlines(data.registrations, now);
    const refresh = () => setAttempt(value => value + 1);
    if (section.key === "overview") content = <StudentOverview data={data} plan={plan} pendingCount={pendingCount} today={todayLabel} minutesNow={clock.minutes} deadlines={deadlines} />;
    if (section.key === "timetable") content = <WeeklyTimetable registrations={data.registrations} today={clock.day} />;
    if (section.key === "courses") content = <StudentCourses data={data} now={now} />;
    if (section.key === "grades") content = <StudentGrades data={data} />;
    if (section.key === "requests") content = <>
      <AddDropRequests onChanged={refresh}
        initialChoice={searchParams.get("course") ? { courseCode: searchParams.get("course"), section: searchParams.get("section") } : null} />
      <section className="dashboard-section">
        <h2>Need help?</h2>
        <p className="muted-text">{data.advisor ? <>Your advisor is <strong>{data.advisor.name}</strong> (<a href={`mailto:${data.advisor.email}`}>{data.advisor.email}</a>).</> : "Contact your department to arrange an advisor."} If your department asks for a signed form, you can also <a href="/forms/add-drop-request.pdf" download>download the PDF</a>.</p>
      </section>
    </>;
  }

  return <div className="student-layout">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className="student-nav-area">
      <div className="student-brand"><span className="portal-symbol" aria-hidden="true">C</span><span>Course Portal</span></div>
      <nav aria-label="Student sections" className="student-nav">
        {SECTIONS.map(s => <NavLink key={s.key} to={s.path} end className={({ isActive }) => `student-nav-link${isActive ? " active" : ""}`}>
          <span className="nav-label"><Icon name={s.icon} />{s.label}</span>{s.key === "requests" && pendingCount > 0 && <span className="nav-count" aria-label={`${pendingCount} pending`}>{pendingCount}</span>}
        </NavLink>)}
      </nav>
      {data && <div className="student-identity">
        <span className="avatar" aria-hidden="true">{data.student.name.trim().charAt(0).toUpperCase()}</span>
        <span><strong>{data.student.name}</strong><small>{data.student.studentId}</small></span>
      </div>}
      <button type="button" className="student-logout" onClick={logout}><Icon name="logout" /> Log out</button>
    </aside>

    <main className="student-main" id="main-content" tabIndex={-1}>
      {urgent && section.key !== "requests" && <DeadlineBanner deadline={urgent} />}
      <header className="student-page-header">
        {section.key === "overview"
          ? <><p className="eyebrow">Student workspace</p><h1>{greeting(clock.minutes)}{data ? `, ${data.student.name.split(" ")[0]}` : ""}.</h1>
            <p className="muted-text">Here's what's happening with your studies.</p></>
          : <><p className="eyebrow">Student workspace</p><h1>{section.title}</h1></>}
      </header>
      {content}
    </main>
  </div>;
}
