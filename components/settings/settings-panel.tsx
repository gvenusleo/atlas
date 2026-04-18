"use client"

import * as React from "react"

import { useTheme } from "next-themes"
import { MonitorCogIcon, MoonStarIcon, SunIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type SettingsPanelProps = {
  user: {
    email: string
    id: string
    image: string | null
    name: string
  }
}

type ThemeOption = {
  icon: React.ComponentType<React.ComponentProps<"svg">>
  label: string
  value: "dark" | "light" | "system"
}

const themeOptions: ThemeOption[] = [
  {
    icon: SunIcon,
    label: "浅色",
    value: "light",
  },
  {
    icon: MoonStarIcon,
    label: "深色",
    value: "dark",
  },
  {
    icon: MonitorCogIcon,
    label: "跟随系统",
    value: "system",
  },
]

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("")
}

function getThemeLabel(value: string) {
  return themeOptions.find((option) => option.value === value)?.label ?? "跟随系统"
}

function SettingsRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

export function SettingsPanel({ user }: SettingsPanelProps) {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const currentTheme = theme ?? resolvedTheme ?? "system"

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <SidebarTrigger />
          <span className="text-sm font-medium text-foreground">设置</span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10 sm:px-8">
          <section className="flex flex-col gap-10">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage alt={user.name} src={user.image ?? undefined} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {user.name}
                </h1>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            <section className="grid gap-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-medium text-foreground">账户</h2>
                <p className="text-sm text-muted-foreground">当前资料</p>
              </div>

              <div className="flex flex-col">
                <SettingsRow label="显示名称" value={user.name} />
                <Separator />
                <SettingsRow label="邮箱地址" value={user.email} />
              </div>
            </section>

            <Separator />

            <section className="grid gap-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-10">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-medium text-foreground">外观</h2>
                <p className="text-sm text-muted-foreground">主题</p>
              </div>

              <div className="flex flex-col gap-4">
                <ToggleGroup
                  className="w-full"
                  spacing={0}
                  type="single"
                  value={currentTheme}
                  onValueChange={(value) => {
                    if (value) {
                      setTheme(value)
                    }
                  }}
                >
                  {themeOptions.map((option) => {
                    const Icon = option.icon

                    return (
                      <ToggleGroupItem
                        key={option.value}
                        aria-label={`切换到${option.label}`}
                        className="flex-1"
                        size="lg"
                        value={option.value}
                        variant="outline"
                      >
                        <Icon data-icon="inline-start" />
                        {option.label}
                      </ToggleGroupItem>
                    )
                  })}
                </ToggleGroup>

                <p className="text-sm text-muted-foreground">
                  当前为 {getThemeLabel(currentTheme)}，工作台与编辑器会同步更新。
                </p>
              </div>
            </section>
          </section>
        </div>
      </main>
    </div>
  )
}
