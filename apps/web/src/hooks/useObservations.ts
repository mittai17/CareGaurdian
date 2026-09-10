import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Observation } from '@baseline/types';

export function useObservations(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'observations'],
    queryFn: () => api.get<Observation[]>(`/patients/${patientId}/observations`),
    enabled: !!patientId,
  });
}
