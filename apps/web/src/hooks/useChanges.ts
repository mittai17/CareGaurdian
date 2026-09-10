import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ChangeSignal } from '@baseline/types';

export function useChanges(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'changes'],
    queryFn: () => api.get<ChangeSignal[]>(`/patients/${patientId}/changes`),
    enabled: !!patientId,
  });
}
