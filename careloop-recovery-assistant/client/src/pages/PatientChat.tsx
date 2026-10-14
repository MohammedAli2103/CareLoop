
import { useEffect, useState } from "react";
import "./PatientChat.css";

const API_URL = "http://localhost:3000/api/cases";
const CASE_STORAGE_KEY = "careloop-demo-case-id";

type Message = {
  sender: "assistant" | "patient";
  text: string;
};

type PatientChatProps = {
  onBack: () => void;
};

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

const statusLabels: Record<CaseStatus, string> = {
  awaiting_patient: "Awaiting patient",
  staff_follow_up: "Staff follow-up",
  rebooked: "Marked as rebooked",
  declined: "Appointment declined",
  closed: "Case closed",
};

const statusDescriptions: Record<CaseStatus, string> = {
  awaiting_patient:
    "Your recovery case has been received. Your next step can be discussed here.",
  staff_follow_up:
    "Your case has been marked for care-team follow-up. This demo does not send a notification to hospital staff.",
  rebooked:
    "Your appointment selection has been saved in this demo. Please verify actual appointment details with your provider.",
  declined:
    "Your case has been marked as declined. Contact your care provider if you need further assistance.",
  closed: "Your recovery case has been marked as closed.",
};

const reasons = [
  "Scheduling conflict",
  "Transport difficulties",
  "Cost concerns",
  "I forgot",
  "I wasn't feeling well",
  "Prefer not to say",
];

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PatientChat({ onBack }: PatientChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "Hi there! We're glad you've reached out. Sometimes life gets in the way of an appointment, and that's okay.",
    },
    {
      sender: "assistant",
      text: "Would you like to tell us what made it difficult to attend? You can skip this question if you'd prefer.",
    },
  ]);

  const [showReasons, setShowReasons] = useState(true);
  const [input, setInput] = useState("");
  const [recoveryCase, setRecoveryCase] =
    useState<RecoveryCase | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [savingReason, setSavingReason] = useState(false);

  const [showSlots, setShowSlots] = useState(false);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [slotSuccess, setSlotSuccess] = useState("");

  async function fetchCaseStatus(caseId: string) {
    setLoadingStatus(true);
    setStatusError("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(caseId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not retrieve your case status."
        );
      }

      setRecoveryCase(data.case as RecoveryCase);
    } catch (error) {
      console.error("Error retrieving recovery case:", error);
      setStatusError(
        error instanceof Error
          ? error.message
          : "Could not retrieve your case status."
      );
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    const savedCaseId = sessionStorage.getItem(CASE_STORAGE_KEY);

    if (savedCaseId) {
      void fetchCaseStatus(savedCaseId);
    }
  }, []);

  useEffect(() => {
    if (!recoveryCase?.id) return;

    const intervalId = window.setInterval(() => {
      void fetchCaseStatus(recoveryCase.id);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [recoveryCase?.id]);

  async function chooseReason(reason: string) {
    if (savingReason) return;

    setMessages((previous) => [
      ...previous,
      { sender: "patient", text: reason },
    ]);

    setShowReasons(false);
    setSavingReason(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save your reason.");
      }

      const createdCase = data.case as RecoveryCase;

      sessionStorage.setItem(CASE_STORAGE_KEY, createdCase.id);
      setRecoveryCase(createdCase);
      setStatusError("");

      setMessages((previous) => [
        ...previous,
        {
          sender: "assistant",
          text:
            `Thank you for sharing that with us. Your demo recovery case ID is ${createdCase.id}. You can check its latest status below. Would you like to reschedule your appointment or speak with the care team?`,
        },
      ]);
    } catch (error) {
      console.error("Error saving recovery reason:", error);

      setMessages((previous) => [
        ...previous,
        {
          sender: "assistant",
          text:
            "We couldn't save your response. Please check that the backend is running and try again.",
        },
      ]);

      setShowReasons(true);
    } finally {
      setSavingReason(false);
    }
  }

  async function loadSlots() {
    if (!recoveryCase) {
      setSlotError("Submit a recovery reason before rescheduling.");
      return;
    }

    setShowSlots(true);
    setSlotError("");
    setSlotSuccess("");
    setLoadingSlots(true);
    setSelectedSlotId("");

    try {
      // Refresh the case first so we do not offer rescheduling
      // for a case that already has an appointment saved.
      const caseResponse = await fetch(
        `${API_URL}/${encodeURIComponent(recoveryCase.id)}`
      );
      const caseData = await caseResponse.json();

      if (!caseResponse.ok) {
        throw new Error(
          caseData.error || "Could not verify your recovery case."
        );
      }

      const currentCase = caseData.case as RecoveryCase;
      setRecoveryCase(currentCase);

      if (currentCase.appointment) {
        setSlotError(
          "An appointment selection is already saved for this case."
        );
        return;
      }

      if (
        currentCase.status === "declined" ||
        currentCase.status === "closed"
      ) {
        throw new Error(
          "This case is not eligible for rescheduling in its current status."
        );
      }

      const response = await fetch("http://localhost:3000/api/slots");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not load appointment slots."
        );
      }

      setSlots(data.slots as AppointmentSlot[]);

      if (!data.slots.length) {
        setSlotError("No demo appointment slots are currently available.");
      }
    } catch (error) {
      setSlotError(
        error instanceof Error
          ? error.message
          : "Could not load appointment slots."
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirmAppointment() {
    if (!recoveryCase || !selectedSlotId || savingAppointment) {
      return;
    }

    setSavingAppointment(true);
    setSlotError("");
    setSlotSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(recoveryCase.id)}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotId: selectedSlotId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not save your appointment selection."
        );
      }

      const updatedCase = data.case as RecoveryCase;
      setRecoveryCase(updatedCase);

      setSlotSuccess(
        `Your demo appointment selection was saved for ${formatDate(
          data.appointment.date
        )} at ${data.appointment.time}.`
      );

      setShowSlots(false);
      setSelectedSlotId("");

      setMessages((previous) => [
        ...previous,
        {
          sender: "assistant",
          text:
            `Your demo appointment selection has been saved for ${formatDate(data.appointment.date)} at ${data.appointment.time}. This is a mock appointment, not a real hospital booking.`,
        },
      ]);
    } catch (error) {
      setSlotError(
        error instanceof Error
          ? error.message
          : "Could not save your appointment selection."
      );

      // Another person or demo case may have taken a slot.
      // Reload the server's current availability.
      try {
        const response = await fetch("http://localhost:3000/api/slots");
        const data = await response.json();

        if (response.ok) {
          setSlots(data.slots as AppointmentSlot[]);
        }
      } catch {
        // Keep the original booking error visible.
      }
    } finally {
      setSavingAppointment(false);
    }
  }

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    setMessages((previous) => [
      ...previous,
      { sender: "patient", text },
      {
        sender: "assistant",
        text: "Thank you for letting us know. You can choose to reschedule your appointment or request help from the care team below.",
      },
    ]);

    setInput("");
    setShowReasons(false);
  }

  function chooseAction(action: string) {
    if (action === "Reschedule appointment") {
      void loadSlots();
      return;
    }

    setMessages((previous) => [
      ...previous,
      { sender: "patient", text: action },
      {
        sender: "assistant",
        text: "Your request for care-team assistance has been noted in this demo. No message has been sent to hospital staff.",
      },
    ]);
  }

  return (
    <div className="chat-page">
      <header className="chat-navbar">
        <button className="chat-brand" onClick={onBack}>
          <span className="chat-brand-mark">c</span>
          careloop<span className="chat-brand-period">.</span>
        </button>

        <button className="back-button" onClick={onBack}>
          ← Back home
        </button>
      </header>

      <main className="chat-layout">
        <section className="chat-intro">
          <span className="chat-eyebrow">YOUR RECOVERY SPACE</span>
          <h1>
            Let's figure out
            <br />
            your <span>next step.</span>
          </h1>
          <p>
            A supportive conversation to help you reconnect
            with your care. There's no pressure to explain
            what happened.
          </p>

          <div className="chat-promise">
            <span>✓</span>
            Your reason is optional
          </div>
          <div className="chat-promise">
            <span>✓</span>
            You choose what happens next
          </div>
        </section>

        <section className="chat-card">
          <div className="chat-card-header">
            <div className="chat-avatar">c</div>
            <div>
              <strong>CareLoop Assistant</strong>
              <span>
                <span className="chat-online-dot" />
                Recovery support · Demo
              </span>
            </div>
          </div>

          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`message-row ${message.sender}`}
                key={`${index}-${message.text}`}
              >
                {message.sender === "assistant" && (
                  <div className="message-avatar">c</div>
                )}
                <div className="message-bubble">{message.text}</div>
              </div>
            ))}

            {recoveryCase && (
              <section className="patient-case-status">
                <div className="patient-case-status-heading">
                  <div>
                    <span className="patient-case-eyebrow">
                      YOUR RECOVERY CASE
                    </span>
                    <h3>Case status</h3>
                  </div>
                  <span className="patient-case-indicator">Demo</span>
                </div>

                <p className="patient-case-id">
                  Case ID: {recoveryCase.id}
                </p>

                <div className="patient-status-row">
                  <span
                    className={`patient-status-dot status-${recoveryCase.status}`}
                  />
                  <strong>
                    {statusLabels[recoveryCase.status] ??
                      recoveryCase.status}
                  </strong>
                </div>

                <p className="patient-status-description">
                  {statusDescriptions[recoveryCase.status] ??
                    "Your case status has been updated."}
                </p>

                {recoveryCase.appointment && (
                  <div className="patient-appointment-summary">
                    <strong>Saved demo appointment</strong>
                    <span>
                      {formatDate(recoveryCase.appointment.date)}
                    </span>
                    <span>{recoveryCase.appointment.time}</span>
                  </div>
                )}

                {statusError && (
                  <p className="patient-status-error" role="alert">
                    {statusError}
                  </p>
                )}

                <button
                  className="patient-refresh-status"
                  type="button"
                  onClick={() => fetchCaseStatus(recoveryCase.id)}
                  disabled={loadingStatus}
                >
                  {loadingStatus ? "Checking status..." : "↻ Refresh status"}
                </button>
              </section>
            )}

            {!recoveryCase && statusError && (
              <p className="patient-status-error" role="alert">
                Could not load your saved case: {statusError}
              </p>
            )}

            {showSlots && (
              <section className="patient-slot-panel">
                <div className="patient-slot-heading">
                  <div>
                    <span className="patient-case-eyebrow">
                      RESCHEDULING
                    </span>
                    <h3>Choose a new time</h3>
                  </div>
                  <button
                    className="patient-slot-close"
                    type="button"
                    onClick={() => setShowSlots(false)}
                    aria-label="Close appointment selection"
                  >
                    ×
                  </button>
                </div>

                <p className="patient-slot-note">
                  Select one of the fictional appointment slots below.
                  Your selection is saved only after you confirm it.
                </p>

                {loadingSlots && (
                  <p className="patient-saving-message">
                    Loading available slots...
                  </p>
                )}

                {!loadingSlots && slots.length > 0 && (
                  <div className="patient-slot-list">
                    {slots.map((slot) => (
                      <button
                        type="button"
                        key={slot.id}
                        className={`patient-slot-option ${
                          selectedSlotId === slot.id ? "selected" : ""
                        }`}
                        onClick={() => setSelectedSlotId(slot.id)}
                        disabled={savingAppointment}
                        aria-pressed={selectedSlotId === slot.id}
                      >
                        <span className="patient-slot-date">
                          {formatDate(slot.date)}
                        </span>
                        <span className="patient-slot-time">
                          {slot.time}
                        </span>
                        <span className="patient-slot-radio">
                          {selectedSlotId === slot.id ? "✓" : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {slotError && (
                  <p className="patient-status-error" role="alert">
                    {slotError}
                  </p>
                )}

                <button
                  className="patient-confirm-slot"
                  type="button"
                  onClick={() => void confirmAppointment()}
                  disabled={
                    !selectedSlotId ||
                    savingAppointment ||
                    loadingSlots
                  }
                >
                  {savingAppointment
                    ? "Saving selection..."
                    : "Confirm selection"}
                </button>

                <p className="patient-slot-disclaimer">
                  Demo only · This does not book a real hospital appointment.
                </p>
              </section>
            )}

            {slotSuccess && (
              <p className="patient-slot-success" role="status">
                {slotSuccess}
              </p>
            )}

            {savingReason && (
              <p className="patient-saving-message">
                Saving your recovery case...
              </p>
            )}

            {showReasons && (
              <div className="reason-section">
                <p className="reason-heading">
                  What made attending difficult?
                </p>
                <div className="reason-options">
                  {reasons.map((reason) => (
                    <button
                      className="reason-button"
                      key={reason}
                      onClick={() => void chooseReason(reason)}
                      disabled={savingReason}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showReasons && (
              <div className="chat-actions">
                <p>What would you like to do next?</p>
                <button
                  onClick={() =>
                    chooseAction("Reschedule appointment")
                  }
                  disabled={Boolean(recoveryCase?.appointment)}
                >
                  <span>▦</span>
                  Reschedule appointment
                  <span className="action-arrow">→</span>
                </button>
                <button
                  onClick={() => chooseAction("Talk to the care team")}
                >
                  <span>♡</span>
                  Talk to the care team
                  <span className="action-arrow">→</span>
                </button>
              </div>
            )}
          </div>

          <form
            className="chat-input-area"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message (optional)..."
              aria-label="Your message"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>

          <p className="chat-disclaimer">
            Demo only · This conversation does not contact hospital staff.
          </p>
        </section>
      </main>
    </div>
  );
}

export default PatientChat;
