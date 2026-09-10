import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { HealthGraph } from '@baseline/types';

export function useHealthGraph(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'health-graph'],
    queryFn: () => api.get<HealthGraph>(`/patients/${patientId}/health-graph`),
    enabled: !!patientId,
  });
}
