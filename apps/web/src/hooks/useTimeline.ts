import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { HealthEvent } from '@baseline/types';

export interface TimelineRow extends HealthEvent {
  date: string;
}

export function useTimeline(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'timeline'],
    queryFn: () => api.get<TimelineRow[]>(`/patients/${patientId}/timeline`),
    select: (rows) =>
      rows.map((r) => ({ ...r, timestamp: r.date ?? r.timestamp })),
    enabled: !!patientId,
  });
}
