'use client';

import { createContext, useContext } from 'react';
import useSWR from 'swr';
import useSession from '@/hooks/useSession';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type CasinoBalanceContextType = {
  balance: number;
  refresh: () => void;
  loading: boolean;
};

const CasinoBalanceContext = createContext<CasinoBalanceContextType | undefined>(undefined);

export function CasinoBalanceProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const isAuthenticated = session?.authenticated;

  const { data, error, mutate } = useSWR(
    isAuthenticated ? '/api/casino?action=history' : null,
    fetcher
  );

  const balance = data?.totals?.total_deposit - data?.totals?.total_withdraw || 0;

  return (
    <CasinoBalanceContext.Provider
      value={{
        balance,
        refresh: mutate,
        loading: isAuthenticated ? !data && !error : false,
      }}
    >
      {children}
    </CasinoBalanceContext.Provider>
  );
}

export function useCasinoBalance() {
  const ctx = useContext(CasinoBalanceContext);
  if (!ctx) throw new Error('useCasinoBalance must be used within CasinoBalanceProvider');
  return ctx;
}
