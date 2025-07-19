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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Payment Gateway', href: '/payment-gateway', icon: CreditCard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Users', 
    href: '/admin',
     icon: Users, 
     children: [
      { name: 'Accounts', href: '/admin/users' },
      { name: 'Customer Profiles', href: '/admins/customers' },
    ],
    
    },
  {
    name: 'Studio Management',
    href: '/studio',
    icon: Package,
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
  
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 border-r border-border bg-background transition-transform duration-300 lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <div>
                <h2 className="font-semibold text-elegant">Studio Noir</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-between text-left transition-elegant hover-lift',
                        isActive(item.href) && 'bg-secondary text-primary'
                      )}
                      onClick={() => toggleExpanded(item.name)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          expandedItems.includes(item.name) && 'rotate-180'
                        )}
                      />
                    </Button>
                    
                    {expandedItems.includes(item.name) && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            className={({ isActive }) =>
                              cn(
                                'block px-3 py-2 text-sm rounded-md transition-elegant hover-lift',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              )
                            }
                          >
                            {child.name}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-elegant hover-lift',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};