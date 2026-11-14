// Small paper-form pieces shared by the student, advisor and admin pages.
import { punchGrid } from "../utils/punch.js";

// The grid of punched holes on a course card. Decoration only (screen readers
// skip it), because the same class times are always written out next to it.
export function PunchGrid({ meetings }) {
  const grid = punchGrid(meetings);
  if (!grid) return null;
  let order = 0; // each punched hole pops in slightly after the one before
  return <div className="punch-grid" aria-hidden="true" style={{ "--days": grid.days.length }}>
    {grid.days.map((letter, index) => <b key={index}>{letter}</b>)}
    {grid.rows.flatMap((row, r) => row.map((punched, c) =>
      <span key={`${r}-${c}`} className={punched ? "is-punched" : undefined} style={punched ? { "--i": order++ } : undefined} />))}
  </div>;
}

// Seats drawn as a tally of dots (one per seat) for normal class sizes,
// or a simple bar for very large classes.
export function SeatDots({ capacity, remaining }) {
  if (typeof capacity !== "number" || typeof remaining !== "number" || capacity < 1) return null;
  const taken = Math.max(0, capacity - remaining);
  const state = remaining <= 0 ? " is-full" : remaining <= Math.max(2, capacity * 0.15) ? " is-low" : "";
  const label = `${taken} of ${capacity} seats taken`;
  return <div className={`seats${state}`}>
    {capacity <= 40
      ? <div className="seat-dots" role="img" aria-label={label}>
        {Array.from({ length: capacity }, (_, i) => <span key={i} className={i < taken ? "is-taken" : undefined} />)}
      </div>
      : <div className="seat-bar" role="img" aria-label={label}><span style={{ width: `${Math.round(taken / capacity * 100)}%` }} /></div>}
    <span className="seats-text">{remaining <= 0 ? "Full" : `${remaining} ${remaining === 1 ? "seat" : "seats"} left`}</span>
  </div>;
}

// A rubber-stamp mark. tone: "ok" (blue), "no" (red), "wait" (amber), "void" (grey).
// slam = true plays the stamping animation once.
export function Stamp({ tone = "ok", slam = false, children }) {
  return <span className={`stamp stamp-${tone}${slam ? " is-slamming" : ""}`}>{children}</span>;
}

// One labelled box on a paper form. Use inside <dl className="boxes">.
export function Box({ label, children }) {
  return <div className="box"><dt>{label}</dt><dd>{children}</dd></div>;
}
