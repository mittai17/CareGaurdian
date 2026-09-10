import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ChangeSinceVisit } from '@baseline/types';

export function useWhatChanged(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'what-changed'],
    queryFn: () => api.get<ChangeSinceVisit>(`/patients/${patientId}/what-changed`),
    enabled: !!patientId,
  });
}
