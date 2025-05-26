import { ApiResponse } from '@/types/api';

export async function buyItem(item_id: number): Promise<ApiResponse> {
    const res = await fetch('/api/shop?action=buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id }),
    });

    const data = await res.json();
    return { success: res.ok && !data.error, ...data };
}