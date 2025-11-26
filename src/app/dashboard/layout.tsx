"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Key,
  BarChart3,
  Settings,
  DollarSign,
  Bell,
  User,
  FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Optimization Rules", href: "/dashboard/optimization-rules", icon: FileText },
  { name: "Budgets", href: "/dashboard/budgets", icon: DollarSign },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="font-semibold">LLM Cost</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton onClick={() => router.push(item.href as any)}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Spend:</span>
              <Badge variant="secondary">$0.00</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}