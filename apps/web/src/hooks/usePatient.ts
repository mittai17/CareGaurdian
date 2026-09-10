import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Patient } from '@baseline/types';

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => api.get<Patient>(`/patients/${id}`),
    enabled: !!id,
  });
}
