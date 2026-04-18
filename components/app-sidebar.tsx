"use client"

import * as React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BookTextIcon,
  ChevronsUpDownIcon,
  FolderPlusIcon,
  MoonStarIcon,
  PlusIcon,
  Settings2Icon,
  SunIcon,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { DocumentTree } from "@/components/document-tree/document-tree"
import { NodeNameDialog } from "@/components/document-tree/node-name-dialog"
import { useDocumentsWorkspace } from "@/components/documents/documents-workspace-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

function getCurrentDocumentId(pathname: string) {
  if (!pathname.startsWith("/documents/")) {
    return null
  }

  return pathname.slice("/documents/".length)
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("")
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { createDocumentInFolder, createFolderInParent, user } =
    useDocumentsWorkspace()
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const { resolvedTheme, setTheme, theme } = useTheme()
  const currentDocumentId = getCurrentDocumentId(pathname)

  async function handleCreateDocument() {
    const document = await createDocumentInFolder(null)
    router.push(`/documents/${document.id}`)
  }

  async function handleSignOut() {
    setIsSigningOut(true)

    try {
      const result = await authClient.signOut()

      if (result.error) {
        setIsSigningOut(false)
        return
      }

      router.push("/auth")
      router.refresh()
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <>
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="Atlas">
                <Link href="/">
                  <BookTextIcon />
                  <span className="font-brand text-base">Atlas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>文档</SidebarGroupLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarGroupAction aria-label="新建">
                  <PlusIcon />
                </SidebarGroupAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      void handleCreateDocument()
                    }}
                  >
                    <PlusIcon />
                    新建文档
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setCreateFolderOpen(true)
                    }}
                  >
                    <FolderPlusIcon />
                    新建文件夹
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <SidebarGroupContent>
              <DocumentTree currentDocumentId={currentDocumentId} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="pt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    className="h-auto min-h-14 gap-3 rounded-xl px-2 py-2"
                    size="lg"
                    tooltip="账户与设置"
                  >
                    <Avatar className="size-8">
                      <AvatarImage alt={user.name} src={user.image ?? undefined} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left leading-tight">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <ChevronsUpDownIcon className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings2Icon />
                        设置
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>外观</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={theme ?? resolvedTheme ?? "system"}
                    onValueChange={(value) => setTheme(value)}
                  >
                    <DropdownMenuRadioItem value="light">
                      <SunIcon />
                      浅色
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <MoonStarIcon />
                      深色
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Settings2Icon />
                      跟随系统
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={isSigningOut}
                    onSelect={() => {
                      void handleSignOut()
                    }}
                  >
                    <Settings2Icon />
                    {isSigningOut ? "退出中..." : "退出登录"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <NodeNameDialog
        confirmLabel="创建"
        description="根目录文件夹适合放置项目、主题或长期文档集合。"
        open={createFolderOpen}
        placeholder="输入文件夹名称"
        title="新建文件夹"
        onOpenChange={setCreateFolderOpen}
        onSubmit={(value) => createFolderInParent(null, value).then(() => undefined)}
      />
    </>
  )
}
