import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Patient } from '@baseline/types';

interface PatientSummary {
  patient: Patient;
  summary: Record<string, unknown>;
}

export function usePatientSummary(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'summary'],
    queryFn: () => api.get<PatientSummary>(`/patients/${patientId}/summary`),
    enabled: !!patientId,
  });
}
