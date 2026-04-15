"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

type AuthMode = "sign-in" | "sign-up"

type Notice = {
  kind: "error" | "success"
  title: string
  message: string
} | null

type SignInFormState = {
  email: string
  password: string
}

type SignUpFormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

type SignInErrors = Partial<Record<keyof SignInFormState, string>>
type SignUpErrors = Partial<Record<keyof SignUpFormState, string>>

const initialSignInForm: SignInFormState = {
  email: "",
  password: "",
}

const initialSignUpForm: SignUpFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function toAuthMessage(message?: string) {
  if (!message) {
    return "请求未完成，请稍后重试。"
  }

  const normalized = message.toLowerCase()

  if (
    normalized.includes("user already exists") ||
    normalized.includes("already exists") ||
    normalized.includes("duplicate")
  ) {
    return "该邮箱已注册，请直接登录。"
  }

  if (
    normalized.includes("invalid email or password") ||
    normalized.includes("invalid password") ||
    normalized.includes("invalid credentials")
  ) {
    return "邮箱或密码不正确。"
  }

  if (normalized.includes("password")) {
    return "密码不符合要求，请至少输入 8 位字符。"
  }

  if (normalized.includes("network")) {
    return "网络请求失败，请确认服务已启动后再试。"
  }

  return message
}

function validateSignIn(values: SignInFormState) {
  const errors: SignInErrors = {}

  if (!values.email.trim()) {
    errors.email = "请输入邮箱。"
  } else if (!isValidEmail(values.email.trim())) {
    errors.email = "请输入有效的邮箱地址。"
  }

  if (!values.password) {
    errors.password = "请输入密码。"
  }

  return errors
}

function validateSignUp(values: SignUpFormState) {
  const errors: SignUpErrors = {}

  if (!values.name.trim()) {
    errors.name = "请输入用户名。"
  }

  if (!values.email.trim()) {
    errors.email = "请输入邮箱。"
  } else if (!isValidEmail(values.email.trim())) {
    errors.email = "请输入有效的邮箱地址。"
  }

  if (!values.password) {
    errors.password = "请输入密码。"
  } else if (values.password.length < 8) {
    errors.password = "密码至少需要 8 位字符。"
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "请再次输入密码。"
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "两次输入的密码不一致。"
  }

  return errors
}

export function AuthPanel() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [notice, setNotice] = useState<Notice>(null)
  const [isSubmitting, setIsSubmitting] = useState<AuthMode | null>(null)
  const [isNavigating, startNavigation] = useTransition()

  const [signInForm, setSignInForm] = useState(initialSignInForm)
  const [signUpForm, setSignUpForm] = useState(initialSignUpForm)

  const [signInErrors, setSignInErrors] = useState<SignInErrors>({})
  const [signUpErrors, setSignUpErrors] = useState<SignUpErrors>({})

  const isBusy = isSubmitting !== null || isNavigating

  function handleModeChange(nextMode: string) {
    setMode(nextMode as AuthMode)
    setNotice(null)
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    const nextErrors = validateSignIn(signInForm)
    setSignInErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting("sign-in")

    try {
      const result = await authClient.signIn.email({
        email: normalizeEmail(signInForm.email),
        password: signInForm.password,
      })

      if (result.error) {
        setNotice({
          kind: "error",
          title: "登录失败",
          message: toAuthMessage(result.error.message),
        })
        setIsSubmitting(null)
        return
      }

      startNavigation(() => {
        router.push("/")
        router.refresh()
      })
    } catch (error) {
      setNotice({
        kind: "error",
        title: "登录失败",
        message:
          error instanceof Error
            ? toAuthMessage(error.message)
            : "登录请求未完成，请稍后再试。",
      })
      setIsSubmitting(null)
    }
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    const nextErrors = validateSignUp(signUpForm)
    setSignUpErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting("sign-up")

    try {
      const normalizedEmail = normalizeEmail(signUpForm.email)
      const result = await authClient.signUp.email({
        name: signUpForm.name.trim(),
        email: normalizedEmail,
        password: signUpForm.password,
      })

      if (result.error) {
        setNotice({
          kind: "error",
          title: "注册失败",
          message: toAuthMessage(result.error.message),
        })
        setIsSubmitting(null)
        return
      }

      setSignInForm((current) => ({
        ...current,
        email: normalizedEmail,
        password: "",
      }))
      setSignUpForm((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }))
      setSignInErrors({})
      setMode("sign-in")
      setNotice({
        kind: "success",
        title: "注册成功",
        message: "账户已创建。请使用刚刚设置的邮箱和密码登录。",
      })
      setIsSubmitting(null)
    } catch (error) {
      setNotice({
        kind: "error",
        title: "注册失败",
        message:
          error instanceof Error
            ? toAuthMessage(error.message)
            : "注册请求未完成，请稍后再试。",
      })
      setIsSubmitting(null)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="gap-2">
        <CardTitle>欢迎进入 Atlas</CardTitle>
        <CardDescription>
          先完成邮箱登录或注册，再进入你的知识工作台。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {notice ? (
          <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
            {notice.kind === "error" ? (
              <AlertCircleIcon />
            ) : (
              <CheckCircle2Icon />
            )}
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">登录</TabsTrigger>
            <TabsTrigger value="sign-up">注册</TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="mt-6">
            <form onSubmit={handleSignIn} noValidate>
              <FieldGroup>
                <Field data-invalid={Boolean(signInErrors.email) || undefined}>
                  <FieldLabel htmlFor="sign-in-email">邮箱</FieldLabel>
                  <Input
                    id="sign-in-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={signInForm.email}
                    aria-invalid={Boolean(signInErrors.email) || undefined}
                    onChange={(event) => {
                      setSignInForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                      setSignInErrors((current) => ({
                        ...current,
                        email: undefined,
                      }))
                    }}
                  />
                  <FieldError>{signInErrors.email}</FieldError>
                </Field>

                <Field
                  data-invalid={Boolean(signInErrors.password) || undefined}
                >
                  <FieldLabel htmlFor="sign-in-password">密码</FieldLabel>
                  <Input
                    id="sign-in-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="输入你的密码"
                    value={signInForm.password}
                    aria-invalid={Boolean(signInErrors.password) || undefined}
                    onChange={(event) => {
                      setSignInForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                      setSignInErrors((current) => ({
                        ...current,
                        password: undefined,
                      }))
                    }}
                  />
                  <FieldError>{signInErrors.password}</FieldError>
                </Field>

                <Button type="submit" className="w-full" disabled={isBusy}>
                  {isSubmitting === "sign-in" || isNavigating ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {isSubmitting === "sign-in" || isNavigating
                    ? "登录中"
                    : "登录"}
                </Button>
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="sign-up" className="mt-6">
            <form onSubmit={handleSignUp} noValidate>
              <FieldGroup>
                <Field data-invalid={Boolean(signUpErrors.name) || undefined}>
                  <FieldLabel htmlFor="sign-up-name">用户名</FieldLabel>
                  <Input
                    id="sign-up-name"
                    autoComplete="nickname"
                    placeholder="输入你的用户名"
                    value={signUpForm.name}
                    aria-invalid={Boolean(signUpErrors.name) || undefined}
                    onChange={(event) => {
                      setSignUpForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                      setSignUpErrors((current) => ({
                        ...current,
                        name: undefined,
                      }))
                    }}
                  />
                  <FieldError>{signUpErrors.name}</FieldError>
                </Field>

                <Field data-invalid={Boolean(signUpErrors.email) || undefined}>
                  <FieldLabel htmlFor="sign-up-email">邮箱</FieldLabel>
                  <Input
                    id="sign-up-email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={signUpForm.email}
                    aria-invalid={Boolean(signUpErrors.email) || undefined}
                    onChange={(event) => {
                      setSignUpForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                      setSignUpErrors((current) => ({
                        ...current,
                        email: undefined,
                      }))
                    }}
                  />
                  <FieldError>{signUpErrors.email}</FieldError>
                </Field>

                <Field
                  data-invalid={Boolean(signUpErrors.password) || undefined}
                >
                  <FieldLabel htmlFor="sign-up-password">密码</FieldLabel>
                  <Input
                    id="sign-up-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="至少 8 位字符"
                    value={signUpForm.password}
                    aria-invalid={Boolean(signUpErrors.password) || undefined}
                    onChange={(event) => {
                      setSignUpForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                      setSignUpErrors((current) => ({
                        ...current,
                        password: undefined,
                      }))
                    }}
                  />
                  <FieldError>{signUpErrors.password}</FieldError>
                </Field>

                <Field
                  data-invalid={
                    Boolean(signUpErrors.confirmPassword) || undefined
                  }
                >
                  <FieldLabel htmlFor="sign-up-confirm-password">
                    确认密码
                  </FieldLabel>
                  <Input
                    id="sign-up-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="再次输入密码"
                    value={signUpForm.confirmPassword}
                    aria-invalid={
                      Boolean(signUpErrors.confirmPassword) || undefined
                    }
                    onChange={(event) => {
                      setSignUpForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                      setSignUpErrors((current) => ({
                        ...current,
                        confirmPassword: undefined,
                      }))
                    }}
                  />
                  <FieldError>{signUpErrors.confirmPassword}</FieldError>
                </Field>

                <Button type="submit" className="w-full" disabled={isBusy}>
                  {isSubmitting === "sign-up" ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {isSubmitting === "sign-up" ? "创建账户中" : "注册并继续"}
                </Button>
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
