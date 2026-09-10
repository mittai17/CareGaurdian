import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MissingInformation } from '@baseline/types';

export function useMissingInfo(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'missing-information'],
    queryFn: () => api.get<MissingInformation[]>(`/patients/${patientId}/missing-information`),
    enabled: !!patientId,
  });
}
