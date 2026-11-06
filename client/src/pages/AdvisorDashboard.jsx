import AddDropRequests from "../components/AddDropRequests.jsx";

import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api.js";
import OfferingManagement from "../components/OfferingManagement.jsx";
import AppShell, { PageHeader } from "../components/AppShell.jsx";
import Icon from "../components/Icon.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { gradeTone } from "../utils/studentDashboard.js";

// The sections of the advisor workspace, each with its own address.
const SECTIONS = [
  { key: "overview", path: "/advisor", label: "Overview", title: "Overview", icon: "home" },
  { key: "requests", path: "/advisor/requests", label: "Requests", title: "Requests", icon: "inbox" },
  { key: "students", path: "/advisor/students", label: "My students", title: "My students", icon: "users" },
  { key: "offerings", path: "/advisor/offerings", label: "Offerings", title: "Offerings", icon: "layers" },
];

const bangkokDate = value => new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok",
}).format(new Date(value));

const emptyRegistrationData = {
  registrations: [],
  offerings: [],
  loading: false,
  error: "",
};

function formatSchedule(meetings) {
  if (!Array.isArray(meetings) || meetings.length === 0) {
    return "No schedule listed";
  }

  return meetings
    .map(
      (meeting) =>
        `${meeting.day} ${meeting.startTime}-${meeting.endTime}`
    )
    .join(", ");
}

async function fetchRegistrationData(studentId) {
  const id = encodeURIComponent(studentId);

  const [registrationResponse, offeringResponse] = await Promise.all([
    apiRequest(`/advisor/students/${id}/registrations`),
    apiRequest(`/advisor/students/${id}/offerings`),
  ]);

  return {
    registrations: registrationResponse.registrations || [],
    offerings: offeringResponse.offerings || [],
    loading: false,
    error: "",
  };
}

export default function AdvisorDashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const sectionKey = params["*"] || "overview";
  const section = SECTIONS.find(s => s.key === sectionKey);
  const [search, setSearch] = useState("");
  const [detailTab, setDetailTab] = useState("registrations");
  // Small summary for the Overview page and the Requests badge.
  const [summary, setSummary] = useState({ pending: [], pendingCount: null, offerings: null });
  const [summaryVersion, setSummaryVersion] = useState(0);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [offeringRevision, setOfferingRevision] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [result, setResult] = useState({
    studentId: null,
    history: [],
    loading: false,
    error: "",
  });

  const [registrationData, setRegistrationData] = useState(
    emptyRegistrationData
  );
  const [pendingAction, setPendingAction] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [windowDates, setWindowDates] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await apiRequest("/advisor/students", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setStudents(data.students || []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setStudentsError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setStudentsLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;

    const controller = new AbortController();
    const studentId = selectedStudent.id;

    async function load() {
      try {
        const data = await apiRequest(
          `/advisor/students/${encodeURIComponent(studentId)}/history`,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setResult({
            studentId,
            history: data.history || [],
            loading: false,
            error: "",
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            studentId,
            history: [],
            loading: false,
            error: error.message,
          });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [selectedStudent]);

  useEffect(() => {
    if (!selectedStudent) return;

    let cancelled = false;

    fetchRegistrationData(selectedStudent.id)
      .then((data) => {
        if (!cancelled) setRegistrationData(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setRegistrationData({
            ...emptyRegistrationData,
            error: error.message,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStudent]);

  function selectStudent(student) {
    if (selectedStudent?.id === student.id) return;
    setSelectedStudent(student);
    setResult({ studentId: student.id, history: [], loading: true, error: "" });
    setRegistrationData({ ...emptyRegistrationData, loading: true });
    setActionMessage("");
    setActionError("");
  }

  async function refreshRegistrationData(studentId) {
    setOfferingRevision(value => value + 1);
    const data = await fetchRegistrationData(studentId);
    setRegistrationData(data);
  }

  async function handleRegister(offeringId) {
    if (!selectedStudent || pendingAction) return;

    const offering = registrationData.offerings.find(row => row.id === offeringId);
    if (!offering?.eligible) return;
    if (!window.confirm(
      `Register ${selectedStudent.name} (${selectedStudent.studentId}) for ${offering.courseCode} Section ${offering.section} in ${offering.term}?`
    )) return;

    const studentId = selectedStudent.id;
    setPendingAction(offeringId);
    setActionMessage("");
    setActionError("");

    try {
      await apiRequest(
        `/advisor/students/${encodeURIComponent(studentId)}/registrations`,
        {
          method: "POST",
          body: JSON.stringify({ offeringId }),
        }
      );

      setActionMessage("Registration completed successfully.");
      await refreshRegistrationData(studentId);
    } catch (error) {
      setActionError(error.message);

      try {
        await refreshRegistrationData(studentId);
      } catch {
        // Preserve existing data if refreshing fails.
      }
    } finally {
      setPendingAction("");
    }
  }

        async function handleDrop(registrationId, courseLabel) {
    if (!selectedStudent || pendingAction) return;

    const confirmed = window.confirm(
      `Are you sure you want to drop ${courseLabel}?`
    );

    if (!confirmed) return;

    const studentId = selectedStudent.id;
    setPendingAction(registrationId);
    setActionMessage("");
    setActionError("");

    try {
      await apiRequest(
        `/advisor/students/${encodeURIComponent(studentId)}/registrations/${encodeURIComponent(registrationId)}`,
        { method: "DELETE" }
      );

      setActionMessage("Registration dropped successfully.");
      await refreshRegistrationData(studentId);
    } catch (error) {
      setActionError(error.message);

      try {
        await refreshRegistrationData(studentId);
      } catch {
        // Preserve existing data if refreshing fails.
      }
    } finally {
      setPendingAction("");
    }
  }

  async function handleWindow(offering, open) {
    if (!selectedStudent || pendingAction) return;
    const date = windowDates[offering.id];
    if (open && !date) { setActionError("Choose a closing date in Bangkok time first."); return; }
    setPendingAction(`window-${offering.id}`);
    setActionError(""); setActionMessage("");
    try {
      await apiRequest(`/advisor/offerings/${offering.id}/add-drop`, {
        method: "PATCH",
        body: JSON.stringify({ addDropOpen: open,
          ...(open ? { addDropClosesAt: `${date}:00+07:00` } : {}) }),
      });
      setActionMessage(`Add/drop window ${open ? "opened" : "closed"}. This applies to all students in this offering.`);
      await refreshRegistrationData(selectedStudent.id);
    } catch (error) { setActionError(error.message); }
    finally { setPendingAction(""); }
  }

  // Summary for the Overview and the Requests badge. Refreshes after any change.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiRequest("/advisor/requests").catch(() => null),
      apiRequest("/advisor/offerings").catch(() => null),
    ]).then(([requests, offerings]) => {
      if (cancelled) return;
      setSummary({
        pending: (requests?.requests || []).filter(r => r.status === "pending"),
        pendingCount: requests ? requests.pendingCount : null,
        offerings: offerings ? offerings.offerings || [] : null,
      });
    });
    return () => { cancelled = true; };
  }, [summaryVersion, offeringRevision]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }

  // Choosing a student on a narrow screen scrolls down to their details.
  function openStudent(student) {
    selectStudent(student);
    if (window.matchMedia?.("(max-width: 1100px)").matches) {
      setTimeout(() => document.getElementById("student-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  usePageTitle(section ? section.title : null);
  if (!section) return <Navigate to="/advisor" replace />;

  const historyLoading =
    result.loading || result.studentId !== selectedStudent?.id;
  const windowIsOpen = o => o.addDropOpen && (!o.addDropClosesAt || new Date(o.addDropClosesAt).getTime() > now);
  const openWindows = (summary.offerings || []).filter(windowIsOpen)
    .sort((a, b) => new Date(a.addDropClosesAt || 8.64e15) - new Date(b.addDropClosesAt || 8.64e15));
  const query = search.trim().toLowerCase();
  const visibleStudents = students.filter(s => !query ||
    [s.name, s.email, s.studentId].some(v => String(v || "").toLowerCase().includes(query)));
  const terms = [...new Set(result.history.map(r => r.term))].sort().reverse();
  const afterRequestChange = () => {
    setOfferingRevision(value => value + 1);
    setSummaryVersion(value => value + 1);
    if (selectedStudent) void refreshRegistrationData(selectedStudent.id).catch(error => setActionError(error.message));
  };

  let content = null;

  if (section.key === "overview") {
    const stats = [
      { label: "My students", value: studentsLoading ? "–" : students.length, note: studentsLoading ? "Loading…" : `${students.filter(s => s.active).length} active`, to: "/advisor/students", icon: "users" },
      { label: "Pending requests", value: summary.pendingCount ?? "–", note: summary.pendingCount ? "Waiting for your decision" : "Inbox is clear", to: "/advisor/requests", icon: "inbox", tone: summary.pendingCount ? "attention" : "" },
      { label: "Open add/drop windows", value: summary.offerings ? openWindows.length : "–", note: "Students can send requests", to: "/advisor/offerings", icon: "clock" },
      { label: "Course offerings", value: summary.offerings ? summary.offerings.length : "–", note: "This term", to: "/advisor/offerings", icon: "layers" },
    ];
    content = <>
      <ul className="stat-grid" aria-label="Key numbers">
        {stats.map(s => <li key={s.label}><Link className={`stat-card ${s.tone ? `stat-${s.tone}` : ""}`} to={s.to}>
          <span className="stat-label"><Icon name={s.icon} />{s.label}</span>
          <strong className="stat-value">{s.value}</strong><span className="stat-note">{s.note}</span>
        </Link></li>)}
      </ul>
      <div className="overview-grid">
        <section className="dashboard-section" aria-labelledby="waiting-title">
          <h2 id="waiting-title">Waiting for your decision</h2>
          {summary.pending.length === 0 ? <p className="muted-text"><Icon name="check" /> No pending requests. You're all caught up.</p>
            : <ul className="upcoming-list">{summary.pending.slice(0, 5).map(r => <li key={r.id}>
              <span className="upcoming-date">{r.action === "add" ? "Add" : "Drop"}</span>
              <span><strong>{r.student?.name ?? "Student"}</strong> · {r.offering?.courseCode ?? "Course"} section {r.offering?.section ?? "—"}<br />
                <small className="muted-text">Submitted {bangkokDate(r.createdAt)}</small></span>
            </li>)}</ul>}
          <Link className="text-link" to="/advisor/requests">Review requests <Icon name="arrow" /></Link>
        </section>
        <div className="overview-side">
          <section className="dashboard-section" aria-labelledby="quick-title">
            <h2 id="quick-title">Quick actions</h2>
            <div className="quick-actions">
              <Link className="button-link primary" to="/advisor/requests">Review requests</Link>
              <Link className="button-link" to="/advisor/students">Find a student</Link>
              <Link className="button-link" to="/advisor/offerings">Manage offerings</Link>
            </div>
          </section>
          <section className="dashboard-section" aria-labelledby="windows-title">
            <h2 id="windows-title">Open add/drop windows</h2>
            {openWindows.length === 0 ? <p className="muted-text">No windows are open right now.</p>
              : <ul className="upcoming-list">{openWindows.slice(0, 5).map(o => <li key={o.id}>
                <span className="upcoming-date">{o.courseCode}</span>
                <span>Section {o.section} · {o.addDropClosesAt ? `closes ${bangkokDate(o.addDropClosesAt)}` : "no closing date"}</span>
              </li>)}</ul>}
          </section>
        </div>
      </div>
    </>;
  }

  if (section.key === "requests") content = <AddDropRequests advisor onChanged={afterRequestChange} />;

  if (section.key === "offerings") content = <OfferingManagement refreshVersion={offeringRevision} onChanged={() => {
    setSummaryVersion(value => value + 1);
    if (selectedStudent) void refreshRegistrationData(selectedStudent.id).catch(error => setActionError(error.message));
  }} />;

  if (section.key === "students") content = <div className="master-detail">
    <section className="dashboard-section" aria-labelledby="list-title">
      <h2 id="list-title">Assigned students {students.length > 0 && <span className="muted-text">({students.length})</span>}</h2>
      <div className="search-box">
        <Icon name="search" />
        <label className="visually-hidden" htmlFor="student-search">Search students</label>
        <input id="student-search" type="search" placeholder="Search by name, ID or email" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {studentsLoading ? <p role="status" className="muted-text">Loading assigned students…</p>
        : studentsError ? <p role="alert" className="message-error">{studentsError}</p>
        : students.length === 0 ? <p className="muted-text">No students are assigned to you.</p>
        : visibleStudents.length === 0 ? <p className="muted-text">No students match “{search}”.</p>
        : <ul className="person-list">{visibleStudents.map(student => <li key={student.id}>
          <button type="button" className="person-button" aria-current={selectedStudent?.id === student.id}
            onClick={() => openStudent(student)} disabled={Boolean(pendingAction)}>
            <span className="avatar" aria-hidden="true">{student.name.trim().charAt(0).toUpperCase()}</span>
            <span><strong>{student.name}</strong><small>{student.studentId} · {student.email}</small></span>
            {!student.active && <span className="status-pill status-inactive">Inactive</span>}
          </button>
        </li>)}</ul>}
    </section>

    <section className="dashboard-section" id="student-detail" aria-labelledby="detail-title">
      {!selectedStudent ? <div className="portal-empty">
        <strong id="detail-title">Choose a student</strong>
        <p>Pick someone from the list to see their courses, register them or check their grades.</p>
      </div> : <>
        <div className="detail-header">
          <div><h2 id="detail-title">{selectedStudent.name}</h2>
            <p className="muted-text">{selectedStudent.studentId} · <a href={`mailto:${selectedStudent.email}`}>{selectedStudent.email}</a></p></div>
          <span className={`status-pill ${selectedStudent.active ? "status-active" : "status-inactive"}`}>{selectedStudent.active ? "Active" : "Inactive"}</span>
        </div>
        <div className="segmented" role="tablist" aria-label="Student details">
          {[["registrations", "Current courses"], ["register", "Register"], ["history", "Grades"]].map(([key, label]) =>
            <button key={key} type="button" role="tab" aria-selected={detailTab === key} onClick={() => setDetailTab(key)}>{label}</button>)}
        </div>
        {actionMessage && <p role="status" className="message-success" style={{ marginTop: 16 }}>{actionMessage}</p>}
        {actionError && <p role="alert" className="message-error" style={{ marginTop: 16 }}>{actionError}</p>}

        <div role="tabpanel" style={{ marginTop: 18 }}>
          {detailTab === "registrations" && (registrationData.loading ? <p role="status" className="muted-text">Loading registrations…</p>
            : registrationData.error ? <p role="alert" className="message-error">{registrationData.error}</p>
            : registrationData.registrations.length === 0 ? <div className="portal-empty"><strong>No current registrations</strong>
                <p>Use the Register tab to add a course.</p></div>
            : <div className="offer-list">{registrationData.registrations.map(registration => {
              const offering = registration.offering || {};
              return <article className="offer-card" key={registration.id}>
                <div>
                  <strong className="course-code">{offering.courseCode || "—"} · Section {offering.section || "—"}</strong>
                  <h3>{offering.courseTitle || "—"}</h3>
                  <p className="meta">{formatSchedule(offering.meetings)} · {offering.room || "Room to be confirmed"}</p>
                  <p className="meta">{offering.instructor || "Instructor not specified"} · {offering.credits ?? "—"} credits · Term {offering.term || "—"}</p>
                </div>
                <div className="actions">
                  <button type="button" className="danger-button" disabled={Boolean(pendingAction)}
                    onClick={() => handleDrop(registration.id, `${offering.courseCode} — ${offering.courseTitle}`)}>
                    {pendingAction === registration.id ? "Dropping…" : "Drop course"}
                  </button>
                </div>
              </article>;
            })}</div>)}

          {detailTab === "register" && (registrationData.loading ? <p role="status" className="muted-text">Loading available offerings…</p>
            : registrationData.error ? <p role="alert" className="message-error">{registrationData.error}</p>
            : registrationData.offerings.length === 0 ? <div className="portal-empty"><strong>No current offerings</strong><p>Create offerings in the Offerings section.</p></div>
            : <div className="offer-list">{registrationData.offerings.map(offering => {
              const open = windowIsOpen(offering);
              return <article className="offer-card" key={offering.id}>
                <div>
                  <strong className="course-code">{offering.courseCode} · Section {offering.section}</strong>
                  <h3>{offering.courseTitle}{offering.retakeRequired && <span className="status-pill status-warning" style={{ marginLeft: 8 }}>Retake</span>}</h3>
                  <p className="meta">{formatSchedule(offering.meetings)} · {offering.room || "Room to be confirmed"} · {offering.instructor || "Instructor not specified"}</p>
                  <p className="meta">{offering.seatsRemaining ?? "—"} of {offering.capacity ?? "—"} seats left · {offering.credits} credits · Term {offering.term}</p>
                  <p style={{ margin: "8px 0 0" }}>
                    <span className={`status-pill ${offering.eligible ? "status-active" : "status-danger"}`}>{offering.eligible ? "Eligible" : offering.reason || "Registration unavailable"}</span>{" "}
                    <span className={`status-pill ${open ? "status-info" : "status-inactive"}`}>Add/drop {open ? "open" : "closed"}</span>
                  </p>
                </div>
                <div className="actions">
                  <button type="button" className="primary-button" onClick={() => handleRegister(offering.id)}
                    disabled={!offering.eligible || Boolean(pendingAction) || !selectedStudent.active}>
                    {pendingAction === offering.id ? "Registering…" : "Register"}
                  </button>
                </div>
                <div className="window-controls">
                  <label htmlFor={`window-${offering.id}`}>New closing date (Bangkok time)
                    <input id={`window-${offering.id}`} type="datetime-local" value={windowDates[offering.id] || ""}
                      disabled={Boolean(pendingAction)}
                      onChange={event => setWindowDates(values => ({ ...values, [offering.id]: event.target.value }))} />
                  </label>
                  <button type="button" disabled={Boolean(pendingAction)} onClick={() => handleWindow(offering, true)}>{open ? "Update window" : "Open window"}</button>
                  <button type="button" disabled={Boolean(pendingAction) || !offering.addDropOpen} onClick={() => handleWindow(offering, false)}>Close window</button>
                  <small>{offering.addDropClosesAt ? `Currently closes ${bangkokDate(offering.addDropClosesAt)} (Bangkok). ` : "No closing date set. "}Changes apply to every student in this offering.</small>
                </div>
              </article>;
            })}</div>)}

          {detailTab === "history" && (historyLoading ? <p role="status" className="muted-text">Loading grades…</p>
            : result.error ? <p role="alert" className="message-error">{result.error}</p>
            : result.history.length === 0 ? <div className="portal-empty"><strong>No grades yet</strong><p>This student has no recorded results.</p></div>
            : terms.map(term => {
              const rows = result.history.filter(r => r.term === term);
              return <div className="term-block" key={term}>
                <div className="term-heading"><h3>Term {term}</h3></div>
                <ul className="grade-list">{rows.map(record => {
                  const tone = gradeTone(record.grade);
                  return <li key={record.id}>
                    <span><strong>{record.courseCode}</strong> {record.courseTitle}</span>
                    <span className="grade-credits">{record.credits ?? "—"} cr</span>
                    <span className={`grade-badge grade-${tone}`}>{record.grade}</span>
                  </li>;
                })}</ul>
              </div>;
            }))}
        </div>
      </>}
    </section>
  </div>;

  const items = SECTIONS.map(s => ({ key: s.key, to: s.path, label: s.label, icon: s.icon,
    badge: s.key === "requests" ? summary.pendingCount : 0 }));
  return <AppShell items={items} workspace="Advisor" onLogout={handleLogout}
    person={{ name: user.name || "Advisor", detail: user.email || "Advisor" }}>
    <PageHeader eyebrow="Advisor workspace" title={section.key === "overview" ? `Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}.` : section.title}
      description={section.key === "overview" ? "Requests, students and offerings at a glance." : null} />
    {content}
  </AppShell>;
}
