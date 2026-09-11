import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Delivery } from '@checkout/contracts';
import { useSession } from '../api/session';
import { createQuote, fetchCheckoutOptions } from '../api/endpoints';

export function useCheckoutOptions() {
  const { client } = useSession();
  return useQuery({
    queryKey: ['checkout-options'],
    queryFn: ({ signal }) => fetchCheckoutOptions(client, signal),
    staleTime: 60_000,
  });
}

export function useCreateQuote() {
  const { client } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { cartVersion: number; delivery: Delivery }) =>
      createQuote(client, input.cartVersion, input.delivery),
    onSuccess: (quote) => {
      queryClient.setQueryData(['quote', quote.id], quote);
    },
  });
}
