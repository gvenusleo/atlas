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
import { initialRegisterFormState } from "@/lib/auth/forms";
import { registerWithPasswordAction } from "../actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerWithPasswordAction,
    initialRegisterFormState,
  );

  return (
    <Form action={formAction} aria-label="注册表单" validationBehavior="aria">
      <div className="space-y-4">
        <TextField
          autoComplete="name"
          defaultValue={state.values.name}
          fullWidth
          isRequired
          isInvalid={Boolean(state.fieldErrors.name?.[0])}
          name="name"
          validationBehavior="aria"
        >
          <Label>姓名</Label>
          <Input placeholder="Alex Carter" />
          {state.fieldErrors.name?.[0] ? (
            <FieldError>{state.fieldErrors.name[0]}</FieldError>
          ) : null}
        </TextField>
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
          autoComplete="new-password"
          fullWidth
          isRequired
          isInvalid={Boolean(state.fieldErrors.password?.[0])}
          name="password"
          type="password"
          validationBehavior="aria"
        >
          <Label>密码</Label>
          <Input placeholder="至少 6 位密码" />
          {state.fieldErrors.password?.[0] ? (
            <FieldError>{state.fieldErrors.password[0]}</FieldError>
          ) : null}
        </TextField>
        <TextField
          autoComplete="new-password"
          fullWidth
          isRequired
          isInvalid={Boolean(state.fieldErrors.confirmPassword?.[0])}
          name="confirmPassword"
          type="password"
          validationBehavior="aria"
        >
          <Label>确认密码</Label>
          <Input placeholder="再次输入密码" />
          {state.fieldErrors.confirmPassword?.[0] ? (
            <FieldError>{state.fieldErrors.confirmPassword[0]}</FieldError>
          ) : null}
        </TextField>
        {state.formError ? (
          <Alert aria-live="polite" status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>注册失败</Alert.Title>
              <Alert.Description>{state.formError}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <Button fullWidth isPending={pending} type="submit">
          {pending ? "注册中" : "创建账号"}
        </Button>
      </div>
    </Form>
  );
}
