'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useItems() {
    const { data, error, mutate } = useSWR('/api/items?action=all', fetcher);

    return {
        items: data?.items ?? [],
        loading: !data && !error,
        error,
        refresh: mutate,
    };
}