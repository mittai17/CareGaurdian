import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Notification } from '@baseline/types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  });
}
