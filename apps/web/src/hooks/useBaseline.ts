import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Baseline } from '@baseline/types';

export function useBaseline(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'baseline'],
    queryFn: () => api.get<Baseline>(`/patients/${patientId}/baseline`),
    enabled: !!patientId,
  });
}
