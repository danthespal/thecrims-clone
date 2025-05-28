import { z } from 'zod';

export const ItemActionSchema = z.literal('all');

export type ItemActionInput = z.infer<typeof ItemActionSchema>;
