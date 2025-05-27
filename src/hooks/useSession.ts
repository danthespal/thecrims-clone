'use client';

import useSWR from 'swr';
import { useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useSession() {
  const { data, error, mutate } = useSWR('/api/user?action=session', fetcher);

  useEffect(() => {
    const handler = () => mutate();
    window.addEventListener('user:update', handler);
    return () => window.removeEventListener('user:update', handler);
  }, [mutate]);

  return {
    session: data,
    loading: !data && !error,
    error,
    refresh: mutate,
  };
}
