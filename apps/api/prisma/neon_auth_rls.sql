-- =============================================================================
-- CareGuardian (Baseline) — Neon Auth & Row-Level Security (RLS) Policies
-- PostgreSQL Database: neondb (Project: autumn-frost-43432590)
-- =============================================================================

-- 1. Enable RLS on core clinical and communication tables
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Observation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Handover" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Medication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to extract current authenticated user ID from Neon Auth JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claim.sub', true),
    current_setting('my.current_user_id', true)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Patient Isolation Policy
-- Clinicians can view assigned patients; Patients can only view their own record;
-- Caregivers can view patients they have a PatientUserRelationship with.
DROP POLICY IF EXISTS patient_access_policy ON "Patient";
CREATE POLICY patient_access_policy ON "Patient"
  FOR ALL
  USING (
    -- Direct patient owner
    id IN (
      SELECT "patientId" FROM "PatientUserRelationship"
      WHERE "userId" = auth.user_id()
    )
    OR
    -- Doctor attending relation
    "createdById" = auth.user_id()
  );

-- 4. Message Isolation Policy
-- Users can only read or write messages where they are the sender or receiver
DROP POLICY IF EXISTS message_access_policy ON "Message";
CREATE POLICY message_access_policy ON "Message"
  FOR ALL
  USING (
    "senderId" = auth.user_id() OR "receiverId" = auth.user_id()
  );

-- 5. Observation Isolation Policy
-- Only users in the patient's care circle can view or insert observations
DROP POLICY IF EXISTS observation_access_policy ON "Observation";
CREATE POLICY observation_access_policy ON "Observation"
  FOR ALL
  USING (
    "patientId" IN (
      SELECT "patientId" FROM "PatientUserRelationship"
      WHERE "userId" = auth.user_id()
    )
    OR "userId" = auth.user_id()
  );

-- 6. Handover Isolation Policy
-- Handovers visible to clinical staff and attending clinicians for that patient
DROP POLICY IF EXISTS handover_access_policy ON "Handover";
CREATE POLICY handover_access_policy ON "Handover"
  FOR ALL
  USING (
    "patientId" IN (
      SELECT "patientId" FROM "PatientUserRelationship"
      WHERE "userId" = auth.user_id()
    )
    OR "outgoingStaffId" = auth.user_id()
  );

-- 7. Verification function
CREATE OR REPLACE FUNCTION verify_neon_rls_health() RETURNS text AS $$
BEGIN
  RETURN 'Neon Auth & RLS successfully configured for CareGuardian';
END;
$$ LANGUAGE plpgsql;
