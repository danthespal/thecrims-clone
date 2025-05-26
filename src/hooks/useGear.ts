'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useGear() {
    const { data, error, mutate } = useSWR('/api/gear?action=load', fetcher);

    return {
        equipment: data?.equipment ?? {},
        inventory: data?.inventory ?? [],
        loading: !data && !error,
        error,
        refresh: mutate,
    };
}