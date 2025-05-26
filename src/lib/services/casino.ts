import { ApiResponse } from '@/types/api';

export async function depositToCasino(amount: number): Promise<ApiResponse> {
  const res = await fetch('/api/casino?action=deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });

  const data = await res.json();
  return { success: res.ok && data.success, ...data };
}

export async function withdrawFromCasino(amount: number): Promise<ApiResponse> {
  const res = await fetch('/api/casino?action=withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });

  const data = await res.json();
  return { success: res.ok && data.success, ...data };
}