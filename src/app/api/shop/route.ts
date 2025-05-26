import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getUserFromSession } from '@/lib/session';
import { getItemById } from '@/lib/itemLoader';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  const limitRes = checkRateLimit(req);
  if (limitRes) return limitRes;

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { item_id } = await req.json();
  if (!item_id || typeof item_id !== 'number') {
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
  }

  const item = await getItemById(item_id);
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const [fetched] = await sql`
    SELECT money FROM "User" WHERE id = ${user.id}
  `;

  if (!fetched || fetched.money < item.price) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
  }

  try {
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO "UserInventory" (user_id, item_id, quantity)
        VALUES (${user.id}, ${item.id}, 1)
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET quantity = "UserInventory".quantity + 1
      `;

      await tx`
        UPDATE "User" SET money = money - ${item.price}
        WHERE id = ${user.id}
      `;
    });

    return NextResponse.json({
      success: true,
      message: `${item.name} purchased for $${item.price}`,
      spent: item.price,
    });
  } catch (error) {
    console.error('❌ Error adding to inventory:', error);
    return NextResponse.json({ error: 'Failed to complete purchase.' }, { status: 500 });
  }
}
