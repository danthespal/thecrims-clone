import { z } from 'zod';

export const CasinoActionSchema = z.enum(['deposit', 'withdraw' ]);

export const CasinoAmountSchema = z.object({
	amount: z.preprocess(
		(val) => typeof val === 'string' ? parseInt(val, 10): val,
		z.number().int().positive({ message: 'Amount must be a positive number' })
	),
});

export type CasinoAction = z.infer<typeof CasinoActionSchema>;
export type CasinoAmountInput = z.infer<typeof CasinoAmountSchema>;