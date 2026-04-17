import { redirect } from "next/navigation"

import { AuthPanel } from "@/components/auth/auth-panel"
import { getSession } from "@/lib/auth-session"

export default async function AuthPage() {
  const session = await getSession()

  if (session) {
    redirect("/")
  }

  return (
    <div className="auth-shell relative min-h-svh overflow-hidden">
      <div className="auth-grid absolute inset-0 opacity-50" aria-hidden />
      <div
        className="auth-orbit absolute -left-20 top-20 size-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="auth-orbit absolute bottom-0 right-0 size-72 rounded-full bg-secondary blur-3xl"
        aria-hidden
        style={{ animationDelay: "240ms" }}
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[1360px] items-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <section className="auth-reveal flex justify-start">
            <div className="flex max-w-2xl flex-col gap-10">
              <div className="flex flex-col gap-4">
                <h1 className="font-brand text-6xl leading-none text-foreground sm:text-7xl lg:text-[5.5rem]">
                  Atlas
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  把零散输入沉入统一知识台，再以更少的界面完成整理、检索与协作。
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-[0.18em] text-muted-foreground">
                    输入归档
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    汇入想法、资料与待办，不必再在多个工具间来回切换。
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-[0.18em] text-muted-foreground">
                    结构整理
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    以清晰的信息层级组织内容，让后续检索与生成可持续演进。
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-[0.18em] text-muted-foreground">
                    协作生成
                  </p>
                  <p className="text-sm leading-6 text-foreground">
                    让 AI 协作落在同一工作台里，而不是散落在临时对话和草稿中。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-start lg:justify-end">
            <div
              className="auth-reveal w-full max-w-md"
              style={{ animationDelay: "140ms" }}
            >
              <AuthPanel />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
