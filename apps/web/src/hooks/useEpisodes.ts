import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Episode } from '@baseline/types';

export function useEpisodes(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'episodes'],
    queryFn: () => api.get<Episode[]>(`/patients/${patientId}/episodes`),
    enabled: !!patientId,
  });
}
