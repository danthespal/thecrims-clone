import { z } from "zod";

export const GearActionSchema = z.enum(["load", "save", "consume"]);

export const SaveGearSchema = z.object({
  equipment: z.record(
    z.object({
      id: z.number().int().positive()
    })
  ),
  inventory: z.array(
    z.object({
      id: z.number().int().positive(),
      quantity: z.number().int().positive().max(1000).optional()
    })
  ).max(36)
});

export const ConsumeGearSchema = z.object({
  item_id: z.number().int().positive()
});
