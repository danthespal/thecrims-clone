import { z } from "zod";

export const BlackjackActionSchema = z.enum(["start", "hit", "stand", "resolve"]);

export const StartSchema = z.object({
  bet: z.number().int().positive()
});

export const HitSchema = z.object({
  hand: z.array(z.string().min(1))
});

export const StandSchema = z.object({
  dealerHand: z.array(z.string().min(1)).nonempty()
});

export const ResolveSchema = z.object({
  bet: z.number().int().positive(),
  playerHand: z.array(z.string().min(1)),
  dealerHand: z.array(z.string().min(1))
});
