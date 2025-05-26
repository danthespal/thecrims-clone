'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useCasinoHistory() {
    const { data, error, mutate } = useSWR('/api/casino?action=history', fetcher);

    return {
        transactions: data?.transactions ?? [],
        totals: data?.totals ?? null,
        loading: !data && !error,
        refresh: mutate,
    };
}