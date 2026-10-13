# CareLoop — Care-Continuity Platform (HacxSprint Hackathon 2026)

> **"Don't just track what happened. Help ensure the next step in care is addressed."**

CareLoop is a healthcare coordination platform built to eliminate silent drop-offs in patient journeys. It transforms doctor orders into tracked tasks with deadlines, extracts report data via OCR, enforces human-in-the-loop verification, and prevents missing test results through automated coordination.

---

## 🚀 Quickstart & Local Execution

To start the simplified CareLoop frontend locally:

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run the Vite development server
npm run dev
```

The application is immediately accessible at `http://localhost:5173`.

To run the production build check:
```bash
npm run build
```

---

## 💡 Simplified User Experience

Every screen is designed so any user immediately understands:
1. **What is happening?**
2. **What needs attention?**
3. **What should I do next?**

### 1. Patient Portal
- **Friendly Greeting**: Welcomes the patient in plain English.
- **Prominent "Next Step" Card**: Shows the immediate test to do, due date, plain instructions (e.g. fasting), partner clinic location, and **one obvious primary action** ("Upload Report").
- **"Need Help?" Button**: Quick option for patients experiencing barriers (**Cost**, **Travel**, **Scheduling**, or **Other**) to request assistance from their clinic coordinator.
- **Other Tasks List**: Simple, jargon-free list of secondary or completed tasks.

### 2. Doctor Dashboard
- **Needs Your Review**: Queue of lab reports that clinic staff have verified, ready for physician sign-off.
- **Patients to Follow Up**: List of patients with overdue tests or reported barriers.
- **Recent Activity**: Log of completed reviews and care plan updates.
- **Create Care Plan**: Short, 4-field form (**Patient**, **Required Test/Referral**, **Due Date**, **Instructions**).

### 3. Coordinator Dashboard
- **Overdue Tasks**: Patient name, missing test, due date, responsible person, and action ("Help Patient").
- **Reports to Verify**: Patient name, uploaded document, and action ("Verify Report" with split-screen audit).
- **Waiting for Doctor**: Staff-verified reports waiting for doctor evaluation, with one-click "Notify Doctor".

---

## 🧭 Simplified Navigation

- **Patient**:
  - `Home`
  - `My Care Plan`
  - `My Reports`
- **Doctor**:
  - `Dashboard`
  - `Patients`
  - `Care Plans`
- **Coordinator**:
  - `Dashboard`
  - `Tasks`
  - `Report Verification`

Role switching is prominently located in the top banner and clearly labelled as `DEMO MODE`.

---

## 🔄 Core Clinical Workflow Preserved

The system strictly enforces CareLoop's 5-stage closed loop:
1. **Ordered by Doctor** (task created with due date).
2. **Test Completed** (patient undergoes test).
3. **Report Received** (patient uploads report; status is `Report Submitted`, NOT verified).
4. **Checked by Staff** (coordinator audits OCR numbers side-by-side against the certified lab PDF).
5. **Reviewed by Doctor** (physician evaluates results, notes clinical plan, and resolves the loop).

---

## 🎭 3-Minute Hackathon Demo

1. **Doctor Orders a Test**: Switch to `Doctor`, click `+ Create Care Plan`, assign `HbA1c Blood Test` to `Alex Patel` with a 7-day due date.
2. **Patient Uploads Report**: Switch to `Patient`, view the `Next Step` card, click `Upload Report`, and submit a sample lab PDF. Notice the status updates to `Report Submitted` (it does **not** jump to completed).
3. **Staff Verifies**: Switch to `Coordinator`, go to `Reports to Verify`, click `Verify Report`, inspect the split-screen comparison, and click `Confirm Match & Route to Physician`.
4. **Doctor Reviews**: Switch to `Doctor`, click `Review Report` under `Needs Your Review`, record notes, and click `Sign Off & Resolve Care Loop`.
5. **Test Overdue Escalation**: In the top banner, click `Simulate Overdue Task` to demonstrate how missed tests immediately alert the coordinator.
