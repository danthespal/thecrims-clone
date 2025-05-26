'use client';

import useSWR from 'swr';
import { useCallback, useMemo, useState } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type BuyItemResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export default function useShop() {
  const { data, error, mutate, isValidating } = useSWR('/api/shop?action=list', fetcher);

  const [isBuying, setIsBuying] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BuyItemResult | null>(null);

  const items = useMemo(() => data ?? [], [data]);

  const buyItem = useCallback(async (itemId: number, quantity: number = 1): Promise<BuyItemResult> => {
    setIsBuying(true);
    setShopError(null);
    try {
      const res = await fetch('/api/shop?action=buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, quantity }),
      });
      const result: BuyItemResult = await res.json();
      setLastResult(result);
      if (result.success) await mutate();
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to buy item';
      setShopError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsBuying(false);
    }
  }, [mutate]);

  return {
    items,
    loading: !data && !error,
    error,
    isBuying,
    shopError,
    lastResult,
    buyItem,
    isValidating,
    refresh: mutate,
  };
}
