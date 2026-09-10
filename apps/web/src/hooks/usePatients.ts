import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Patient } from '@baseline/types';

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get<Patient[]>('/patients'),
  });
}
