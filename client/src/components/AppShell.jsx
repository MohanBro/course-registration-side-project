import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";

// The layout shared by the student, advisor and admin workspaces:
// a navy sidebar on wide screens (a top bar with swipeable tabs on phones),
// the signed-in person, a log-out button and a "Skip to main content" link.
//
// items: [{ key, to, label, icon, badge, end, onClick }]
// person: { name, detail }  (detail = student ID, "Advisor", ...)
export default function AppShell({ items, person, workspace, onLogout, children }) {
  return <div className="app-layout">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className="app-sidebar">
      <div className="app-brand">
        <span className="portal-symbol" aria-hidden="true">C</span>
        <span>Course Portal<small>{workspace}</small></span>
      </div>
      <nav aria-label={`${workspace} sections`} className="app-nav">
        {items.map(item => <NavLink key={item.key} to={item.to} end={item.end ?? true} onClick={item.onClick}
          className={({ isActive }) => `app-nav-link${isActive ? " active" : ""}`}>
          <span className="nav-label"><Icon name={item.icon} />{item.label}</span>
          {item.badge > 0 && <span className="nav-count" aria-label={`${item.badge} waiting`}>{item.badge}</span>}
        </NavLink>)}
      </nav>
      {person?.name && <div className="app-identity">
        <span className="avatar" aria-hidden="true">{person.name.trim().charAt(0).toUpperCase()}</span>
        <span><strong>{person.name}</strong><small>{person.detail}</small></span>
      </div>}
      <button type="button" className="app-logout" onClick={onLogout}><Icon name="logout" /> Log out</button>
    </aside>
    <main className="app-main" id="main-content" tabIndex={-1}>{children}</main>
  </div>;
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
