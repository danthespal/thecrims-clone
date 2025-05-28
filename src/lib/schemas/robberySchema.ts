import { z } from 'zod';

export const RobberyActionSchema = z.enum([
	"street-thief",
	"shop-heist",
	"bank-raid",
]);

export type RobberyActionInput = z.infer<typeof RobberyActionSchema>;