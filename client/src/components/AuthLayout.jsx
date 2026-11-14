import "../pages/Login.css";

// The shared layout for Sign in, Forgot password and Reset password:
// a headline and three hanging tags on the green desk, and next to them a
// sheet of paper holding whatever page content is passed in.
export default function AuthLayout({ children }) {
  return (
    <main className="login-page">
      <div className="login-intro">
        <a className="portal-wordmark" href="/" aria-label="Course Portal home"><span className="portal-symbol" aria-hidden="true" /> Course Portal</a>
        <p className="login-headline">Hand in your card. We will hold your seat.</p>
        <p className="login-lede">Keep your courses, weekly timetable and add or drop requests on one desk.</p>
        <ul className="login-tags">
          <li><strong>Plan your week</strong><span>See when and where your classes meet.</span></li>
          <li><strong>Stay on track</strong><span>Review registrations and earned credits.</span></li>
          <li><strong>Ask your advisor</strong><span>Send add and drop slips and read the decision.</span></li>
        </ul>
      </div>
      <div className="login-form-area">
        <section className="login-card">{children}</section>
        <p className="login-footer">Course Portal, for students, advisors and administrators</p>
      </div>
    </main>
  );
}
