import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Contradiction } from '@baseline/types';

export function useContradictions(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'contradictions'],
    queryFn: () => api.get<Contradiction[]>(`/patients/${patientId}/contradictions`),
    enabled: !!patientId,
  });
}
