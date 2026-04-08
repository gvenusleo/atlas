"use client";

import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { useActionState } from "react";
import { initialLoginFormState } from "@/lib/auth/forms";
import { loginWithPasswordAction } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginWithPasswordAction,
    initialLoginFormState,
  );

  return (
    <Form action={formAction} aria-label="登录表单" validationBehavior="aria">
      <div className="space-y-4">
        <TextField
          autoComplete="email"
          defaultValue={state.values.email}
          fullWidth
          isRequired
          isInvalid={Boolean(state.fieldErrors.email?.[0])}
          name="email"
          type="email"
          validationBehavior="aria"
        >
          <Label>邮箱</Label>
          <Input placeholder="name@atlas.app" />
          {state.fieldErrors.email?.[0] ? (
            <FieldError>{state.fieldErrors.email[0]}</FieldError>
          ) : null}
        </TextField>
        <TextField
          autoComplete="current-password"
          fullWidth
          isRequired
          isInvalid={Boolean(state.fieldErrors.password?.[0])}
          name="password"
          type="password"
          validationBehavior="aria"
        >
          <Label>密码</Label>
          <Input placeholder="请输入密码" />
          {state.fieldErrors.password?.[0] ? (
            <FieldError>{state.fieldErrors.password[0]}</FieldError>
          ) : null}
        </TextField>
        {state.formError ? (
          <Alert aria-live="polite" status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>登录失败</Alert.Title>
              <Alert.Description>{state.formError}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Button fullWidth isPending={pending} type="submit">
          {pending ? "登录中" : "登录"}
        </Button>
      </div>
    </Form>
  );
}
