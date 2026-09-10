import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface CareCircleMember {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  relationshipType: string;
  observationCount: number;
  lastObservationAt: string | null;
}

export function useCareCircle(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'care-circle'],
    queryFn: () => api.get<CareCircleMember[]>(`/patients/${patientId}/care-circle`),
    enabled: !!patientId,
  });
}
