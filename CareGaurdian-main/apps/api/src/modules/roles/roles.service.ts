import { Injectable } from '@nestjs/common';
import { UserRole } from '@baseline/types';

export type Action = 'READ' | 'WRITE' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ANALYZE' | 'EMERGENCY_ACCESS';

export interface RolePolicy {
  resources: string[];
  actions: Action[];
  /** Extra capabilities not bound to a specific resource (e.g. manage users). */
  privileges?: string[];
}

/**
 * Static RBAC policy map: maps each UserRole to the resources and actions it
 * may access. This is the single source of truth for role-based authorization
 * across the platform. ABAC (AccessControlService) layers on top of this for
 * per-patient, per-consent decisions.
 */
export const ROLE_POLICY_MAP: Record<UserRole, RolePolicy> = {
  PATIENT: {
    resources: ['profile', 'condition', 'medication', 'allergy', 'observation', 'lab-result', 'encounter', 'health-event', 'document', 'consent'],
    actions: ['READ', 'WRITE', 'CREATE', 'UPDATE'],
    privileges: ['manage_own_consent'],
  },
  GUARDIAN: {
    resources: ['profile', 'condition', 'medication', 'allergy', 'observation', 'lab-result', 'encounter', 'health-event', 'document', 'consent', 'appointment'],
    actions: ['READ', 'WRITE', 'CREATE', 'UPDATE'],
    privileges: ['grant_consent', 'revoke_consent', 'manage_guardianship'],
  },
  FAMILY_CAREGIVER: {
    resources: ['profile', 'condition', 'medication', 'allergy', 'observation', 'lab-result', 'encounter', 'health-event', 'document'],
    actions: ['READ', 'WRITE', 'CREATE', 'UPDATE'],
    privileges: ['report_observation'],
  },
  PROFESSIONAL_CAREGIVER: {
    resources: ['profile', 'condition', 'medication', 'allergy', 'observation', 'lab-result', 'encounter', 'health-event', 'document', 'medication-schedule'],
    actions: ['READ', 'WRITE', 'CREATE', 'UPDATE'],
    privileges: ['report_observation', 'manage_medication_schedule'],
  },
  CLINICIAN: {
    resources: ['profile', 'condition', 'medication', 'allergy', 'observation', 'lab-result', 'encounter', 'health-event', 'document', 'assessment', 'baseline', 'risk-signal', 'episode'],
    actions: ['READ', 'WRITE', 'CREATE', 'UPDATE', 'ANALYZE'],
    privileges: ['review_risk_signal', 'create_baseline', 'manage_episode'],
  },
  PHARMACIST: {
    resources: ['medication', 'allergy', 'prescription', 'health-event'],
    actions: ['READ', 'WRITE', 'UPDATE'],
    privileges: ['review_medication_reconciliation'],
  },
  EMERGENCY_CLINICIAN: {
    resources: ['profile', 'condition', 'medication', 'allergy', 'observation', 'lab-result', 'encounter', 'health-event', 'document', 'emergency-summary'],
    actions: ['READ', 'EMERGENCY_ACCESS'],
    privileges: ['break_glass'],
  },
  ADMIN: {
    resources: ['*'],
    actions: ['READ', 'WRITE', 'CREATE', 'UPDATE', 'DELETE', 'ANALYZE', 'EMERGENCY_ACCESS'],
    privileges: ['manage_users', 'manage_organizations', 'view_audit_log', 'manage_all'],
  },
};

@Injectable()
export class RoleService {
  constructor() {}

  /** The full policy map — returned by GET /roles. */
  getPolicyMap(): Record<UserRole, RolePolicy> {
    return ROLE_POLICY_MAP;
  }

  /** Policies for a single role. */
  getPolicyForRole(role: UserRole): RolePolicy {
    return ROLE_POLICY_MAP[role];
  }

  /** Convenience: can a role read a given resource? */
  canRead(role: UserRole, resource: string): boolean {
    const policy = ROLE_POLICY_MAP[role];
    if (policy.resources.includes('*')) return true;
    return policy.resources.includes(resource);
  }

  /** Convenience: can a role perform a given action? */
  can(role: UserRole, action: Action): boolean {
    return ROLE_POLICY_MAP[role].actions.includes(action);
  }

  /** Convenience: does a role have a named privilege? */
  hasPrivilege(role: UserRole, privilege: string): boolean {
    return ROLE_POLICY_MAP[role].privileges?.includes(privilege) ?? false;
  }
}