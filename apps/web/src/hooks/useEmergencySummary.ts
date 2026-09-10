import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { EmergencySummary } from '@baseline/types';

export function useEmergencySummary(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'emergency-summary'],
    queryFn: () => api.get<EmergencySummary>(`/patients/${patientId}/emergency-summary`),
    enabled: !!patientId,
  });
}
