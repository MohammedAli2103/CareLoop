import { useState } from "react";
import "./App.css";
import PatientChat from "./pages/PatientChat";
import StaffDashboard from "./pages/StaffDashboard";

type View = "home" | "chat" | "staff";

function App() {
  const [view, setView] = useState<View>("home");

  if (view === "chat") {
    return <PatientChat onBack={() => setView("home")} />;
  }

  if (view === "staff") {
    return <StaffDashboard onBack={() => setView("home")} />;
  }

  return (
    <div className="app">
      <header className="navbar">
        <button
          className="brand"
          type="button"
          aria-label="CareLoop home"
          onClick={() => setView("home")}
        >
          <span className="brand-mark">c</span>
          <span>
            careloop<span className="brand-period">.</span>
          </span>
        </button>

        <div className="nav-right">
          <span className="nav-caption">RECOVERY ASSISTANT</span>

          <span className="nav-status">
            <span className="status-dot" />
            Here for you
          </span>

          <button
            type="button"
            className="staff-nav-button"
            onClick={() => setView("staff")}
          >
            Staff dashboard →
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-section">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            A FRESH START, AT YOUR PACE
          </div>

          <h1>
            Getting back
            <br />
            to your care
            <br />
            <span>starts here.</span>
          </h1>

          <p className="intro">
            Life doesn't always go according to plan. If you
            missed an appointment, we're here to help you find
            your next step — without judgment or pressure.
          </p>

          <button
            className="primary-button"
            onClick={() => setView("chat")}
          >
            <span>Let's get started</span>
            <span className="button-arrow">↗</span>
          </button>

          <div className="trust-note">
            <span className="trust-icon">✓</span>
            <span>
              Your reason is optional. Your choice matters.
            </span>
          </div>

          <div className="welcome-divider" />

          <div className="welcome-footer">
            <span className="footer-symbol">✳</span>
            <p>
              One missed appointment doesn't define
              <br />
              your health journey.
            </p>
          </div>
        </section>

        <section className="recovery-panel">
          <div className="panel-header">
            <div>
              <span className="panel-label">
                YOUR RECOVERY SPACE
              </span>
              <h2>How can we help?</h2>
              <p>Choose what feels right for you.</p>
            </div>

            <div className="panel-icon">♡</div>
          </div>

          <div className="panel-divider" />

          <button
            className="option-card"
            onClick={() => setView("chat")}
          >
            <span className="option-icon calendar-icon">▦</span>
            <span className="option-copy">
              <strong>Reschedule an appointment</strong>
              <span>Find a time that works for you.</span>
            </span>
            <span className="option-arrow">↗</span>
          </button>

          <button
            className="option-card"
            onClick={() => setView("chat")}
          >
            <span className="option-icon heart-icon">♡</span>
            <span className="option-copy">
              <strong>I need a little support</strong>
              <span>Let's talk about what might help.</span>
            </span>
            <span className="option-arrow">↗</span>
          </button>

          <button
            className="option-card"
            onClick={() => setView("chat")}
          >
            <span className="option-icon people-icon">☏</span>
            <span className="option-copy">
              <strong>Talk to the care team</strong>
              <span>Get help from a member of staff.</span>
            </span>
            <span className="option-arrow">↗</span>
          </button>

          <div className="reassurance">
            <div className="reassurance-icon">✳</div>
            <div>
              <strong>You're not alone in this.</strong>
              <p>
                You can take things one step at a time.
                Sharing why you missed an appointment is
                completely optional.
              </p>
            </div>
          </div>

          <div className="panel-bottom">
            <span className="bottom-dot" />
            YOUR JOURNEY, YOUR PACE
            <span className="bottom-spacer" />
            <span>01 / 01</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          careloop<span className="brand-period">.</span>
        </span>
        <span>Thoughtful care. Better continuity.</span>
        <span>Recovery Assistant · Demo</span>
      </footer>
    </div>
  );
}

export default App;