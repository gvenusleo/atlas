"use client"

import * as React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BookTextIcon,
  ChevronUpIcon,
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
import { Button } from "@/components/ui/button"
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
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="gap-3 border-b border-sidebar-border/60 pb-4 group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:pb-3">
          <SidebarMenu className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" tooltip="Atlas">
                <Link href="/">
                  <BookTextIcon />
                  <span className="font-heading text-base">Atlas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="flex flex-col gap-2 px-2 group-data-[collapsible=icon]:px-0">
            <Button onClick={() => void handleCreateDocument()}>
              <PlusIcon data-icon="inline-start" />
              <span className="group-data-[collapsible=icon]:hidden">新建文档</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateFolderOpen(true)
              }}
            >
              <FolderPlusIcon data-icon="inline-start" />
              <span className="group-data-[collapsible=icon]:hidden">新建文件夹</span>
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>文档</SidebarGroupLabel>
            <SidebarGroupContent>
              <DocumentTree currentDocumentId={currentDocumentId} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/60 pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" tooltip="账户与设置">
                <Avatar className="size-8">
                  <AvatarImage alt={user.name} src={user.image ?? undefined} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{user.name}</span>
                <ChevronUpIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
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
