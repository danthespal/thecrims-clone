import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';
import { getItemById } from '@/lib/itemLoader';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session-token');

  if (!session?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [user] = await sql`
    SELECT u.id, u.money
    FROM "Sessions" s
    JOIN "User" u ON u.id = s.user_id
    WHERE s.id = ${session.value}
  `;

  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { item_id } = await req.json();
  const item = getItemById(item_id);

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  if (user.money < item.price) {
    return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
  }

  try {
    await sql.begin(async (sql) => {
      await sql`
        INSERT INTO "UserInventory" (user_id, item_id, quantity)
        VALUES (${user.id}, ${item.id}, 1)
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET quantity = "UserInventory".quantity + 1
      `;

      await sql`
        UPDATE "User" SET money = money - ${item.price}
        WHERE id = ${user.id}
      `;
    });

    return NextResponse.json({ message: `${item.name} purchased for $${item.price}` });
  } catch (error) {
    console.error('Error adding to inventory:', error);
    return NextResponse.json({ error: 'Failed to complete purchase.' }, { status: 500 });
  }
}
