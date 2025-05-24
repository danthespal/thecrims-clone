import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { getItemById, Item as StaticItem } from '@/lib/itemLoader';
import { checkRateLimit } from '@/lib/rateLimiter';

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

  const inventory: Item[] = [];
  for (const { item_id, quantity } of rawInventory) {
    const base = await getItemById(item_id);
    if (!base) {
      console.warn(`❌ Unknown item_id in inventory: ${item_id}`);
      continue;
    }
    inventory.push({ ...base, quantity });
  }

  const rawEquipment = await sql`
    SELECT slot, item_id FROM "UserEquipment"
    WHERE user_id = ${user.id}
  `;

  const equipment: Record<string, Item> = {};
  for (const row of rawEquipment) {
    const base = await getItemById(row.item_id);
    if (base) {
      equipment[row.slot] = base;
    } else {
      console.warn(`❌ Unknown item_id in equipment: ${row.item_id}`);
    }
  }

  return NextResponse.json({ equipment, inventory });
}

export async function POST(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

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
    await sql.begin(async (tx) => {
      await tx`DELETE FROM "UserEquipment" WHERE user_id = ${user.id}`;
      for (const [slot, item] of Object.entries(body.equipment)) {
        if (item?.id) {
          console.log(`➕ Equipping ${item.id} in slot ${slot}`);
          await tx`
            INSERT INTO "UserEquipment" (user_id, slot, item_id)
            VALUES (${user.id}, ${slot}, ${item.id})
          `;
        }
      }

      await tx`DELETE FROM "UserInventory" WHERE user_id = ${user.id}`;
      for (const item of body.inventory) {
        if (item?.id) {
          const qty = item.quantity ?? 1;
          console.log(`➕ Adding ${qty}x item ${item.id} to inventory`);
          await tx`
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
