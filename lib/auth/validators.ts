import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      {
        message: "邮箱格式不正确。",
      }
    ),
  username: z
    .string()
    .trim()
    .min(1, "用户名不能为空。")
    .max(10, "用户名长度不能超过 10 个字符。"),
  password: z
    .string()
    .trim()
    .min(1, "密码不能为空。")
    .max(10, "密码长度不能超过 10 个字符。"),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "请输入用户名或邮箱。"),
  password: z
    .string()
    .trim()
    .min(1, "密码不能为空。")
    .max(10, "密码长度不能超过 10 个字符。"),
});
