import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { getItemById, Item as StaticItem } from '@/lib/itemLoader';

type Item = StaticItem & { quantity?: number };

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

  const rawInventory = await sql`
    SELECT item_id, quantity FROM "UserInventory"
    WHERE user_id = ${user.id}
  `;

  const inventory: Item[] = rawInventory.map(({ item_id, quantity }) => {
    const base = getItemById(item_id);
    if (!base) return null;
    return { ...base, quantity };
  }).filter(Boolean) as Item[];

  const rawEquipment = await sql`
    SELECT slot, item_id FROM "UserEquipment"
    WHERE user_id = ${user.id}
  `;

  const equipment: Record<string, Item> = {};
  for (const row of rawEquipment) {
    const base = getItemById(row.item_id);
    if (base) equipment[row.slot] = base;
  }

  return NextResponse.json({ equipment, inventory });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    console.log('❌ Missing session-token cookie');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [user] = await sql`
    SELECT u.id FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  if (!user) {
    console.log('❌ Invalid session ID:', session.value);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const body = await req.json() as {
    equipment: Record<string, { id: number }>;
    inventory: { id: number; quantity?: number }[];
  };

  console.log('🛠 Received gear POST for user:', user.id);
  console.log('📦 Equipment:', body.equipment);
  console.log('🎒 Inventory:', body.inventory);

  try {
    await sql.begin(async (sql) => {
      await sql`DELETE FROM "UserEquipment" WHERE user_id = ${user.id}`;
      for (const [slot, item] of Object.entries(body.equipment)) {
        if (item?.id) {
          console.log(`➕ Equipping ${item.id} in slot ${slot}`);
          await sql`
            INSERT INTO "UserEquipment" (user_id, slot, item_id)
            VALUES (${user.id}, ${slot}, ${item.id})
          `;
        }
      }

      await sql`DELETE FROM "UserInventory" WHERE user_id = ${user.id}`;
      for (const item of body.inventory) {
        if (item?.id) {
          const qty = item.quantity ?? 1;
          console.log(`➕ Adding ${qty}x item ${item.id} to inventory`);
          await sql`
            INSERT INTO "UserInventory" (user_id, item_id, quantity)
            VALUES (${user.id}, ${item.id}, ${qty})
          `;
        }
      }
    });

    console.log('✅ Gear and inventory saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error during save transaction:', error);
    return NextResponse.json({ error: 'Failed to complete save.' }, { status: 500 });
  }
}
