import { Card } from "@heroui/react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/service";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-6 py-10">
      <Card className="w-full max-w-2xl border border-black/6 bg-card shadow-[0_24px_80px_rgba(32,45,74,0.12)]">
        <Card.Header className="gap-3 border-b border-black/6 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Atlas Workspace
          </p>
          <Card.Title>工作台骨架已就绪</Card.Title>
          <Card.Description className="max-w-xl text-sm leading-6 text-muted">
            登录后这里会成为知识管理、AI
            协作与检索工作的统一入口。当前阶段先完成认证入口与路由分流。
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4 py-8">
          <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 p-5">
            <p className="text-sm font-medium text-foreground">
              当前会话用户：{session.user.name}
            </p>
            <p className="mt-1 text-sm text-muted">{session.user.email}</p>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-muted">
            <p>后续模块会从这里展开：知识库、协作视图、AI 工作流和检索入口。</p>
            <p>
              当前版本未接真实认证服务，只有在已存在合法会话 cookie
              时才会进入这个页面。
            </p>
          </div>
        </Card.Content>
      </Card>
    </main>
  );
}
