import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(24),
  password: z.string().min(6).max(64),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(64),
});
