import { z } from 'zod';

export const ShopActionSchema = z.enum(['buy']);

export const ShopPurchaseSchema = z.object({
	item_id: z.number().int().positive({ message: 'Item ID must be a positive integer' }),
	quantity: z.preprocess(
		(val) => (val === undefined ? 1 : val),
		z.number().int().positive({ message: 'Quantity must be a positive integer' })
	),
});

export type ShopAction = z.infer<typeof ShopActionSchema>
export type ShopPurchaseInput = z.infer<typeof ShopPurchaseSchema>