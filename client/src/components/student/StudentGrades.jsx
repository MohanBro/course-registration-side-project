import { gradeTone, termCredits } from "../../utils/studentDashboard.js";

const GRADE_NAMES = { pass: "Passed", fail: "Failed", withdrawn: "Withdrawn", other: "Grade" };

// Academic history by term, with coloured grade badges and credits per term.
export default function StudentGrades({ data }) {
  return <>
    {data.outstandingFailures.length > 0 && <section className="dashboard-section callout-warning" aria-labelledby="retake-title">
      <h2 id="retake-title">Retakes needed</h2>
      <p className="muted-text">You still need to pass these courses. Ask your advisor about the next available section.</p>
      <ul className="retake-list">{data.outstandingFailures.map(c => <li key={c.id}><strong>{c.courseCode}</strong> {c.courseName}</li>)}</ul>
    </section>}

    <section className="dashboard-section" aria-labelledby="grades-title">
      <div className="section-heading">
        <div><p className="eyebrow">Academic history</p><h2 id="grades-title">Results by term</h2>
          <p className="section-description">{data.earnedCredits} credits earned in total</p></div>
      </div>
      {data.history.length === 0 ? <div className="portal-empty"><strong>No grades yet</strong><p>Your results will appear here after your first term is finalised.</p></div>
        : data.history.map(term => {
          const credits = termCredits(term.courses);
          return <div className="term-block" key={term.term}>
            <div className="term-heading"><h3>Term {term.term}</h3><span>{credits.earned} of {credits.attempted} credits earned</span></div>
            <ul className="grade-list">{term.courses.map(c => {
              const tone = gradeTone(c.grade);
              return <li key={c.id}>
                <span><strong>{c.courseCode}</strong> {c.courseName}</span>
                <span className="grade-credits">{c.credits} cr</span>
                <span className={`grade-badge grade-${tone}`} aria-label={`${GRADE_NAMES[tone]}: ${c.grade}`}>{c.grade}</span>
              </li>;
            })}</ul>
          </div>;
        })}
      <p className="muted-text grade-key"><span className="grade-badge grade-pass">A–D</span> passed <span className="grade-badge grade-fail">F</span> failed <span className="grade-badge grade-withdrawn">W</span> withdrawn</p>
    </section>
  </>;
}
