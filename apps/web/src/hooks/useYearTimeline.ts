import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { YearTimelineResult } from '@baseline/types';

export function useYearTimeline(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'year-timeline'],
    queryFn: () => api.get<YearTimelineResult>(`/patients/${patientId}/year-timeline`),
    enabled: !!patientId,
  });
}