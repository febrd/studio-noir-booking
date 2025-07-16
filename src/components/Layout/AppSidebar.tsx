
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  CreditCard,
  Package,
  Calendar,
  Receipt,
  Users,
  ChevronDown,
  Settings,
  Building2,
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
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Payment Gateway', href: '/payment-gateway', icon: CreditCard },
  { name: 'Users', href: '/admin/users', icon: Users },
  {
    name: 'Studio Management',
    href: '/studio',
    icon: Building2,
    children: [
      { name: 'Packages', href: '/studio/packages' },
      { name: 'Additional Services', href: '/studio/services' },
      { name: 'Bookings', href: '/studio/bookings' },
    ],
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
    children: [
      { name: 'Online Bookings', href: '/transactions/online' },
      { name: 'Offline Bookings', href: '/transactions/offline' },
      { name: 'Reports', href: '/transactions/reports' },
    ],
  },
  { name: 'Customers', href: '/customers', icon: Calendar },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar variant="sidebar" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          {state === "expanded" && (
            <div>
              <h2 className="font-semibold text-elegant">Studio Noir</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  {item.children ? (
                    <Collapsible
                      open={expandedItems.includes(item.name)}
                      onOpenChange={() => toggleExpanded(item.name)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={isActive(item.href)}
                          className="w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {state === "expanded" && <span>{item.name}</span>}
                          </div>
                          {state === "expanded" && (
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform',
                                expandedItems.includes(item.name) && 'rotate-180'
                              )}
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      
                      {state === "expanded" && (
                        <CollapsibleContent className="ml-6 space-y-1">
                          {item.children.map((child) => (
                            <SidebarMenuButton key={child.href} asChild size="sm">
                              <NavLink
                                to={child.href}
                                className={({ isActive }) =>
                                  cn(
                                    'block text-sm',
                                    isActive && 'bg-accent text-accent-foreground'
                                  )
                                }
                              >
                                {child.name}
                              </NavLink>
                            </SidebarMenuButton>
                          ))}
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <NavLink to={item.href}>
                        <item.icon className="h-4 w-4" />
                        {state === "expanded" && <span>{item.name}</span>}
                      </NavLink>
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
