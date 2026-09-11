import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Scenario } from '@checkout/contracts';
import { useSession } from '../api/session';
import {
  createPaymentAttempt,
  fetchOrderPayments,
  fetchPayment,
  simulatePayment,
} from '../api/endpoints';

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled']);

export function useLatestPaymentAttempt(orderId: string | null) {
  const { client } = useSession();
  return useQuery({
    queryKey: ['order-payments', orderId],
    queryFn: ({ signal }) => fetchOrderPayments(client, orderId!, signal),
    enabled: orderId !== null,
    select: (payments) => payments[0] ?? null,
  });
}

export function usePayment(paymentId: string | null, pollIntervalMs: number) {
  const { client } = useSession();
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: ({ signal }) => fetchPayment(client, paymentId!, signal),
    enabled: paymentId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.has(status)) return false;
      return pollIntervalMs;
    },
  });
}

export function useCreatePaymentAttempt() {
  const { client } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { orderId: string; idempotencyKey: string }) =>
      createPaymentAttempt(client, input.orderId, input.idempotencyKey),
    onSuccess: (payment, input) => {
      queryClient.setQueryData(['payment', payment.id], payment);
      queryClient.invalidateQueries({ queryKey: ['order-payments', input.orderId] });
    },
  });
}

export function useSimulatePayment() {
  const { client } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { paymentId: string; scenario: Scenario }) =>
      simulatePayment(client, input.paymentId, input.scenario),
    onSuccess: ({ data: simulation }, input) => {
      queryClient.setQueryData(
        ['payment', input.paymentId],
        (current: { status: string } | undefined) =>
          current ? { ...current, status: simulation.status } : current,
      );
    },
  });
}
