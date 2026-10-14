
import { useEffect, useState } from "react";
import "./StaffDashboard.css";

type CaseStatus =
  | "awaiting_patient"
  | "staff_follow_up"
  | "rebooked"
  | "declined"
  | "closed";

type Appointment = {
  slotId: string;
  date: string;
  time: string;
  bookedAt: string;
};

type RecoveryCase = {
  id: string;
  reason: string;
  createdAt: string;
  status: CaseStatus;
  appointment?: Appointment;
};

type AppointmentSlot = {
  id: string;
  date: string;
  time: string;
};

type CasesResponse = {
  count: number;
  cases: RecoveryCase[];
};

const API_URL = "http://localhost:3000/api";

const statusLabels: Record<CaseStatus, string> = {
  awaiting_patient: "Awaiting patient",
  staff_follow_up: "Staff follow-up",
  rebooked: "Rebooked",
  declined: "Declined",
  closed: "Closed",
};

function StaffDashboard({ onBack }: { onBack: () => void }) {
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [rescheduleCase, setRescheduleCase] =
    useState<RecoveryCase | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  async function loadCases(showLoading = true) {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/cases`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load recovery cases.");
      }

      setCases((data as CasesResponse).cases);
    } catch {
      setError(
        "Unable to connect to the backend. Check that the server is running on port 3000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCases();
  }, []);

  async function updateStatus(
    caseId: string,
    newStatus: CaseStatus
  ) {
    const previousCase = cases.find((item) => item.id === caseId);

    if (!previousCase || previousCase.status === newStatus) return;

    setSavingId(caseId);
    setNotice("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/cases/${encodeURIComponent(caseId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update case status.");
      }

      setCases((current) =>
        current.map((item) => item.id === caseId ? data.case : item)
      );
      setNotice(`Case status updated to ${statusLabels[newStatus]}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update case status."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function openReschedule(item: RecoveryCase) {
    setRescheduleCase(item);
    setSelectedSlotId("");
    setSlots([]);
    setRescheduleError("");
    setNotice("");
    setLoadingSlots(true);

    try {
      const response = await fetch(`${API_URL}/slots`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load appointment slots.");
      }

      setSlots(data.slots as AppointmentSlot[]);
    } catch (err) {
      setRescheduleError(
        err instanceof Error ? err.message : "Could not load appointment slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirmReschedule() {
    if (!rescheduleCase || !selectedSlotId) {
      setRescheduleError("Please select an appointment slot.");
      return;
    }

    setSavingAppointment(true);
    setRescheduleError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/cases/${encodeURIComponent(rescheduleCase.id)}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotId: selectedSlotId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the appointment.");
      }

      setCases((current) =>
        current.map((item) =>
          item.id === rescheduleCase.id ? data.case : item
        )
      );

      setNotice(
        `Appointment saved for ${data.appointment.date} at ${data.appointment.time}.`
      );
      setRescheduleCase(null);
      setSelectedSlotId("");
      setSlots([]);

      // Refresh available slots so a booked slot is no longer offered.
      try {
        const slotResponse = await fetch(`${API_URL}/slots`);
        const slotData = await slotResponse.json();
        if (slotResponse.ok) setSlots(slotData.slots);
      } catch {
        // The saved appointment remains successful even if refresh fails.
      }
    } catch (err) {
      setRescheduleError(
        err instanceof Error ? err.message : "Could not save the appointment."
      );
    } finally {
      setSavingAppointment(false);
    }
  }

  const reasonCounts = cases.reduce<Record<string, number>>((counts, item) => {
    counts[item.reason] = (counts[item.reason] || 0) + 1;
    return counts;
  }, {});

  const sortedReasons = Object.entries(reasonCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const mostReportedReason = sortedReasons[0]?.[0] ?? "—";
  const maxReasonCount = sortedReasons[0]?.[1] ?? 1;

  const awaitingPatientCount = cases.filter(
    (item) => item.status === "awaiting_patient"
  ).length;

  const followUpCount = cases.filter(
    (item) => item.status === "staff_follow_up"
  ).length;

  const rebookedCount = cases.filter(
    (item) => item.status === "rebooked"
  ).length;

  const attentionCases = cases.filter(
    (item) => item.status === "staff_follow_up"
  );

  function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Unknown date"
      : date.toLocaleString();
  }

  function formatSlotDate(value: string) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }

  return (
    <div className="staff-dashboard">
      <header className="staff-header">
        <button
          type="button"
          className="staff-brand"
          onClick={onBack}
          aria-label="Return to CareLoop home"
        >
          <span className="staff-brand-mark">c</span>
          <span>careloop<span className="brand-period">.</span></span>
        </button>

        <div className="staff-header-right">
          <span className="staff-demo-label">DEMO MODE</span>
          <button
            type="button"
            className="staff-refresh-button"
            onClick={() => void loadCases()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </header>

      <main className="staff-main">
        <section className="staff-page-heading">
          <div>
            <p className="staff-eyebrow">CARELOOP / RECOVERY MANAGEMENT</p>
            <h1>Staff dashboard</h1>
            <p className="staff-subtitle">
              Review recovery cases, manage appointments, and understand
              barriers patients report when returning to care.
            </p>
          </div>

          <button
            type="button"
            className="staff-back-button"
            onClick={onBack}
          >
            ← Back to home
          </button>
        </section>

        {error && (
          <div className="staff-error" role="alert">
            <strong>Something went wrong</strong>
            <p>{error}</p>
            <button type="button" onClick={() => void loadCases()}>
              Reload cases
            </button>
          </div>
        )}

        {notice && (
          <div className="staff-success" role="status">
            {notice}
          </div>
        )}

        <section className="staff-metrics">
          <article className="staff-metric-card">
            <span className="metric-label">TOTAL RECOVERY CASES</span>
            <strong className="metric-value">{loading ? "—" : cases.length}</strong>
            <span className="metric-description">Saved demo records</span>
          </article>

          <article className="staff-metric-card">
            <span className="metric-label">AWAITING PATIENT</span>
            <strong className="metric-value">
              {loading ? "—" : awaitingPatientCount}
            </strong>
            <span className="metric-description">Awaiting a patient response</span>
          </article>

          <article className="staff-metric-card">
            <span className="metric-label">STAFF FOLLOW-UPS</span>
            <strong className="metric-value">{loading ? "—" : followUpCount}</strong>
            <span className="metric-description">Cases requiring staff attention</span>
          </article>

          <article className="staff-metric-card">
            <span className="metric-label">REBOOKED</span>
            <strong className="metric-value">{loading ? "—" : rebookedCount}</strong>
            <span className="metric-description">Cases marked as rebooked</span>
          </article>

          <article className="staff-metric-card">
            <span className="metric-label">MOST REPORTED BARRIER</span>
            <strong className="metric-value metric-reason">
              {loading ? "Loading..." : mostReportedReason}
            </strong>
            <span className="metric-description">Based on saved demo cases</span>
          </article>
        </section>

        <section className="staff-content-grid">
          <article className="staff-card staff-attention-card">
            <div className="staff-card-heading">
              <div>
                <h2>Needs attention</h2>
                <p>Cases marked for staff follow-up.</p>
              </div>
              <span className="staff-count">{attentionCases.length} cases</span>
            </div>

            {loading ? (
              <div className="staff-empty-state">Loading cases...</div>
            ) : attentionCases.length === 0 ? (
              <div className="staff-empty-state">
                No cases currently marked for follow-up.
              </div>
            ) : (
              <div className="staff-attention-list">
                {attentionCases.map((item) => (
                  <div className="staff-attention-item" key={item.id}>
                    <div>
                      <strong>{item.reason}</strong>
                      <span className="staff-case-id">{item.id}</span>
                    </div>
                    <button
                      type="button"
                      className="staff-reschedule-button"
                      disabled={Boolean(item.appointment)}
                      onClick={() => void openReschedule(item)}
                      title={
                        item.appointment
                          ? "This case already has an appointment."
                          : "Choose an appointment slot"
                      }
                    >
                      {item.appointment ? "Appointment saved" : "Reschedule"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="staff-card staff-cases-card">
            <div className="staff-card-heading">
              <div>
                <h2>Recovery cases</h2>
                <p>Update case status or manage appointments.</p>
              </div>
              <span className="staff-count">{cases.length} records</span>
            </div>

            {loading ? (
              <div className="staff-empty-state">Loading recovery cases...</div>
            ) : cases.length === 0 ? (
              <div className="staff-empty-state">
                <span className="staff-empty-icon">♡</span>
                <strong>No recovery cases yet</strong>
                <p>Cases will appear here when a patient selects a reason in the chat.</p>
              </div>
            ) : (
              <div className="staff-table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Case ID</th>
                      <th>Reported reason</th>
                      <th>Date created</th>
                      <th>Status</th>
                      <th>Appointment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...cases].reverse().map((item) => {
                      const isEligible =
                        item.status !== "declined" &&
                        item.status !== "closed" &&
                        !item.appointment;

                      return (
                        <tr key={item.id}>
                          <td>
                            <span className="staff-case-id">{item.id}</span>
                          </td>
                          <td>
                            <span className="staff-reason-badge">{item.reason}</span>
                          </td>
                          <td>{formatDate(item.createdAt)}</td>
                          <td>
                            <select
                              className="staff-status-select"
                              value={item.status}
                              disabled={savingId === item.id}
                              aria-label={`Status for case ${item.id}`}
                              onChange={(event) =>
                                void updateStatus(
                                  item.id,
                                  event.target.value as CaseStatus
                                )
                              }
                            >
                              {Object.entries(statusLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                            {savingId === item.id && (
                              <span className="staff-saving-label">Saving...</span>
                            )}
                          </td>
                          <td>
                            {item.appointment ? (
                              <span className="staff-appointment-summary">
                                {formatSlotDate(item.appointment.date)}
                                <br />
                                {item.appointment.time}
                              </span>
                            ) : (
                              <span className="staff-no-appointment">Not booked</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="staff-reschedule-button"
                              disabled={!isEligible}
                              onClick={() => void openReschedule(item)}
                              title={
                                item.appointment
                                  ? "This case already has an appointment."
                                  : !isEligible
                                    ? "Closed or declined cases cannot be rescheduled."
                                    : "Choose an appointment slot"
                              }
                            >
                              {item.appointment
                                ? "Booked"
                                : !isEligible
                                  ? "Unavailable"
                                  : "Reschedule"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="staff-card staff-insights-card">
            <div className="staff-card-heading">
              <div>
                <h2>Reported barriers</h2>
                <p>Breakdown by selected reason.</p>
              </div>
            </div>

            {loading ? (
              <div className="staff-empty-state">Loading insights...</div>
            ) : sortedReasons.length === 0 ? (
              <div className="staff-empty-state">No data available yet.</div>
            ) : (
              <div className="staff-bars">
                {sortedReasons.map(([reason, count]) => (
                  <div className="staff-bar-item" key={reason}>
                    <div className="staff-bar-label">
                      <span>{reason}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="staff-bar-track">
                      <div
                        className="staff-bar-fill"
                        style={{ width: `${(count / maxReasonCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="staff-insight-note">
              <span className="staff-note-icon">✳</span>
              <p>
                These insights reflect reasons patients choose to share.
                They do not establish a diagnosis or explain every missed appointment.
              </p>
            </div>
          </article>
        </section>

        <footer className="staff-footer">
          <span>careloop<span className="brand-period">.</span></span>
          <span>Recovery Assistant · Local demonstration only</span>
        </footer>
      </main>

      {rescheduleCase && (
        <div
          className="staff-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !savingAppointment) {
              setRescheduleCase(null);
            }
          }}
        >
          <section
            className="staff-reschedule-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-modal-title"
          >
            <div className="staff-modal-heading">
              <div>
                <p className="staff-eyebrow">APPOINTMENT MANAGEMENT</p>
                <h2 id="reschedule-modal-title">Reschedule appointment</h2>
                <p>Case: {rescheduleCase.id}</p>
              </div>
              <button
                type="button"
                className="staff-modal-close"
                aria-label="Close rescheduling window"
                disabled={savingAppointment}
                onClick={() => setRescheduleCase(null)}
              >
                ×
              </button>
            </div>

            <p className="staff-modal-description">
              Choose an available demo slot. The selected appointment will be
              saved to this recovery case.
            </p>

            {rescheduleError && (
              <div className="staff-error" role="alert">
                {rescheduleError}
              </div>
            )}

            {loadingSlots ? (
              <div className="staff-empty-state">Loading available slots...</div>
            ) : slots.length === 0 ? (
              <div className="staff-empty-state">
                No appointment slots are currently available.
              </div>
            ) : (
              <div className="staff-slot-list">
                {slots.map((slot) => (
                  <label
                    className={`staff-slot-option ${
                      selectedSlotId === slot.id ? "selected" : ""
                    }`}
                    key={slot.id}
                  >
                    <input
                      type="radio"
                      name="appointment-slot"
                      value={slot.id}
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                    />
                    <span>
                      <strong>{formatSlotDate(slot.date)}</strong>
                      <span>{slot.time}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="staff-modal-actions">
              <button
                type="button"
                className="staff-back-button"
                disabled={savingAppointment}
                onClick={() => setRescheduleCase(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-reschedule-button staff-confirm-button"
                disabled={
                  loadingSlots ||
                  !selectedSlotId ||
                  savingAppointment ||
                  slots.length === 0
                }
                onClick={() => void confirmReschedule()}
              >
                {savingAppointment ? "Saving..." : "Confirm appointment"}
              </button>
            </div>

            <p className="staff-demo-note">
              Demo only · These are predefined sample appointment slots.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
