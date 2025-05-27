'use client';

import useSWR from 'swr';
import useSession from '@/hooks/useSession';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useGear() {
  const { session } = useSession();

  const shouldFetch = session?.authenticated;
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? '/api/gear?action=load' : null,
    fetcher
  );

  return {
    equipment: data?.equipment ?? {},
    inventory: data?.inventory ?? [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
