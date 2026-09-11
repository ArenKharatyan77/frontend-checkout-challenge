import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../api/session';
import { fetchCart, removeCartItem, setCartItem } from '../api/endpoints';

export const cartKey = ['cart'];

export function useCart() {
  const { client } = useSession();
  return useQuery({
    queryKey: cartKey,
    queryFn: ({ signal }) => fetchCart(client, signal),
  });
}

export function useSetCartItem() {
  const { client } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      setCartItem(client, input.productId, input.quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey }),
  });
}

export function useRemoveCartItem() {
  const { client } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeCartItem(client, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey }),
  });
}
