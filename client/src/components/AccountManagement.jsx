import { useEffect, useState } from "react";
import { apiRequest } from "../api.js";

const clean = { name: "", email: "", password: "", role: "student", studentId: "", advisor: "", active: true };
export default function AccountManagement({ onChanged }) {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(clean);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const reload = async () => {
    const r = await apiRequest("/admin/users");
    setUsers(r.users || []);
  };
  useEffect(() => {
    let cancelled = false;
    apiRequest("/admin/users").then(r => { if (!cancelled) setUsers(r.users || []); })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  function edit(u) {
    setEditing(u.id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role,
      studentId: u.studentId || "", advisor: u.advisor?.id || "", active: u.active });
    setError(""); setMessage("");
  }
  function reset() { setEditing(null); setForm(clean); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (editing) {
        const original = users.find(u => u.id === editing);
        if (original?.active === true && form.active === false &&
            !window.confirm(`Deactivate ${original.name} (${original.role})? Academic history will be preserved.`)) {
          return;
        }
      }
      const body = { ...form };
      if (body.role !== "student") { delete body.studentId; delete body.advisor; }
      if (!body.password) delete body.password;
      if (!editing && !body.password) throw Error("Password is required to create a new account.");
      if (editing) {
        await apiRequest("/admin/users/" + editing, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiRequest("/admin/users", { method: "POST", body: JSON.stringify(body) });
      }
      await reload();
      onChanged?.();
      reset(); setMessage("Account saved successfully.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function deactivate(u) {
    if (!window.confirm("Deactivate " + u.name + " (" + u.role + ")? Existing academic history will be preserved.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await apiRequest("/admin/users/" + u.id, { method: "DELETE" });
      await reload();
      onChanged?.();
      setMessage("Account deactivated; records preserved.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const query = search.trim().toLowerCase();
  const filtered = (roleFilter === "all" ? users : users.filter(u => u.role === roleFilter))
    .filter(u => !query || [u.name, u.email, u.studentId].some(v => String(v || "").toLowerCase().includes(query)));
  const advisors = users.filter(u => u.role === "advisor" && u.active);
  return <section className="dashboard-section">
    <h2>Manage all user accounts</h2>
    <p className="muted-text">Create students, advisors or administrators. Edit account details and safely deactivate unused accounts.</p>
    {error && <p role="alert" className="message-error">{error}</p>}
    {message && <p role="status" className="message-success">{message}</p>}
    <form onSubmit={save} className="form-card">
      <h3>{editing ? "Edit account" : "Create account"}</h3>
      <div className="management-grid">
        <label>Name <input required maxLength="100" value={form.name}
          onChange={e => set("name", e.target.value)}/></label>
        <label>Email <input required type="email" value={form.email}
          onChange={e => set("email", e.target.value)}/></label>
        <label>Role <select value={form.role} onChange={e => set("role", e.target.value)}>
          <option value="student">Student</option><option value="advisor">Advisor</option>
          <option value="admin">Admin</option>
        </select></label>
        <label>{editing ? "New password (optional)" : "Initial password"} <input type="password"
          minLength="8" required={!editing} value={form.password}
          onChange={e => set("password", e.target.value)}/></label>
        {form.role === "student" && <>
          <label>Student ID <input required value={form.studentId}
            onChange={e => set("studentId", e.target.value)}/></label>
          <label>Assigned advisor <select required value={form.advisor}
            onChange={e => set("advisor", e.target.value)}>
            <option value="">Select advisor</option>
            {advisors.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select></label>
        </>}
        {editing && <label>Status <select value={String(form.active)}
          onChange={e => set("active", e.target.value === "true")}>
          <option value="true">Active</option><option value="false">Inactive</option>
        </select></label>}
      </div>
      <div className="form-actions"><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create account"}</button>
        {editing && <button type="button" disabled={busy} onClick={reset}>Cancel edit</button>}</div>
    </form>
    <div className="toolbar">
      <div className="search-box">
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <label className="visually-hidden" htmlFor="account-search">Search accounts</label>
        <input id="account-search" type="search" placeholder="Search by name, email or student ID" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="segmented" aria-label="Filter by role">
        {[["all", "All"], ["student", "Students"], ["advisor", "Advisors"], ["admin", "Admins"]].map(([value, label]) =>
          <button key={value} type="button" aria-pressed={roleFilter === value} onClick={() => setRoleFilter(value)}>{label}</button>)}
      </div>
    </div>
    <div className="student-table-wrapper"><table className="student-table responsive-table"><thead><tr>
      <th>Name</th><th>Email</th><th>Role</th><th>Student ID</th><th>Advisor</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody>{filtered.map(u => <tr key={u.id}>
      <td data-label="Name"><strong>{u.name}</strong></td><td data-label="Email">{u.email}</td><td data-label="Role" style={{ textTransform: "capitalize" }}>{u.role}</td><td data-label="Student ID">{u.studentId || "—"}</td>
      <td data-label="Advisor">{u.advisor?.name || "—"}</td>
      <td data-label="Status"><span className={`status-pill ${u.active ? "status-active" : "status-inactive"}`}>{u.active ? "Active" : "Inactive"}</span></td><td data-label="Actions">
        <div className="actions-cell">
          <button type="button" disabled={busy} onClick={() => edit(u)}>Edit</button>
          {u.active && <button type="button" className="danger-button" disabled={busy}
            onClick={() => deactivate(u)}>Deactivate</button>}
        </div>
      </td></tr>)}
      {filtered.length === 0 && <tr><td colSpan="7">{query ? `No accounts match “${search}”.` : "No accounts in this role."}</td></tr>}
    </tbody></table></div>
  </section>;
}
