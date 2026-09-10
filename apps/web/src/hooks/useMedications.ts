import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Medication } from '@baseline/types';

export function useMedications(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'medications'],
    queryFn: () => api.get<Medication[]>(`/patients/${patientId}/medications`),
    enabled: !!patientId,
  });
}
