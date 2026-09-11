import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrder } from '@checkout/contracts';
import { useSession } from '../api/session';
import { createOrder, fetchOrder } from '../api/endpoints';
import { cartKey } from './useCart';

const RESOLVED_STATUSES = new Set(['paid', 'confirmed']);

export function useOrder(orderId: string | null, waitForResolution = false) {
  const { client } = useSession();
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: ({ signal }) => fetchOrder(client, orderId!, signal),
    enabled: orderId !== null,
    refetchInterval: waitForResolution
      ? (query) =>
          query.state.data && RESOLVED_STATUSES.has(query.state.data.status) ? false : 1000
      : false,
  });
}

export function useCreateOrder() {
  const { client } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: CreateOrder; idempotencyKey: string }) =>
      createOrder(client, input.body, input.idempotencyKey),
    onSuccess: (order) => {
      queryClient.setQueryData(['order', order.id], order);
      queryClient.invalidateQueries({ queryKey: cartKey });
    },
  });
}
