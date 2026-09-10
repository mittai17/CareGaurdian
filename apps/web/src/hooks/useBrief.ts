import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ClinicalBrief } from '@baseline/types';

export function useBrief(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'clinical-brief'],
    queryFn: () => api.get<ClinicalBrief>(`/patients/${patientId}/clinical-brief`),
    enabled: !!patientId,
  });
}
