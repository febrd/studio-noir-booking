
import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings,
  Clock,
  UserPlus
} from 'lucide-react';

export const navigationItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['admin', 'owner', 'keuangan', 'pelanggan']
  },
  {
    name: 'Studio Management',
    icon: Building2,
    href: '/studio',
    roles: ['admin', 'owner'],
    children: [
      {
        name: 'Studios',
        href: '/studio/studios',
        icon: Building2
      },
      {
        name: 'Package Categories',
        href: '/studio/package-categories',
        icon: Package
      },
      {
        name: 'Packages',
        href: '/studio/packages',
        icon: Package
      },
      {
        name: 'Additional Services',
        href: '/studio/services',
        icon: Settings
      }
    ]
  },
  {
    name: 'Bookings & Sessions',
    icon: Calendar,
    href: '/bookings',
    roles: ['admin', 'owner', 'keuangan'],
    children: [
      {
        name: 'Bookings Transaction',
        href: '/studio/bookings',
        icon: Calendar
      },
      {
        name: 'Walk-in Sessions',
        href: '/studio/walkin-sessions',
        icon: Clock
      },
      {
        name: 'Booking Logs',
        href: '/studio/booking-logs',
        icon: FileText
      }
    ]
  },
  {
    name: 'Transactions',
    icon: CreditCard,
    href: '/transactions',
    roles: ['admin', 'owner', 'keuangan'],
    children: [
      {
        name: 'Offline Transactions',
        href: '/studio/offline-transactions',
        icon: CreditCard
      },
      {
        name: 'Transaction History',
        href: '/transactions',
        icon: CreditCard
      }
    ]
  },
  {
    name: 'Reports',
    icon: BarChart3,
    href: '/reports',
    roles: ['admin', 'owner', 'keuangan'],
    children: [
      {
        name: 'Transaction Reports',
        href: '/transactions/reports',
        icon: BarChart3
      },
      {
        name: 'Online Bookings Report',
        href: '/transactions/online-bookings',
        icon: FileText
      },
      {
        name: 'Offline Bookings Report',
        href: '/transactions/offline-bookings',
        icon: FileText
      },
      {
        name: 'Monthly Recaps',
        href: '/recaps',
        icon: BarChart3
      }
    ]
  },
  {
    name: 'Administration',
    icon: Users,
    href: '/admin',
    roles: ['admin', 'owner'],
    children: [
      {
        name: 'Customer Management',
        href: '/admin/customers',
        icon: Users
      },
      {
        name: 'User Management',
        href: '/admin/users',
        icon: UserPlus
      },
      {
        name: 'Payment Providers',
        href: '/admin/payment-providers',
        icon: CreditCard
      }
    ]
  }
];

// Helper function to get accessible navigation based on user role
export const getAccessibleNavigation = (userRole: string) => {
  return navigationItems
    .filter(item => item.roles.includes(userRole as any))
    .map(item => ({
      name: item.name,
      href: item.href,
      icon: item.icon,
      children: item.children || []
    }));
};
