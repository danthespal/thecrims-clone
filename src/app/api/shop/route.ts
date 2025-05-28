import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/core/db';
import { getUserFromSession } from '@/lib/session';
import { getItemById } from '@/lib/game/itemLoader';
import { checkRateLimit } from '@/lib/core/rateLimiter';
import { ShopActionSchema, ShopPurchaseSchema } from '@/lib/schemas/shopSchema';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'list') {
    const items = await sql`
      SELECT id, name, description, type, price, will_restore
      FROM "Items"
      ORDER BY price ASC
    `;
    return NextResponse.json(items);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const actionRaw = req.nextUrl.searchParams.get('action');

  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsedAction = ShopActionSchema.safeParse(actionRaw);
  if (!parsedAction.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const action = parsedAction.data;

  const body = await req.json();
  const parsedBody = ShopPurchaseSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsedBody.error.flatten() }, { status: 400 });
  }

  const { item_id, quantity } = parsedBody.data;

  const item = await getItemById(item_id);
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const [userRow] = await sql`
    SELECT money FROM "User" WHERE id = ${user.id}
  `;
  const currentMoney = userRow?.money ?? 0;

  if (action === 'buy') {
    const totalCost = item.price * quantity;
    if (currentMoney < totalCost) {
      return NextResponse.json({ error: 'Insufficient funds ' }, { status: 400 });
    }

    try {
      await sql.begin(async (tx) => {
        await tx`
          INSERT INTO "UserInventory" (user_id, item_id, quantity)
          VALUES (${user.id}, ${item.id}, ${quantity})
          ON CONFLICT (user_id, item_id)
          DO UPDATE SET quantity = "UserInventory".quantity + ${quantity}
        `;
        await tx`
          UPDATE "User" SET money = money - ${totalCost}
          WHERE id = ${user.id}
        `;
      });

      return NextResponse.json({
        success: true,
        message: `${item.name} purchased for $${totalCost}`,
        spent: totalCost,
      });
    } catch (error) {
      console.error('Buy error:', error);
      return NextResponse.json({ error: 'Failed to complete purchase' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}