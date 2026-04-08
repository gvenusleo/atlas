"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import {
  type LoginFormState,
  loginFormSchema,
  type RegisterFormState,
  registerFormSchema,
} from "@/lib/auth/forms";
import {
  refreshSession,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "@/lib/auth/service";

function readFormValue(formData: FormData, key: string, trim = true) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return trim ? value.trim() : value;
}

export async function loginWithPasswordAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const values = {
    email: readFormValue(formData, "email"),
  };

  const validatedFields = loginFormSchema.safeParse({
    email: values.email,
    password: readFormValue(formData, "password", false),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      formError: null,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const result = await signInWithPassword(validatedFields.data);

    if (!result.ok) {
      return {
        status: "error",
        formError:
          result.code === "INVALID_CREDENTIALS"
            ? "邮箱或密码不正确。"
            : result.message,
        fieldErrors: {},
        values: {
          email: validatedFields.data.email,
        },
      };
    }
  } catch (error) {
    console.error("loginWithPasswordAction failed", error);
    unstable_rethrow(error);

    return {
      status: "error",
      formError: "登录流程执行失败，请稍后重试。",
      fieldErrors: {},
      values,
    };
  }

  redirect("/");
}

export async function registerWithPasswordAction(
  _previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const values = {
    name: readFormValue(formData, "name"),
    email: readFormValue(formData, "email"),
  };

  const validatedFields = registerFormSchema.safeParse({
    name: values.name,
    email: values.email,
    password: readFormValue(formData, "password", false),
    confirmPassword: readFormValue(formData, "confirmPassword", false),
  });

  if (!validatedFields.success) {
    return {
      status: "error",
      formError: null,
      fieldErrors: validatedFields.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const result = await signUpWithPassword(validatedFields.data);

    if (!result.ok) {
      return {
        status: "error",
        formError:
          result.code === "EMAIL_ALREADY_EXISTS" ? null : result.message,
        fieldErrors:
          result.code === "EMAIL_ALREADY_EXISTS"
            ? {
                email: ["该邮箱已被注册，请直接登录。"],
              }
            : {},
        values: {
          email: validatedFields.data.email,
          name: validatedFields.data.name,
        },
      };
    }
  } catch (error) {
    console.error("registerWithPasswordAction failed", error);
    unstable_rethrow(error);

    return {
      status: "error",
      formError: "注册流程执行失败，请稍后重试。",
      fieldErrors: {},
      values,
    };
  }

  redirect("/");
}

export async function logoutAction() {
  try {
    await signOut();
  } catch (error) {
    console.error("logoutAction failed", error);
    unstable_rethrow(error);
    throw error;
  }

  redirect("/auth");
}

export async function refreshSessionAction() {
  try {
    return {
      ok: await refreshSession(),
    };
  } catch (error) {
    console.error("refreshSessionAction failed", error);
    unstable_rethrow(error);

    return {
      ok: false,
    };
  }
}
