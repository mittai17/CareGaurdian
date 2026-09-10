import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { HealthMemoryFact } from '@baseline/types';

export function useMemory(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'memory'],
    queryFn: () => api.get<HealthMemoryFact[]>(`/patients/${patientId}/memory`),
    enabled: !!patientId,
  });
}
