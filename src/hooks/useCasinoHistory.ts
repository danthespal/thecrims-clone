'use client';

import useSWR from 'swr';
import useSession from '@/hooks/useSession';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useCasinoHistory() {
  const { session } = useSession();

  const shouldFetch = session?.authenticated;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? '/api/casino?action=history' : null,
    fetcher
  );

  return {
    transactions: data?.transactions ?? [],
    totals: data?.totals ?? {},
    loading: isLoading,
    error,
  };
}
