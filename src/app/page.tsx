import { Button, Card } from "@heroui/react";
import { logoutAction } from "@/app/auth/actions";
import { requireSession } from "@/lib/auth/service";
import { SessionRefresh } from "./_components/session-refresh";

export default async function HomePage() {
  const session = await requireSession();

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-6 py-10">
      <SessionRefresh />
      <Card className="w-full max-w-2xl border border-black/6 bg-card shadow-[0_24px_80px_rgba(32,45,74,0.12)]">
        <Card.Header className="gap-3 border-b border-black/6 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Atlas Workspace
          </p>
          <Card.Title>工作台骨架已就绪</Card.Title>
          <Card.Description className="max-w-xl text-sm leading-6 text-muted">
            已接入 PostgreSQL 持久会话。这里会继续扩展为知识管理、AI
            协作与检索工作的统一入口。
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
            <p>当前版本已经支持邮箱注册、登录、持久会话与退出登录。</p>
          </div>
        </Card.Content>
        <Card.Footer className="justify-end border-t border-black/6 pt-6">
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              退出登录
            </Button>
          </form>
        </Card.Footer>
      </Card>
    </main>
  );
}
