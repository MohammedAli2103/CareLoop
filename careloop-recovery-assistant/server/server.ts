
import express from "express";
import cors from "cors";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "data", "cases.json");

const allowedReasons = [
  "Scheduling conflict",
  "Transport difficulties",
  "Cost concerns",
  "I forgot",
  "I wasn't feeling well",
  "Prefer not to say",
];

const allowedStatuses = [
  "awaiting_patient",
  "staff_follow_up",
  "rebooked",
  "declined",
  "closed",
] as const;

type CaseStatus = (typeof allowedStatuses)[number];

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

const appointmentSlots: AppointmentSlot[] = [
  { id: "slot-1", date: "2026-11-02", time: "09:00 AM" },
  { id: "slot-2", date: "2026-11-02", time: "10:30 AM" },
  { id: "slot-3", date: "2026-11-02", time: "02:00 PM" },
  { id: "slot-4", date: "2026-11-03", time: "09:30 AM" },
  { id: "slot-5", date: "2026-11-03", time: "11:00 AM" },
  { id: "slot-6", date: "2026-11-03", time: "03:00 PM" },
  { id: "slot-7", date: "2026-11-04", time: "10:00 AM" },
  { id: "slot-8", date: "2026-11-04", time: "01:30 PM" },
];

async function readCases(): Promise<RecoveryCase[]> {
  const content = await readFile(DATA_FILE, "utf8");
  const parsed: unknown = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error("The cases data file must contain an array.");
  }

  return parsed.map((item: Record<string, unknown>) => ({
    ...item,
    status: allowedStatuses.includes(item.status as CaseStatus)
      ? (item.status as CaseStatus)
      : "awaiting_patient",
  })) as RecoveryCase[];
}

async function writeCases(cases: RecoveryCase[]): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(cases, null, 2), "utf8");
}

function getAvailableSlots(cases: RecoveryCase[]) {
  const bookedSlotIds = new Set(
    cases
      .map((item) => item.appointment?.slotId)
      .filter((id): id is string => Boolean(id))
  );

  return appointmentSlots.filter(
    (slot) => !bookedSlotIds.has(slot.id)
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// List currently available mock appointment slots.
app.get("/api/slots", async (_req, res) => {
  try {
    const cases = await readCases();

    res.json({
      slots: getAvailableSlots(cases),
      demo: true,
    });
  } catch (error) {
    console.error("Could not read appointment availability:", error);
    res.status(500).json({
      error: "Could not retrieve appointment availability.",
    });
  }
});

// Create a recovery case.
app.post("/api/cases", async (req, res) => {
  try {
    const { reason } = req.body ?? {};

    if (
      typeof reason !== "string" ||
      !allowedReasons.includes(reason)
    ) {
      res.status(400).json({
        error: "Please select a valid recovery reason.",
      });
      return;
    }

    const cases = await readCases();

    const newCase: RecoveryCase = {
      id: `case-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      reason,
      createdAt: new Date().toISOString(),
      status: "awaiting_patient",
    };

    cases.push(newCase);
    await writeCases(cases);

    res.status(201).json({ case: newCase });
  } catch (error) {
    console.error("Could not create recovery case:", error);
    res.status(500).json({
      error: "Could not save your recovery case.",
    });
  }
});

// List all cases for the demo staff dashboard.
app.get("/api/cases", async (_req, res) => {
  try {
    const cases = await readCases();
    res.json({ count: cases.length, cases });
  } catch (error) {
    console.error("Could not read recovery cases:", error);
    res.status(500).json({
      error: "Could not retrieve recovery cases.",
    });
  }
});

// Retrieve one case.
app.get("/api/cases/:id", async (req, res) => {
  try {
    const cases = await readCases();

    const recoveryCase = cases.find(
      (item) => item.id === req.params.id
    );

    if (!recoveryCase) {
      res.status(404).json({
        error: "Recovery case not found.",
      });
      return;
    }

    res.json({ case: recoveryCase });
  } catch (error) {
    console.error("Could not read recovery case:", error);
    res.status(500).json({
      error: "Could not retrieve the recovery case.",
    });
  }
});

// Update a case status from the staff dashboard.
app.patch("/api/cases/:id/status", async (req, res) => {
  try {
    const { status } = req.body ?? {};

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status as CaseStatus)
    ) {
      res.status(400).json({
        error: "Invalid case status.",
      });
      return;
    }

    const cases = await readCases();
    const index = cases.findIndex(
      (item) => item.id === req.params.id
    );

    if (index === -1) {
      res.status(404).json({
        error: "Recovery case not found.",
      });
      return;
    }

    cases[index].status = status as CaseStatus;
    await writeCases(cases);

    res.json({ case: cases[index] });
  } catch (error) {
    console.error("Could not update recovery case:", error);
    res.status(500).json({
      error: "Could not update recovery case.",
    });
  }
});

// Validate and save a rescheduling request.
app.post("/api/cases/:id/reschedule", async (req, res) => {
  try {
    const { slotId } = req.body ?? {};

    if (typeof slotId !== "string" || !slotId.trim()) {
      res.status(400).json({
        error: "Please select an appointment slot.",
      });
      return;
    }

    const cases = await readCases();

    const caseIndex = cases.findIndex(
      (item) => item.id === req.params.id
    );

    if (caseIndex === -1) {
      res.status(404).json({
        error: "Recovery case not found.",
      });
      return;
    }

    const recoveryCase = cases[caseIndex];

    if (
      recoveryCase.status === "declined" ||
      recoveryCase.status === "closed"
    ) {
      res.status(409).json({
        error:
          "This case is not eligible for rescheduling in its current status.",
      });
      return;
    }

    const slot = appointmentSlots.find(
      (item) => item.id === slotId
    );

    if (!slot) {
      res.status(400).json({
        error: "That appointment slot is invalid.",
      });
      return;
    }

    const alreadyBooked = cases.some(
      (item) =>
        item.id !== recoveryCase.id &&
        item.appointment?.slotId === slotId
    );

    if (alreadyBooked) {
      res.status(409).json({
        error:
          "That slot has just been booked. Please choose another available slot.",
      });
      return;
    }

    // Do not silently replace a previously confirmed selection.
    if (recoveryCase.appointment) {
      res.status(409).json({
        error:
          "This case already has a saved appointment selection.",
      });
      return;
    }

    recoveryCase.appointment = {
      slotId: slot.id,
      date: slot.date,
      time: slot.time,
      bookedAt: new Date().toISOString(),
    };

    recoveryCase.status = "rebooked";

    await writeCases(cases);

    res.json({
      message: "Demo appointment selection saved.",
      case: recoveryCase,
      appointment: recoveryCase.appointment,
      demo: true,
    });
  } catch (error) {
    console.error("Could not save rescheduling selection:", error);
    res.status(500).json({
      error: "Could not save your appointment selection.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`CareLoop API running at http://localhost:${PORT}`);
});
