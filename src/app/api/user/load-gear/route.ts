import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

type Item = {
  id: number;
  name: string;
  description: string;
  type: string;
};

export async function GET() {
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

  const equipmentRows = await sql`
    SELECT slot, i.id, i.name, i.description, i.type
    FROM "UserEquipment" ue
    JOIN "Items" i ON ue.item_id = i.id
    WHERE ue.user_id = ${user.id}
  `;

  const inventory = await sql`
    SELECT i.id, i.name, i.description, i.type, ui.quantity
    FROM "UserInventory" ui
    JOIN "Items" i ON ui.item_id = i.id
    WHERE ui.user_id = ${user.id}
  `;

  const equipmentMap: Record<string, Item> = {};
  for (const row of equipmentRows) {
    const { slot, id, name, description, type } = row;
    equipmentMap[slot] = { id, name, description, type };
  }

  return NextResponse.json({
    equipment: equipmentMap,
    inventory,
  });
}
