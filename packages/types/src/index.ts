export type UserRole =
  | 'PATIENT'
  | 'GUARDIAN'
  | 'FAMILY_CAREGIVER'
  | 'PROFESSIONAL_CAREGIVER'
  | 'CLINICIAN'
  | 'PHARMACIST'
  | 'EMERGENCY_CLINICIAN'
  | 'ADMIN';

export type UUID = string;
export type ISODateTime = string;

export type MemoryType = 'FACT' | 'OBSERVATION' | 'INFERENCE';

export type VerificationStatus = 'UNVERIFIED' | 'DOCUMENTED' | 'CLINICALLY_VERIFIED' | 'REPORTED';

export type ConfidenceLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'INSUFFICIENT_DATA';

export type Severity = 'NORMAL' | 'ATTENTION' | 'REVIEW' | 'CRITICAL' | 'UNKNOWN';

export type SignalType =
  | 'CHANGE_SIGNAL'
  | 'MULTI_DOMAIN_CHANGE'
  | 'PERSONAL_PATTERN_MATCH'
  | 'FUNCTIONAL_DECLINE_SIGNAL'
  | 'MEDICATION_SIGNAL'
  | 'COGNITIVE_SIGNAL';

export type EventType =
  | 'MEDICATION_STARTED'
  | 'MEDICATION_STOPPED'
  | 'MEDICATION_CHANGED'
  | 'MISSED_MEDICATION'
  | 'FALL'
  | 'NEAR_FALL'
  | 'HOSPITALIZATION'
  | 'ER_VISIT'
  | 'SYMPTOM'
  | 'COGNITIVE_CHANGE'
  | 'FUNCTIONAL_CHANGE'
  | 'APPETITE_CHANGE'
  | 'SLEEP_CHANGE'
  | 'MOBILITY_CHANGE'
  | 'CAREGIVER_OBSERVATION'
  | 'LAB_RESULT'
  | 'PROCEDURE'
  | 'DIAGNOSIS'
  | 'ASSESSMENT'
  | 'MEDICATION_REMINDER'
  | 'CHECK_IN'
  | 'CONTACT';

export type EventStatus = 'REPORTED' | 'VERIFIED' | 'CORRECTED' | 'REJECTED';

export type SourceType =
  | 'CAREGIVER'
  | 'PATIENT'
  | 'CLINICIAN'
  | 'PHARMACIST'
  | 'DOCUMENT'
  | 'FHIR'
  | 'ML'
  | 'SYSTEM';

export type ObservationCategory =
  | 'CONFUSION'
  | 'FALL'
  | 'NEAR_FALL'
  | 'APPETITE'
  | 'SLEEP'
  | 'MOBILITY'
  | 'MOOD'
  | 'PAIN'
  | 'MEDICATION'
  | 'OTHER';

export type BaselineMetricType =
  | 'COGNITION'
  | 'MOBILITY'
  | 'WALKING'
  | 'SLEEP'
  | 'APPETITE'
  | 'MEDICATION_ADHERENCE'
  | 'MOOD'
  | 'PAIN'
  | 'DAILY_ACTIVITY'
  | 'ADLS'
  | 'IADLS'
  | 'WEIGHT'
  | 'BLOOD_PRESSURE'
  | 'GLUCOSE';

export type AuditAction =
  | 'LOGIN'
  | 'VIEW_PATIENT'
  | 'VIEW_DOCUMENT'
  | 'VIEW_MEDICATION'
  | 'CREATE_OBSERVATION'
  | 'UPDATE_CONSENT'
  | 'GRANT_ACCESS'
  | 'REVOKE_ACCESS'
  | 'BREAK_GLASS_ACCESS'
  | 'AI_ANALYSIS'
  | 'AI_ALERT'
  | 'EXPORT_DATA'
  | 'CREATE_EPISODE'
  | 'UPDATE_EPISODE'
  | 'CREATE_BASELINE'
  | 'REVIEW_SIGNAL';

export interface User {
  id: UUID;
  email: string;
  name: string;
  roles: UserRole[];
  organizationId?: string | null;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: UUID;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  timezone: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Condition {
  id: UUID;
  patientId: UUID;
  name: string;
  code?: string | null;
  codeSystem?: string | null;
  diagnosedAt?: string | null;
  resolvedAt?: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'INACTIVE' | 'SUSPECTED';
  verificationStatus: VerificationStatus;
  notes?: string | null;
}

export interface Allergy {
  id: UUID;
  patientId: UUID;
  allergen: string;
  reaction?: string | null;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE' | 'UNKNOWN' | null;
  recordedAt: string;
  verificationStatus: VerificationStatus;
}

export interface Medication {
  id: UUID;
  patientId: UUID;
  name: string;
  genericName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  startedAt?: string | null;
  stoppedAt?: string | null;
  status: 'ACTIVE' | 'DISCONTINUED' | 'PROPOSED' | 'PAUSED';
  prescribedBy?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationEvent {
  id: UUID;
  patientId: UUID;
  medicationId?: string | null;
  medicationName: string;
  type: 'STARTED' | 'STOPPED' | 'CHANGED' | 'MISSED' | 'TAKEN' | 'ADHERENCE';
  occurredAt: string;
  reason?: string | null;
  sourceType: SourceType;
}

export interface Observation {
  id: UUID;
  patientId: UUID;
  sourceUserId?: string | null;
  sourceType: SourceType;
  category: ObservationCategory;
  rawText?: string | null;
  structured: Record<string, unknown>;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE' | null;
  duration?: string | null;
  occurredAt: string;
  verificationStatus: VerificationStatus;
  attachments?: string[];
  createdAt: string;
}

export interface LabResult {
  id: UUID;
  patientId: UUID;
  testName: string;
  value: string;
  unit?: string | null;
  referenceRange?: string | null;
  collectedAt: string;
  interpretation?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL' | 'UNKNOWN' | null;
}

export interface Encounter {
  id: UUID;
  patientId: UUID;
  providerName?: string | null;
  type: string;
  reason?: string | null;
  startedAt: string;
  endedAt?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface HealthEvent {
  id: UUID;
  patientId: UUID;
  type: EventType;
  timestamp: string;
  sourceType: SourceType;
  sourceId?: string | null;
  status: EventStatus;
  confidence: number;
  description?: string | null;
  metadata: Record<string, unknown>;
  episodeId?: string | null;
  createdAt: string;
}

export interface HealthMemoryFact {
  id: UUID;
  patientId: UUID;
  memoryType: MemoryType;
  category: string;
  content: string;
  provenance: Provenance;
  createdAt: string;
  updatedAt: string;
}

export interface Provenance {
  sourceType: SourceType;
  sourceId?: string | null;
  sourceDescription?: string | null;
  recordedAt: string;
  documentId?: string | null;
  pageRef?: string | null;
  verified: boolean;
  verifiedBy?: string | null;
}

export interface Baseline {
  id: UUID;
  patientId: UUID;
  status: 'COMPUTED' | 'INSUFFICIENT_DATA' | 'STALE';
  computedAt: string;
  metrics: BaselineMetric[];
}

export interface BaselineMetric {
  id: UUID;
  baselineId: UUID;
  metric: BaselineMetricType;
  value: number | null;
  unit?: string | null;
  timeWindowDays: number;
  sampleSize: number;
  confidence: ConfidenceLevel;
  sourceCount: number;
  lastUpdated: string;
  stdDev?: number | null;
}

export interface ChangeSignal {
  id: UUID;
  patientId: UUID;
  signalType: SignalType;
  severity: Severity;
  confidenceLevel: ConfidenceLevel;
  summary: string;
  metrics: MetricDeviation[];
  evidenceIds: string[];
  supportingSignals: string[];
  contradictions: string[];
  dataGaps: string[];
  generatedAt: string;
  requiresHumanReview: boolean;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'RESOLVED';
}

export interface MetricDeviation {
  metric: BaselineMetricType;
  baseline: number;
  current: number;
  deviationPercent: number;
  timeWindowDays: number;
  confidence: ConfidenceLevel;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN';
}

export interface Episode {
  id: UUID;
  patientId: UUID;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  outcome?: 'HOSPITALIZATION' | 'ER_VISIT' | 'MEDICATION_CHANGE' | 'RESOLVED' | 'ACUTE_EVENT' | 'ONGOING' | null;
  severity?: Severity | null;
  symptoms: string[];
  medicationsInvolved: string[];
  functionalChanges: string[];
  cognitiveChanges: string[];
  createdAt: string;
}

export interface EpisodeMatch {
  similarityScore: number;
  matchedEpisodeId: string;
  matchedEpisodeTitle: string;
  matchingSignals: string[];
  missingSignals: string[];
  confidence: ConfidenceLevel;
  matchedAt: string;
}

export interface Contradiction {
  id: UUID;
  patientId: UUID;
  type:
    | 'ALLERGY_CONFLICT'
    | 'MEDICATION_CONFLICT'
    | 'DOSAGE_CONFLICT'
    | 'HISTORY_CONFLICT'
    | 'PROCEDURE_CONFLICT'
    | 'OTHER';
  description: string;
  evidenceA: string;
  evidenceB: string;
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  confidence: ConfidenceLevel;
}

export interface MissingInformation {
  id: UUID;
  patientId: UUID;
  category: string;
  description: string;
  severity: Severity;
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
}

export interface Consent {
  id: UUID;
  patientId: UUID;
  grantorId: UUID;
  recipientId: UUID;
  recipientType: UserRole;
  dataScope: string[];
  purpose: string;
  startDate: string;
  expirationDate?: string | null;
  revokedAt?: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'PENDING';
  createdAt: string;
}

export interface Permission {
  id: UUID;
  consentId: UUID;
  resource: string;
  action: 'READ' | 'WRITE' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ANALYZE' | 'EMERGENCY_ACCESS';
  allowed: boolean;
}

export interface GuardianRelationship {
  id: UUID;
  patientId: UUID;
  guardianUserId: UUID;
  relationship: 'LEGAL_GUARDIAN' | 'POWER_OF_ATTORNEY' | 'PARENT' | 'SPOUSE' | 'CHILD' | 'OTHER';
  startsAt: string;
  endsAt?: string | null;
  documentRef?: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface AuditEntry {
  id: UUID;
  actorId?: string | null;
  patientId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  timestamp: string;
  purpose: string;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  metadata?: Record<string, unknown> | null;
}

export interface AgentRun {
  id: UUID;
  patientId: UUID;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  agentsRun: string[];
  result: Record<string, unknown> | null;
  error?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

export interface Notification {
  id: UUID;
  userId: UUID;
  patientId?: string | null;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface ClinicianFeedback {
  id: UUID;
  signalId: UUID;
  clinicianId: UUID;
  verdict: 'CONFIRMED' | 'REJECTED' | 'UNCLEAR';
  comments?: string | null;
  createdAt: string;
}

export interface Document {
  id: UUID;
  patientId: UUID;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  documentType: string;
  uploadedBy: UUID;
  parsedText?: string | null;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DocumentChunk {
  id: UUID;
  documentId: UUID;
  patientId: UUID;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AgentSignal {
  agent: string;
  signal: string;
  confidence: number;
  evidenceIds: string[];
  reason: string;
}

export interface ConsensusResult {
  signalType: SignalType;
  severity: Severity;
  confidenceLevel: ConfidenceLevel;
  summary: string;
  evidenceIds: string[];
  supportingSignals: Array<{ agent: string; signal: string; confidence: number }>;
  contradictions: string[];
  dataGaps: string[];
  requiresHumanReview: boolean;
}

export interface ClinicalBrief {
  patientId: UUID;
  overallState: Severity;
  whyNow: string[];
  historicalMatches: Array<{ episodeId: UUID; title: string; similarity: number }>;
  evidence: string[];
  contradictions: Contradiction[];
  dataGaps: MissingInformation[];
  confidence: ConfidenceLevel;
  status: string;
  generatedAt: string;
}

export type YearStatus = 'GOOD' | 'STABLE' | 'WATCH' | 'CONCERN' | 'CRITICAL';

export interface YearSource {
  sourceType: string;
  count: number;
}

export interface YearEvent {
  id: UUID;
  type: string;
  timestamp: string;
  description?: string;
  sourceType: string;
  status: string;
  episodeId?: string;
}

export interface YearMetrics {
  events: number;
  hospitalizations: number;
  erVisits: number;
  falls: number;
  nearFalls: number;
  medicationChanges: number;
  missedMedications: number;
  cognitiveChanges: number;
  functionalChanges: number;
  observations: number;
  signals: number;
  episodes: number;
  contradictions: number;
}

export interface YearSummary {
  year: number;
  status: YearStatus;
  label: string;
  summary: string;
  reasons: string[];
  metrics: YearMetrics;
  events: YearEvent[];
  episodeTitles: string[];
  sources: YearSource[];
}

export interface YearTimelineResult {
  patientId: UUID;
  currentYear: number;
  years: YearSummary[];
}

export interface ChangeSinceVisit {
  patientId: UUID;
  since: string;
  sections: {
    new: string[];
    changed: string[];
    improved: string[];
    resolved: string[];
    unchanged: string[];
    unknown: string[];
  };
  medications: { added: string[]; changed: string[]; stopped: string[] };
  cognition: string[];
}

export interface EmergencySummary {
  criticalAllergies: Allergy[];
  currentMedications: Medication[];
  majorConditions: Condition[];
  recentHospitalizations: HealthEvent[];
  importantProcedures: HealthEvent[];
  criticalCareInfo: string[];
  emergencyContact: { name: string; phone: string };
}

export interface HealthGraphNode {
  id: UUID;
  type:
    | 'MEDICATION'
    | 'SYMPTOM'
    | 'OBSERVATION'
    | 'LAB'
    | 'FALL'
    | 'HOSPITALIZATION'
    | 'CONDITION'
    | 'EPISODE';
  label: string;
  date?: string | null;
}

export interface HealthGraphEdge {
  from: UUID;
  to: UUID;
  relation:
    | 'PRECEDED'
    | 'FOLLOWED'
    | 'OCCURRED_WITH'
    | 'RELATED_TO'
    | 'SAME_EPISODE'
    | 'POTENTIAL_ASSOCIATION'
    | 'TEMPORAL_ASSOCIATION';
  strength: number;
  evidenceIds: UUID[];
}

export interface HealthGraph {
  patientId: UUID;
  nodes: HealthGraphNode[];
  edges: HealthGraphEdge[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}