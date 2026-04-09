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
import { initialLoginFormState } from "@/lib/auth/forms";
import { loginWithPasswordAction } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginWithPasswordAction,
    initialLoginFormState,
  );

  const emailError = state.fieldErrors.email?.[0];
  const passwordError = state.fieldErrors.password?.[0];

  return (
    <form
      action={formAction}
      aria-label="登录表单"
      className="space-y-5"
      noValidate
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="login-email">邮箱</FieldLabel>
          <FieldContent>
            <Input
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              defaultValue={state.values.email}
              id="login-email"
              name="email"
              placeholder="name@atlas.app"
              type="email"
            />
            <FieldError>{emailError}</FieldError>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="login-password">密码</FieldLabel>
          <FieldContent>
            <Input
              aria-invalid={Boolean(passwordError)}
              autoComplete="current-password"
              id="login-password"
              name="password"
              placeholder="输入你的密码"
              type="password"
            />
            <FieldError>{passwordError}</FieldError>
          </FieldContent>
        </Field>
      </FieldGroup>

      {state.formError ? (
        <Alert variant="destructive">
          <CircleAlertIcon className="size-4" />
          <AlertTitle>登录失败</AlertTitle>
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      ) : null}

      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "登录中" : "登录"}
      </Button>
    </form>
  );
}
