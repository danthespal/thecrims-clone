import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/core/db';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { getItemById, Item as StaticItem } from '@/lib/game/itemLoader';
import { getUserFromSession } from '@/lib/session';

type Item = StaticItem & { quantity?: number };

const MAX_INVENTORY_ITEMS = 36;
const MAX_ITEM_QUANTITY = 1000;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  switch (action) {
    case 'save': {
      const body = await req.json() as {
        equipment: Record<string, { id: number }>;
        inventory: { id: number; quantity?: number }[];
      };

      if (body.inventory.length > MAX_INVENTORY_ITEMS) {
        return NextResponse.json({
          error: `Inventory exceeds maximum of ${MAX_INVENTORY_ITEMS} items.`,
        }, { status: 400 });
      }

      for (const item of body.inventory) {
        if ((item.quantity ?? 1) > MAX_ITEM_QUANTITY) {
          return NextResponse.json({
            error: `Item quantity too high (max ${MAX_ITEM_QUANTITY}).`,
          }, { status: 400 });
        }
      }

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
              const qty = Math.min(item.quantity ?? 1, MAX_ITEM_QUANTITY);
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

    case 'consume': {
      const { item_id } = await req.json();
      if (!item_id || typeof item_id !== 'number') {
        return NextResponse.json({ error: 'Invalid item_id' }, { status: 400 });
      }

      const item = await getItemById(item_id);
      if (!item || item.type !== 'drug') {
        return NextResponse.json({ error: 'Item is not a consumable drug' }, { status: 400 });
      }

      const [userRow] = await sql`
        SELECT will FROM "User" WHERE id = ${user.id}
      `;
      const [maxRow] = await sql`
        SELECT value FROM "GameSettings" WHERE key = 'max_will'
      `;
      const currentWill = userRow?.will ?? 0;
      const maxWill = parseInt(maxRow?.value ?? '100');
      const restore = item.will_restore ?? 0;

      const newWill = Math.min(currentWill + restore, maxWill);
      const actualRestored = newWill - currentWill;

      try {
        await sql.begin(async (tx) => {
          await tx`
            UPDATE "User" SET will = ${newWill}
            WHERE id = ${user.id}
          `;
          await tx`
            UPDATE "UserInventory"
            SET quantity = quantity - 1
            WHERE user_id = ${user.id} AND item_id = ${item_id}
          `;
          await tx`
            DELETE FROM "UserInventory"
            WHERE user_id = ${user.id} AND item_id = ${item_id} AND quantity <= 0
          `;
        });

        return NextResponse.json({
          success: true,
          message: `You consumed ${item.name} and restored ${actualRestored} will.`,
          will: newWill,
        });
      } catch (err) {
        console.error('❌ Error during consumption:', err);
        return NextResponse.json({ error: 'Failed to consume drug' }, { status: 500 });
      }
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
