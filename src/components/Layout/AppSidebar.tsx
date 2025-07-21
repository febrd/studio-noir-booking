
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
import { Link } from 'react-router-dom';

// Define types for menu items
type MenuItemWithUrl = {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
};

type MenuItemWithItems = {
  title: string;
  icon: React.ComponentType<any>;
  items: {
    title: string;
    url: string;
    icon: React.ComponentType<any>;
  }[];
};

type MenuItem = MenuItemWithUrl | MenuItemWithItems;

// Type guard functions
const hasItems = (item: MenuItem): item is MenuItemWithItems => {
  return 'items' in item;
};

const hasUrl = (item: MenuItem): item is MenuItemWithUrl => {
  return 'url' in item;
};

export function AppSidebar() {
  const { userProfile } = useJWTAuth();

  // Define menu items based on user role
  const getMenuItems = (): MenuItem[] => {
    const commonItems: MenuItem[] = [
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
              title: "Studios",
              url: "/studios",
              icon: Camera,
            },
            {
              title: "Package Categories",
              url: "/categories",
              icon: Package,
            },
            {
              title: "Packages",
              url: "/packages",
              icon: Package,
            },
            {
              title: "Additional Services",
              url: "/services",
              icon: Settings,
            },
           
          ],
        },
        {
          title: "Transactions",
          icon: CreditCard,
          items: [
            {
              title: "Bookings",
              url: "/bookings",
              icon: Calendar,
            },
            {
              title: "Walk-in Sessions",
              url: "/walkin-sessions",
              icon: UserCheck,
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
              title: "Monthly",
              url: "/transactions/reports",
              icon: FileText,
            },
            {
              title: "Booking Logs",
              url: "/booking-logs",
              icon: BookOpen,
            },
          ],
        },
        {
          title: "User Management",
          icon: Users,
          items: [
            {
              title: "Accounts",
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
  const ownerOnlyItems: MenuItem[] = userProfile?.role === 'owner' ? [
    {
      title: "Payment Providers",
      url: "/admin/payment-providers",
      icon: Settings,
    },
  ] : [];

  const menuItems = [...getMenuItems(), ...ownerOnlyItems];

  return (
    <Sidebar 
      variant="inset"
      className="bg-background border-r border-border"
    >
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel className="text-foreground">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {hasItems(item) ? (
                    <Collapsible asChild defaultOpen={item.title === "Studio Management"}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            tooltip={item.title}
                            className="text-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton 
                                  asChild
                                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                                >
                                  <Link to={subItem.url}>
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : hasUrl(item) ? (
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      className="text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
