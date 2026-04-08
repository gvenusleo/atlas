import { z } from "zod";

type BaseFormState<TValues, TField extends string> = {
  fieldErrors: Partial<Record<TField, string[]>>;
  formError: string | null;
  status: "error" | "idle";
  values: TValues;
};

type LoginField = "email" | "password";
type RegisterField = "confirmPassword" | "email" | "name" | "password";

export type LoginFormState = BaseFormState<
  {
    email: string;
  },
  LoginField
>;

export type RegisterFormState = BaseFormState<
  {
    email: string;
    name: string;
  },
  RegisterField
>;

export const initialLoginFormState: LoginFormState = {
  fieldErrors: {},
  formError: null,
  status: "idle",
  values: {
    email: "",
  },
};

export const initialRegisterFormState: RegisterFormState = {
  fieldErrors: {},
  formError: null,
  status: "idle",
  values: {
    email: "",
    name: "",
  },
};

const emailSchema = z
  .string()
  .trim()
  .min(1, { error: "请输入邮箱地址。" })
  .email({ error: "请输入有效的邮箱地址。" })
  .transform((value) => value.toLowerCase());

const nameSchema = z
  .string()
  .trim()
  .min(2, { error: "姓名至少 2 个字符。" })
  .max(40, { error: "姓名最多 40 个字符。" });

const passwordSchema = z
  .string()
  .min(6, { error: "密码至少 6 位。" })
  .max(72, { error: "密码最多 72 位。" });

const confirmPasswordSchema = z.string().min(1, { error: "请再次输入密码。" });

export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = z
  .object({
    confirmPassword: confirmPasswordSchema,
    email: emailSchema,
    name: nameSchema,
    password: passwordSchema,
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "两次输入的密码不一致。",
        path: ["confirmPassword"],
      });
    }
  });
