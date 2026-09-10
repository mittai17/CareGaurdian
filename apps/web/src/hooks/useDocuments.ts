import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Document } from '@baseline/types';

export function useDocuments(patientId: string) {
  return useQuery({
    queryKey: ['patients', patientId, 'documents'],
    queryFn: () => api.get<Document[]>(`/patients/${patientId}/documents`),
    enabled: !!patientId,
  });
}
