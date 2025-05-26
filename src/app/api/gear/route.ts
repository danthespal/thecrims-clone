import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/core/db';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { getItemById, Item as StaticItem } from '@/lib/game/itemLoader';

type Item = StaticItem & { quantity?: number };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

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

  switch (action) {
    case 'load': {
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

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

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

  switch (action) {
    case 'save': {
      const body = await req.json() as {
        equipment: Record<string, { id: number }>;
        inventory: { id: number; quantity?: number }[];
      };

      try {
        await sql.begin(async (tx) => {
          await tx`DELETE FROM "UserEquipment" WHERE user_id = ${user.id}`;
          for (const [slot, item] of Object.entries(body.equipment)) {
            if (item?.id) {
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
              await tx`
                INSERT INTO "UserInventory" (user_id, item_id, quantity)
                VALUES (${user.id}, ${item.id}, ${qty})
              `;
            }
          }
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('❌ Error during save transaction:', error);
        return NextResponse.json({ error: 'Failed to complete save.' }, { status: 500 });
      }
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
