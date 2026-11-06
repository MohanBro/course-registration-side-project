import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api.js";
import AccountManagement from "../components/AccountManagement.jsx";
import AppShell, { PageHeader } from "../components/AppShell.jsx";
import Icon from "../components/Icon.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

// The sections of the admin workspace, each with its own address.
const SECTIONS = [
  { key: "overview", path: "/admin", label: "Overview", title: "Overview", icon: "home" },
  { key: "accounts", path: "/admin/accounts", label: "Accounts", title: "Accounts", icon: "user" },
  { key: "students", path: "/admin/students", label: "Students", title: "Students", icon: "users" },
  { key: "advisors", path: "/admin/advisors", label: "Advisors", title: "Advisors", icon: "award" },
  { key: "courses", path: "/admin/courses", label: "Courses", title: "Courses", icon: "book" },
  { key: "sections", path: "/admin/sections", label: "Sections", title: "Sections", icon: "grid" },
];

const statusPill = active => <span className={`status-pill ${active ? "status-active" : "status-inactive"}`}>{active ? "Active" : "Inactive"}</span>;

function AdminDashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const section = SECTIONS.find(s => s.key === (params["*"] || "overview"));
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
const [createLoading, setCreateLoading] = useState(false);
const [createError, setCreateError] = useState("");
const [createSuccess, setCreateSuccess] = useState("");
const [editingStudent, setEditingStudent] = useState(null);
const [editLoading, setEditLoading] = useState(false);
const [editError, setEditError] = useState("");
const [editSuccess, setEditSuccess] = useState("");

const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  studentId: "",
  advisor: "",
});

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

const [sections, setSections] = useState([]);
const [sectionsLoading, setSectionsLoading] = useState(true);
const [sectionsError, setSectionsError] = useState("");



 useEffect(() => {
    async function loadUsers() {
      try {
        const result = await apiRequest("/admin/users");
        setUsers(result.users || []);
      } catch (err) {
        setError(err.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    async function loadCourses() {
      try {
        const result = await apiRequest("/admin/courses");
        setCourses(result.courses || []);
      } catch (err) {
        setCoursesError(err.message || "Failed to load courses.");
      } finally {
        setCoursesLoading(false);
      }
    }

    loadCourses();
  }, []);


useEffect(() => {
  async function loadSections() {
    try {
      const result = await apiRequest("/admin/sections");
      setSections(result.sections || []);
    } catch (err) {
      setSectionsError(err.message || "Failed to load sections.");
    } finally {
      setSectionsLoading(false);
    }
  }

  loadSections();
}, []);


async function reloadSections() {
  setSectionsLoading(true);
  setSectionsError("");
  try {
    const result = await apiRequest("/admin/sections");
    setSections(result.sections || []);
  } catch (err) {
    setSectionsError(err.message || "Failed to load sections.");
  } finally {
    setSectionsLoading(false);
  }
}

async function reloadUsers() {
  setLoading(true);
  setError("");

  try {
    const result = await apiRequest("/admin/users");
    setUsers(result.users || []);
  } catch (err) {
    setError(err.message || "Failed to load users.");
  } finally {
    setLoading(false);
  }
}



async function handleCreateStudent(event) {
  event.preventDefault();
  setCreateLoading(true);
  setCreateError("");
  setCreateSuccess("");

  try {
    await apiRequest("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        ...formData,
        role: "student",
      }),
    });

    setCreateSuccess("Student created successfully.");
    setFormData({
      name: "",
      email: "",
      password: "",
      studentId: "",
      advisor: "",
    });
    setShowCreateForm(false);
    await reloadUsers();
  } catch (err) {
    setCreateError(err.message || "Failed to create student.");
  } finally {
    setCreateLoading(false);
  }
}

async function handleEditStudent(event) {
  event.preventDefault();
  if (!editingStudent) return;

  setEditLoading(true);
  setEditError("");
  setEditSuccess("");

  try {
    await apiRequest(`/admin/users/${editingStudent.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: editingStudent.name,
      }),
    });

    setEditSuccess("Student updated successfully.");
    setEditingStudent(null);
    await reloadUsers();
  } catch (err) {
    setEditError(err.message || "Failed to update student.");
  } finally {
    setEditLoading(false);
  }
}

async function handleDeactivateStudent(student) {
  const confirmed = window.confirm(
    `Deactivate ${student.name} (${student.studentId})?`
  );

  if (!confirmed) return;

  setEditError("");
  setEditSuccess("");

  try {
    await apiRequest(`/admin/users/${student.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        active: false,
      }),
    });

    setEditSuccess("Student deactivated successfully.");
    await reloadUsers();
  } catch (err) {
    setEditError(err.message || "Failed to deactivate student.");
  }
}

const user = JSON.parse(localStorage.getItem("user") || "{}");

const students = users.filter(
  (item) => item.role === "student"
);

const advisors = users.filter(
  (item) => item.role === "advisor"
);




function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/", { replace: true });
}

usePageTitle(section ? section.title : null);
if (!section) return <Navigate to="/admin" replace />;

const query = search.trim().toLowerCase();
const matches = (...values) => !query || values.some(v => String(v || "").toLowerCase().includes(query));
const visibleStudents = students.filter(s => matches(s.name, s.email, s.studentId, s.advisor?.name));
const inactiveCount = users.filter(u => !u.active).length;
const unassigned = students.filter(s => s.active && !s.advisor).length;
const searchBox = (label, placeholder) => <div className="search-box">
  <Icon name="search" />
  <label className="visually-hidden" htmlFor="admin-search">{label}</label>
  <input id="admin-search" type="search" placeholder={placeholder} value={search} onChange={e => setSearch(e.target.value)} />
</div>;

let content = null;

if (section.key === "overview") {
  const stats = [
    { label: "Students", value: loading ? "–" : students.length, note: loading ? "Loading…" : `${students.filter(s => s.active).length} active`, to: "/admin/students", icon: "users" },
    { label: "Advisors", value: loading ? "–" : advisors.length, note: "Assigned to students", to: "/admin/advisors", icon: "award" },
    { label: "Courses", value: coursesLoading ? "–" : courses.length, note: "In the catalogue", to: "/admin/courses", icon: "book" },
    { label: "Sections", value: sectionsLoading ? "–" : sections.length, note: "Offered this term", to: "/admin/sections", icon: "grid" },
  ];
  content = <>
    {error && <p role="alert" className="message-error">Unable to load users: {error}</p>}
    <ul className="stat-grid" aria-label="Key numbers">
      {stats.map(s => <li key={s.label}><Link className="stat-card" to={s.to}>
        <span className="stat-label"><Icon name={s.icon} />{s.label}</span>
        <strong className="stat-value">{s.value}</strong><span className="stat-note">{s.note}</span>
      </Link></li>)}
    </ul>
    <div className="overview-grid">
      <section className="dashboard-section" aria-labelledby="attention-title">
        <h2 id="attention-title">Needs attention</h2>
        {loading ? <p role="status" className="muted-text">Loading accounts…</p>
          : inactiveCount === 0 && unassigned === 0 ? <p className="muted-text"><Icon name="check" /> All accounts look good.</p>
          : <ul className="upcoming-list">
            {unassigned > 0 && <li><span className="upcoming-date">{unassigned}</span><span>Active {unassigned === 1 ? "student has" : "students have"} no advisor</span></li>}
            {inactiveCount > 0 && <li><span className="upcoming-date">{inactiveCount}</span><span>Inactive {inactiveCount === 1 ? "account" : "accounts"} (records kept)</span></li>}
          </ul>}
        <Link className="text-link" to="/admin/accounts">Manage accounts <Icon name="arrow" /></Link>
      </section>
      <div className="overview-side">
        <section className="dashboard-section" aria-labelledby="quick-title">
          <h2 id="quick-title">Quick actions</h2>
          <div className="quick-actions">
            <Link className="button-link primary" to="/admin/accounts">Create an account</Link>
            <Link className="button-link" to="/admin/students">Find a student</Link>
            <Link className="button-link" to="/admin/sections">View sections</Link>
          </div>
        </section>
      </div>
    </div>
  </>;
}

if (section.key === "accounts") content = <AccountManagement onChanged={reloadUsers} />;

if (section.key === "students") content = <section className="dashboard-section" aria-labelledby="students-title">
  <h2 id="students-title" className="visually-hidden">Student list</h2>
  <div className="toolbar">
    {searchBox("Search students", "Search by name, ID, email or advisor")}
    <button type="button" className="primary-button" onClick={() => {
      setEditingStudent(null); setCreateError(""); setCreateSuccess(""); setShowCreateForm(true);
    }}><Icon name="plus" /> Create student</button>
  </div>
  {editError && <p role="alert" className="message-error">{editError}</p>}
  {editSuccess && <p role="status" className="message-success">{editSuccess}</p>}
  {createError && <p role="alert" className="message-error">{createError}</p>}
  {createSuccess && <p role="status" className="message-success">{createSuccess}</p>}

  {editingStudent && <form className="form-card" onSubmit={handleEditStudent}>
    <h3>Edit {editingStudent.studentId}</h3>
    <div className="management-grid">
      <label>Student name
        <input required maxLength={100} value={editingStudent.name}
          onChange={(event) => setEditingStudent({ ...editingStudent, name: event.target.value })} />
      </label>
    </div>
    <div className="form-actions">
      <button type="submit" className="primary-button" disabled={editLoading}>{editLoading ? "Saving…" : "Save changes"}</button>
      <button type="button" disabled={editLoading} onClick={() => setEditingStudent(null)}>Cancel</button>
    </div>
  </form>}

  {showCreateForm && <form className="form-card" onSubmit={handleCreateStudent}>
    <h3>New student</h3>
    <div className="management-grid">
      <label>Name<input required maxLength={100} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></label>
      <label>Email<input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></label>
      <label>Student ID<input required value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} /></label>
      <label>Initial password<input required type="password" minLength={8} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></label>
      <label>Advisor
        <select required value={formData.advisor} onChange={(e) => setFormData({ ...formData, advisor: e.target.value })}>
          <option value="">Select an advisor</option>
          {advisors.filter((advisor) => advisor.active).map((advisor) =>
            <option key={advisor.id} value={advisor.id}>{advisor.name} ({advisor.email})</option>)}
        </select>
      </label>
    </div>
    <div className="form-actions">
      <button type="submit" className="primary-button" disabled={createLoading}>{createLoading ? "Creating…" : "Save student"}</button>
      <button type="button" disabled={createLoading} onClick={() => {
        setShowCreateForm(false); setCreateError(""); setCreateSuccess("");
        setFormData({ name: "", email: "", password: "", studentId: "", advisor: "" });
      }}>Cancel</button>
    </div>
  </form>}

  <div className="student-table-wrapper">
    <table className="student-table responsive-table">
      <thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Advisor</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan="6">Loading students…</td></tr>}
        {!loading && error && <tr><td colSpan="6">Unable to load users: {error}</td></tr>}
        {!loading && !error && visibleStudents.map((student) => <tr key={student.id}>
          <td data-label="Student ID"><strong>{student.studentId || "—"}</strong></td>
          <td data-label="Name">{student.name}</td>
          <td data-label="Email">{student.email}</td>
          <td data-label="Advisor">{student.advisor?.name || <span className="status-pill status-warning">Not assigned</span>}</td>
          <td data-label="Status">{statusPill(student.active)}</td>
          <td data-label="Actions"><div className="actions-cell">
            <button type="button" onClick={() => {
              setShowCreateForm(false); setCreateError(""); setCreateSuccess(""); setEditError(""); setEditSuccess("");
              setEditingStudent({ id: student.id, name: student.name, studentId: student.studentId });
            }}>Edit</button>
            {student.active && student.id !== user.id &&
              <button type="button" className="danger-button" onClick={() => handleDeactivateStudent(student)}>Deactivate</button>}
          </div></td>
        </tr>)}
        {!loading && !error && visibleStudents.length === 0 &&
          <tr><td colSpan="6">{students.length ? `No students match “${search}”.` : "No students found."}</td></tr>}
      </tbody>
    </table>
  </div>
</section>;

if (section.key === "advisors") content = <section className="dashboard-section" aria-labelledby="advisors-title">
  <h2 id="advisors-title">Advisors and their students</h2>
  <div className="student-table-wrapper">
    <table className="student-table">
      <thead><tr><th>Name</th><th>Email</th><th>Students</th><th>Status</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan="4">Loading advisors…</td></tr>}
        {!loading && advisors.map((advisor) => <tr key={advisor.id}>
          <td><strong>{advisor.name}</strong></td>
          <td>{advisor.email}</td>
          <td>{students.filter((student) => student.advisor?.id === advisor.id).length}</td>
          <td>{statusPill(advisor.active)}</td>
        </tr>)}
        {!loading && advisors.length === 0 && <tr><td colSpan="4">No advisors found.</td></tr>}
      </tbody>
    </table>
  </div>
</section>;

if (section.key === "courses") content = <section className="dashboard-section" aria-labelledby="courses-title">
  <h2 id="courses-title">Course catalogue</h2>
  <div className="student-table-wrapper">
    <table className="student-table">
      <thead><tr><th>Code</th><th>Title</th><th>Credits</th></tr></thead>
      <tbody>
        {coursesLoading && <tr><td colSpan="3">Loading courses…</td></tr>}
        {!coursesLoading && coursesError && <tr><td colSpan="3">Unable to load courses: {coursesError}</td></tr>}
        {!coursesLoading && !coursesError && courses.map((course) => <tr key={course.id}>
          <td><strong>{course.code}</strong></td><td>{course.title}</td><td>{course.credits}</td>
        </tr>)}
        {!coursesLoading && !coursesError && courses.length === 0 && <tr><td colSpan="3">No courses found.</td></tr>}
      </tbody>
    </table>
  </div>
</section>;

if (section.key === "sections") content = <section className="dashboard-section" aria-labelledby="sections-title">
  <h2 id="sections-title">Sections this term</h2>
  <div className="student-table-wrapper">
    <table className="student-table">
      <thead><tr><th>Course</th><th>Section</th><th>Room</th><th>Instructor</th></tr></thead>
      <tbody>
        {sectionsLoading && <tr><td colSpan="4">Loading sections…</td></tr>}
        {!sectionsLoading && sectionsError && <tr><td colSpan="4">Unable to load sections: {sectionsError}</td></tr>}
        {!sectionsLoading && !sectionsError && sections.map((row) => <tr key={row.id}>
          <td><strong>{row.courseCode}</strong></td><td>{row.section}</td><td>{row.room}</td><td>{row.instructor}</td>
        </tr>)}
        {!sectionsLoading && !sectionsError && sections.length === 0 && <tr><td colSpan="4">No sections found.</td></tr>}
      </tbody>
    </table>
  </div>
</section>;

// Refresh the lists a page depends on when you open it (as the old menu did).
const items = SECTIONS.map(s => ({ key: s.key, to: s.path, label: s.label, icon: s.icon,
  onClick: () => {
    setSearch("");
    if (["overview", "students", "advisors"].includes(s.key)) void reloadUsers();
    if (s.key === "sections") void reloadSections();
  } }));

return <AppShell items={items} workspace="Admin" onLogout={handleLogout}
  person={{ name: user.name || "Administrator", detail: user.email || "Admin" }}>
  <PageHeader eyebrow="Admin workspace" title={section.key === "overview" ? `Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}.` : section.title}
    description={section.key === "overview" ? "Accounts, courses and sections at a glance." : null} />
  {content}
</AppShell>;
}

export default AdminDashboard;
