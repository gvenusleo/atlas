"use client"

import * as React from "react"

import { useTheme } from "next-themes"
import { MonitorCogIcon, MoonStarIcon, SunIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

type SettingsPanelProps = {
  user: {
    email: string
    id: string
    image: string | null
    name: string
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("")
}

export function SettingsPanel({ user }: SettingsPanelProps) {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const currentTheme = theme ?? resolvedTheme ?? "system"

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <SidebarTrigger />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">设置</span>
          <span className="text-xs text-muted-foreground">
            管理账户信息和界面外观。
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-10 sm:px-10">
        <section className="grid gap-6 border-b border-border/60 pb-10 lg:grid-cols-[0.32fr_0.68fr]">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">账户</h2>
            <p className="text-sm text-muted-foreground">
              当前登录信息来自 Better Auth 会话。
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage alt={user.name} src={user.image ?? undefined} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-base font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {user.email}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                User ID: {user.id}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.32fr_0.68fr]">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">外观</h2>
            <p className="text-sm text-muted-foreground">
              第一版只保留最必要的主题切换，不扩展更多应用偏好。
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ToggleGroup
              type="single"
              value={currentTheme}
              onValueChange={(value) => {
                if (value) {
                  setTheme(value)
                }
              }}
            >
              <ToggleGroupItem value="light" aria-label="切换到浅色主题">
                <SunIcon />
                浅色
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="切换到深色主题">
                <MoonStarIcon />
                深色
              </ToggleGroupItem>
              <ToggleGroupItem value="system" aria-label="跟随系统主题">
                <MonitorCogIcon />
                跟随系统
              </ToggleGroupItem>
            </ToggleGroup>

            <p className="text-sm text-muted-foreground">
              当前主题选择会应用到整个 Atlas 工作台，包括登录页和文档编辑区域。
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
