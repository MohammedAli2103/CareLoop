# CareLoop / CareBridge — Healthcare Web Platform

CareLoop is an enterprise-grade healthcare web application connecting **Patients**, **Physicians**, **Care Coordinators**, and **Administrators** in a unified, secure ecosystem designed around HIPAA compliance, Row-Level Security (RLS), and two-factor authentication (2FA).

---

## 1. Visual Design & Showcase Parity

Built in exact accordance with the design specification in `CareLoop Healthcare App UI Showcase.png`:
- **Role Selection Landing Page**: 2x2 multi-role gateway with patient, doctor, coordinator, and administrator access pathways.
- **Patient Sign-In & Multi-Step Registration**: 4-stage progressive intake (Personal &rarr; Medical &rarr; Address & Emergency Contact &rarr; Review & Consent) with SMS OTP verification.
- **Doctor Sign-In & Registration**: Professional credentials collection (license number, specialization, hospital department) with admin approval gatekeeping.
- **Care Coordinator Portal**: Specialized intake and workflow management for care coordinators.
- **Administrator 2FA Authentication**: Email/password authentication followed by server-verified email OTP verification.
- **Administrator Management Suite**: Real-time KPI summary cards, staff approval/rejection queue, user directory, compliance reports, and audit trails.

---

## 2. Route Architecture

| Route | View Description | Protection / Access |
|---|---|---|
| `/` | Role Selection Landing Page | Public |
| `/patient/login` | Patient Phone Sign-in with SMS OTP | Public |
| `/patient/register` | Patient 4-Step Account Intake & Consent | Public |
| `/patient/verify-otp` | 6-Digit SMS OTP Verification & Resend Timer | Public |
| `/patient/dashboard` | Patient Portal (Care Plan, Visits, Lab Reports) | Authenticated Patient |
| `/doctor/login` | Physician Email/Password Sign-in | Public |
| `/doctor/register` | Doctor Credential Intake (Medical License, Specialization) | Public |
| `/doctor/dashboard` | Physician Dashboard with Pending Review Handling | Authenticated Doctor |
| `/coordinator/login` | Care Coordinator Email/Password Sign-in | Public |
| `/coordinator/register` | Care Coordinator Organization Intake | Public |
| `/coordinator/dashboard` | Coordinator Task & Outreach Dashboard | Authenticated Coordinator |
| `/admin/login` | Administrator Stage 1 (Email & Password) | Public |
| `/admin/verify-otp` | Administrator Stage 2 (Server-Verified 6-Digit Email OTP) | Authenticated Admin |
| `/admin/dashboard` | Administrator Dashboard (Stats, Quick Approval, Live Feeds) | Authenticated & 2FA Admin |
| `/admin/approvals` | Comprehensive Staff Verification & Approval/Rejection Suite | Authenticated & 2FA Admin |
| `/admin/users` | User Directory & Role/Status Management | Authenticated & 2FA Admin |
| `/admin/reports` | Healthcare Analytics & Compliance SLA Reports (CSV/JSON Export) | Authenticated & 2FA Admin |
| `/admin/activity` | Immutable Audit Logs with JSON Detail Inspector | Authenticated & 2FA Admin |
| `/admin/settings` | Infrastructure Settings & Provider Readiness Checklist | Authenticated & 2FA Admin |

---

## 3. Database Schema & Migrations

All migration scripts are located in `supabase/migrations/`:

### Migration Files
1. [`001_initial_schema.sql`](file:///C:/Users/mysss/OneDrive/Desktop/carebridge/supabase/migrations/001_initial_schema.sql)
   - Creates `profiles`, `patient_profiles`, `doctor_profiles`, `coordinator_profiles`.
   - Defines role constraints (`patient`, `doctor`, `coordinator`, `admin`) and status constraints (`active`, `pending`, `rejected`, `suspended`).
   - Configures triggers for automated `updated_at` management.

2. [`002_rls_policies.sql`](file:///C:/Users/mysss/OneDrive/Desktop/carebridge/supabase/migrations/002_rls_policies.sql)
   - Enables Row Level Security (RLS) across all tables.
   - Defines `is_admin()` and `is_approved_staff()` security helper functions.
   - Restricts patient records to the owning patient, assigned approved physicians, and system administrators.
   - Forbids self-registration with `admin` role at the database policy layer.

3. [`003_admin_otp_and_audit.sql`](file:///C:/Users/mysss/OneDrive/Desktop/carebridge/supabase/migrations/003_admin_otp_and_audit.sql)
   - Creates `audit_logs` and `admin_otps` tables.
   - Enforces SHA-256 salted hashing, 10-minute expiry, and 5-attempt lockdown on admin verification codes.
   - Provides security-definer stored procedures: `approve_staff()`, `reject_staff()`, `verify_admin_otp()`.

4. [`004_seed_and_provisioning.sql`](file:///C:/Users/mysss/OneDrive/Desktop/carebridge/supabase/migrations/004_seed_and_provisioning.sql)
   - Contains trigger preventing privilege escalation.
   - Instructions and SQL snippet for provisioning initial system administrator.

### How to Apply SQL Migrations to Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/zgbxpxhvjjixtikopzfu).
2. Navigate to **SQL Editor** in the left sidebar.
3. Sequentially copy and execute the contents of:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_admin_otp_and_audit.sql`
   - `supabase/migrations/004_seed_and_provisioning.sql`

---

## 4. Edge Functions

### Admin Email OTP Function
Located at [`supabase/functions/admin-otp/index.ts`](file:///C:/Users/mysss/OneDrive/Desktop/carebridge/supabase/functions/admin-otp/index.ts).
- Handles cryptographically secure 6-digit OTP generation (`crypto.getRandomValues`).
- Generates salt, calculates SHA-256 hash, stores securely in `admin_otps`.
- Dispatches verification emails via transactional email provider (Resend/SendGrid).
- Enforces server-side verification and logs audit events to `audit_logs`.

### Deploying the Edge Function
Using Supabase CLI:
```bash
supabase functions deploy admin-otp --no-verify-jwt
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

---

## 5. Third-Party Provider Configuration Checklist

### 1. SMS Provider (For Patient Phone Authentication)
- **Provider Options**: Twilio, MessageBird, or Supabase Phone Auth.
- **Where to configure**: Supabase Dashboard &rarr; **Authentication** &rarr; **Providers** &rarr; **Phone**.
- Enable Phone provider and enter your Twilio Account SID, Auth Token, and Message Service SID / Phone Number.

### 2. Transactional Email Provider (For Administrator 2FA OTP)
- **Provider Options**: Resend, SendGrid, or custom SMTP.
- **Where to configure**:
  - In Supabase Edge Functions: Set secret `RESEND_API_KEY`.
  - In Supabase Dashboard &rarr; **Project Settings** &rarr; **Authentication** &rarr; **SMTP Settings** for system transactional templates.

---

## 6. Secure Provisioning of the First Administrator

Because public registration cannot create administrator privileges, the initial admin account is provisioned privately:

1. Create a user account in the [Supabase Dashboard](https://supabase.com/dashboard/project/zgbxpxhvjjixtikopzfu) under **Authentication** &rarr; **Users** (e.g. `admin@careloop.com`).
2. Copy the generated User UID.
3. Run the following snippet in the **SQL Editor**:
```sql
INSERT INTO public.profiles (id, role, status, full_name, email, phone)
VALUES (
  '<PASTE_USER_UID_HERE>',
  'admin',
  'active',
  'CareLoop System Administrator',
  'admin@careloop.com',
  '+15550001122'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active';
```

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run TypeScript and production build
npm run build

# Run linting
npm run lint
```
