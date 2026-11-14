import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";

// The layout shared by the student, advisor and admin workspaces, drawn as a desk:
// a header on the green desk blotter, manila folder tabs for the sections (a bar
// along the bottom on phones) and the open folder holding the page.
//
// items: [{ key, to, label, icon, badge, end, onClick }]
// person: { name, detail }  (detail = student ID, "Advisor", ...)
export default function AppShell({ items, person, workspace, onLogout, children }) {
  const [finding, setFinding] = useState(false);
  const [clock, setClock] = useState(() => deskTime());
  const findButton = useRef(null);

  // The desk clock (Bangkok time, like the rest of the portal).
  useEffect(() => {
    const timer = setInterval(() => setClock(deskTime()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Ctrl+K (Cmd+K on a Mac) opens "Find a page".
  useEffect(() => {
    function onKey(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setFinding(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function closeFinder() {
    setFinding(false);
    findButton.current?.focus();
  }

  return <div className="desk">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="desk-head">
      <div className="app-brand">
        <span className="portal-symbol" aria-hidden="true" />
        <span className="app-brand-text">Course Portal<small>{workspace} desk</small></span>
      </div>
      <div className="desk-tools">
        <span className="desk-clock" aria-hidden="true">{clock}</span>
        <button type="button" className="desk-btn desk-find" ref={findButton} aria-keyshortcuts="Control+K Meta+K" onClick={() => setFinding(true)}>
          <Icon name="search" /><span className="find-text">Find a page</span><kbd aria-hidden="true">Ctrl K</kbd>
        </button>
        {person?.name && <div className="app-identity">
          <span className="avatar" aria-hidden="true">{person.name.trim().charAt(0).toUpperCase()}</span>
          <span><strong>{person.name}</strong><small>{person.detail}</small></span>
        </div>}
        <button type="button" className="desk-btn app-logout" onClick={onLogout} aria-label="Log out" title="Log out"><Icon name="logout" /></button>
      </div>
    </header>
    <nav aria-label={`${workspace} sections`} className="tabs-nav">
      {items.map(item => <NavLink key={item.key} to={item.to} end={item.end ?? true} onClick={item.onClick}
        className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`}>
        <span className="nav-label"><Icon name={item.icon} />{item.label}</span>
        {item.badge > 0 && <span className="nav-count" aria-label={`${item.badge} waiting`}>{item.badge}</span>}
      </NavLink>)}
    </nav>
    <main className="app-main" id="main-content" tabIndex={-1}>{children}</main>
    {finding && <Finder items={items} onClose={closeFinder} />}
  </div>;
}

// "Fri 13 Nov, 15:47" in Bangkok time.
function deskTime() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
  }).format(new Date());
}

// "Find a page": type part of a section name, move with the arrow keys, press Enter.
function Finder({ items, onClose }) {
  const dialog = useRef(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const shown = items.filter(item => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const current = Math.min(active, Math.max(0, shown.length - 1));

  useEffect(() => { dialog.current.showModal(); }, []);

  function open(item) {
    if (!item) return;
    onClose();
    item.onClick?.();
    navigate(item.to);
  }
  function onKeyDown(event) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((current + 1) % Math.max(1, shown.length)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((current - 1 + shown.length) % Math.max(1, shown.length)); }
    if (event.key === "Enter") { event.preventDefault(); open(shown[current]); }
  }

  return <dialog ref={dialog} className="desk-dialog" aria-labelledby="finder-title" onClose={onClose}
    onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
    <div className="desk-dialog-head"><h2 id="finder-title">Find a page</h2></div>
    <div className="desk-dialog-body">
      <label className="visually-hidden" htmlFor="finder-input">Page name</label>
      <input id="finder-input" className="finder-input" type="search" autoComplete="off" placeholder="Type a page name"
        role="combobox" aria-expanded="true" aria-controls="finder-list" aria-autocomplete="list"
        aria-activedescendant={shown.length ? `finder-${current}` : undefined}
        value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={onKeyDown} />
      <ul className="finder-list" id="finder-list" role="listbox" aria-label="Pages">
        {shown.map((item, index) => <li key={item.key} id={`finder-${index}`} role="option" aria-selected={index === current} onClick={() => open(item)}>
          <Icon name={item.icon} />{item.label}
        </li>)}
        {shown.length === 0 && <li role="option" aria-selected="false" aria-disabled="true">No page matches “{query}”.</li>}
      </ul>
      <p className="finder-hint">Arrow keys to move, Enter to open, Esc to close.</p>
    </div>
  </dialog>;
}

// The heading area at the top of each page.
export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="app-page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="muted-text">{description}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>;
}
