import { z } from 'zod';

export const LoginSchema = z.object({
  account_name: z.string().min(3, 'Account name is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
