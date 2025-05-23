'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useSession() {
    const { data, error, mutate } = useSWR('/api/user/session', fetcher, {
        refreshInterval: 30000, // 30s
    });

    return {
        session: data,
        loading: !data && !error,
        error,
        refresh: mutate,
    };
}