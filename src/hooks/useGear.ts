'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useGear() {
  const { data, error, mutate } = useSWR('/api/gear?action=load', fetcher);

  const stableEquipment = useMemo(() => data?.equipment ?? {}, [data?.equipment]);
  const stableInventory = useMemo(() => data?.inventory ?? [], [data?.inventory]);

  return {
    equipment: stableEquipment,
    inventory: stableInventory,
    loading: !data && !error,
    error,
    refresh: mutate,
  };
}
