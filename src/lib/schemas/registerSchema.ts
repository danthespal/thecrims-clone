import { z } from 'zod';

export const RegisterSchema = z.object({
  account_name: z.string().min(3, 'Account name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  profile_name: z.string().min(3, 'Profile name is required'),
  profile_suffix: z.string(),
  date_of_birth: z.string().refine((val) => {
    const date = new Date(val);
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, {
    message: 'You must be at least 18 years old',
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
