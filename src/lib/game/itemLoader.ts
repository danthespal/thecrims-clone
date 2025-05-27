import sql from '@/lib/core/db';

export type Item = {
  id: number,
  name: string,
  description: string;
  type: string;
  price: number;
  will_restore?: number;
};

export async function getAllItems(): Promise<Item[]> {
  return await sql<Item[]>`
    SELECT id, name, description, type, price, will_restore FROM "Items"
  `;
}

export async function getItemById(id: number): Promise<Item | undefined> {
  const [item] = await sql<Item[]>`
    SELECT id, name, description, type, price, will_restore FROM "Items" WHERE id = ${id}
  `;
  return item;
}