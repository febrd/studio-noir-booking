
import { Home, User, Users, Calendar, CreditCard, FileText, Receipt, BarChart3, Settings, Building, Package, Camera, Clock, Wallet, DollarSign } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useJWTAuth } from "@/hooks/useJWTAuth"

export function AppSidebar() {
  const location = useLocation()
  const { userProfile } = useJWTAuth()
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const hasAccess = (roles: string[]) => {
    return userProfile?.role && roles.includes(userProfile.role)
  }

  const mainNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      roles: ["admin", "owner", "keuangan", "pelanggan"]
    },
    {
      title: "Customer",
      icon: User,
      roles: ["admin", "owner", "keuangan"],
      subItems: [
        { title: "Booking Selection", url: "/dashboard/customer/booking-selection" },
        { title: "Regular Packages", url: "/dashboard/customer/regular-packages" },
        { title: "Self Photo Packages", url: "/dashboard/customer/self-photo-packages" },
        { title: "Order History", url: "/dashboard/customer/order-history" },
      ]
    },
    {
      title: "Studio Management",
      icon: Building,
      roles: ["admin", "owner"],
      subItems: [
        { title: "Studios", url: "/dashboard/studio/studios" },
        { title: "Packages", url: "/dashboard/studio/packages" },
        { title: "Package Categories", url: "/dashboard/studio/package-categories" },
        { title: "Services", url: "/dashboard/studio/services" },
        { title: "Bookings", url: "/dashboard/studio/bookings" },
        { title: "Walk-in Sessions", url: "/dashboard/studio/walkin-sessions" },
        { title: "Booking Logs", url: "/dashboard/studio/booking-logs" },
        { title: "Offline Transactions", url: "/dashboard/studio/offline-transactions" },
      ]
    },
    {
      title: "Admin",
      icon: Settings,
      roles: ["admin", "owner"],
      subItems: [
        { title: "Users", url: "/dashboard/admin/users" },
        { title: "Customers", url: "/dashboard/admin/customers" },
        { title: "Payment Providers", url: "/dashboard/admin/payment-providers" },
      ]
    },
    {
      title: "Transaction",
      icon: CreditCard,
      roles: ["admin", "owner", "keuangan"],
      subItems: [
        { title: "Transactions", url: "/dashboard/transactions" },
        { title: "Transaction Reports", url: "/dashboard/transactions/reports" },
        { title: "Online Bookings", url: "/dashboard/transactions/online-bookings" },
        { title: "Offline Bookings", url: "/dashboard/transactions/offline-bookings" },
      ]
    },
    {
      title: "Expense",
      url: "/expenses",
      icon: Receipt,
      roles: ["admin", "owner", "keuangan"]
    },
    {
      title: "Reports & Recaps",
      icon: BarChart3,
      roles: ["admin", "owner", "keuangan"],
      subItems: [
        { title: "Monthly Recaps", url: "/dashboard/recaps" },
      ]
    },
    {
      title: "Payment Gateway",
      url: "/payment-gateway",
      icon: Wallet,
      roles: ["admin", "owner"]
    },
  ]

  const filteredNavItems = mainNavItems.filter(item => hasAccess(item.roles))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Camera className="h-6 w-6" />
          <span className="font-semibold">Studio Manager</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible
                      asChild
                      defaultOpen={item.subItems.some(subItem => isActive(subItem.url))}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive(subItem.url)}
                                >
                                  <Link to={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.url!)}>
                      <Link to={item.url!}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
