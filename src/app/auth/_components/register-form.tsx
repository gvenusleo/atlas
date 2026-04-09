"use client";

import { CircleAlertIcon } from "lucide-react";
import { useActionState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { initialRegisterFormState } from "@/lib/auth/forms";
import { registerWithPasswordAction } from "../actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerWithPasswordAction,
    initialRegisterFormState,
  );

  const nameError = state.fieldErrors.name?.[0];
  const emailError = state.fieldErrors.email?.[0];
  const passwordError = state.fieldErrors.password?.[0];
  const confirmPasswordError = state.fieldErrors.confirmPassword?.[0];

  return (
    <form
      action={formAction}
      aria-label="注册表单"
      className="space-y-5"
      noValidate
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="register-name">姓名</FieldLabel>
          <FieldContent>
            <Input
              aria-invalid={Boolean(nameError)}
              autoComplete="name"
              defaultValue={state.values.name}
              id="register-name"
              name="name"
              placeholder="Alex Morgan"
              type="text"
            />
            <FieldError>{nameError}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="register-email">邮箱</FieldLabel>
          <FieldContent>
            <Input
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              defaultValue={state.values.email}
              id="register-email"
              name="email"
              placeholder="name@atlas.app"
              type="email"
            />
            <FieldError>{emailError}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="register-password">密码</FieldLabel>
          <FieldContent>
            <Input
              aria-invalid={Boolean(passwordError)}
              autoComplete="new-password"
              id="register-password"
              name="password"
              placeholder="设置登录密码"
              type="password"
            />
            <FieldError>{passwordError}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="register-confirm-password">确认密码</FieldLabel>
          <FieldContent>
            <Input
              aria-invalid={Boolean(confirmPasswordError)}
              autoComplete="new-password"
              id="register-confirm-password"
              name="confirmPassword"
              placeholder="再次输入密码"
              type="password"
            />
            <FieldError>{confirmPasswordError}</FieldError>
          </FieldContent>
        </Field>
      </FieldGroup>

      {state.formError ? (
        <Alert variant="destructive">
          <CircleAlertIcon className="size-4" />
          <AlertTitle>注册失败</AlertTitle>
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "注册中" : "创建账号"}
      </Button>
    </form>
  );
}
