
import { 
  Calendar, 
  Camera, 
  Users, 
  Package, 
  Settings, 
  BarChart3, 
  CreditCard, 
  FileText,
  Building2,
  Clock,
  UserCheck,
  BookOpen,
  Wallet
} from 'lucide-react';

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
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { useJWTAuth } from '@/hooks/useJWTAuth';

export function AppSidebar() {
  const { userProfile } = useJWTAuth();

  // Define menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: BarChart3,
      }
    ];

    if (userProfile?.role === 'owner' || userProfile?.role === 'admin') {
      return [
        ...commonItems,
        {
          title: "Studio Management",
          icon: Building2,
          items: [
            {
              title: "Dashboard",
              url: "/studio",
              icon: BarChart3,
            },
            {
              title: "Studios",
              url: "/studio/studios",
              icon: Camera,
            },
            {
              title: "Package Categories",
              url: "/studio/categories",
              icon: Package,
            },
            {
              title: "Packages",
              url: "/studio/packages",
              icon: Package,
            },
            {
              title: "Additional Services",
              url: "/studio/services",
              icon: Settings,
            },
            {
              title: "Bookings",
              url: "/studio/bookings",
              icon: Calendar,
            },
            {
              title: "Walk-in Sessions",
              url: "/studio/walkin-sessions",
              icon: UserCheck,
            },
            {
              title: "Booking Logs",
              url: "/studio/booking-logs",
              icon: BookOpen,
            },
            {
              title: "Offline Transactions",
              url: "/studio/offline-transactions",
              icon: Wallet,
            },
          ],
        },
        {
          title: "Transactions",
          icon: CreditCard,
          items: [
            {
              title: "All Transactions",
              url: "/transactions",
              icon: CreditCard,
            },
            {
              title: "Reports",
              url: "/transactions/reports",
              icon: FileText,
            },
            {
              title: "Online Bookings",
              url: "/transactions/online-bookings",
              icon: Calendar,
            },
            {
              title: "Offline Bookings",
              url: "/transactions/offline-bookings",
              icon: Clock,
            },
          ],
        },
        {
          title: "Reports & Recaps",
          icon: FileText,
          items: [
            {
              title: "Monthly Recaps",
              url: "/recaps",
              icon: FileText,
            },
          ],
        },
        {
          title: "User Management",
          icon: Users,
          items: [
            {
              title: "Staff Users",
              url: "/admin/users",
              icon: Users,
            },
            {
              title: "Customers",
              url: "/admin/customers",
              icon: Users,
            },
          ],
        },
      ];
    }

    if (userProfile?.role === 'keuangan') {
      return [
        ...commonItems,
        {
          title: "Transactions",
          icon: CreditCard,
          items: [
            {
              title: "All Transactions",
              url: "/transactions",
              icon: CreditCard,
            },
            {
              title: "Reports",
              url: "/transactions/reports",
              icon: FileText,
            },
            {
              title: "Online Bookings",
              url: "/transactions/online-bookings",
              icon: Calendar,
            },
            {
              title: "Offline Bookings",
              url: "/transactions/offline-bookings",
              icon: Clock,
            },
          ],
        },
        {
          title: "Reports & Recaps",
          icon: FileText,
          items: [
            {
              title: "Monthly Recaps",
              url: "/recaps",
              icon: FileText,
            },
          ],
        },
      ];
    }

    // Default for pelanggan
    return commonItems;
  };

  // Only show payment gateway for owner
  const ownerOnlyItems = userProfile?.role === 'owner' ? [
    {
      title: "Payment Gateway",
      url: "/payment-gateway",
      icon: CreditCard,
    },
    {
      title: "Payment Providers",
      url: "/admin/payment-providers",
      icon: Settings,
    },
  ] : [];

  const menuItems = [...getMenuItems(), ...ownerOnlyItems];

  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen={item.title === "Studio Management"}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url}>
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
