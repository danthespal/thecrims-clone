import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

type Item = {
  id: number;
  name: string;
  description?: string;
  type: string;
  quantity?: number;
};

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [user] = await sql`
    SELECT u.id FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const body = await req.json() as {
    equipment: Record<string, Item>;
    inventory: Item[];
  };

  await sql.begin(async (sql) => {
    await sql`DELETE FROM "UserEquipment" WHERE user_id = ${user.id}`;
    for (const [slot, item] of Object.entries(body.equipment)) {
      if (item?.id) {
        await sql`
          INSERT INTO "UserEquipment" (user_id, slot, item_id)
          VALUES (${user.id}, ${slot}, ${item.id})
        `;
      }
    }

    await sql`DELETE FROM "UserInventory" WHERE user_id = ${user.id}`;
    for (const item of body.inventory) {
      if (item?.id && item?.quantity) {
        await sql`
          INSERT INTO "UserInventory" (user_id, item_id, quantity)
          VALUES (${user.id}, ${item.id}, ${item.quantity})
        `;
      }
    }
  });

  return NextResponse.json({ success: true });
}
