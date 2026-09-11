import { useQuery } from '@tanstack/react-query';
import { useSession } from '../api/session';
import { fetchProducts, fetchSandbox } from '../api/endpoints';

export function useProducts() {
  const { client } = useSession();
  return useQuery({
    queryKey: ['products'],
    queryFn: ({ signal }) => fetchProducts(client, signal),
    staleTime: 60_000,
  });
}

export function useSandboxCards() {
  const { client } = useSession();
  return useQuery({
    queryKey: ['sandbox'],
    queryFn: ({ signal }) => fetchSandbox(client, signal),
    staleTime: 60_000,
  });
}
