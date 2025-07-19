
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
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['admin', 'owner', 'keuangan', 'pelanggan']
  },
  {
    title: 'Studio Management',
    icon: Building2,
    roles: ['admin', 'owner'],
    children: [
      {
        title: 'Studios',
        href: '/studio/studios',
        icon: Building2
      },
      {
        title: 'Package Categories',
        href: '/studio/package-categories',
        icon: Package
      },
      {
        title: 'Packages',
        href: '/studio/packages',
        icon: Package
      },
      {
        title: 'Additional Services',
        href: '/studio/services',
        icon: Settings
      }
    ]
  },
  {
    title: 'Bookings & Sessions',
    icon: Calendar,
    roles: ['admin', 'owner', 'keuangan'],
    children: [
      {
        title: 'Bookings Transaction',
        href: '/studio/bookings',
        icon: Calendar
      },
      {
        title: 'Walk-in Sessions',
        href: '/studio/walkin-sessions',
        icon: Clock
      },
      {
        title: 'Booking Logs',
        href: '/studio/booking-logs',
        icon: FileText
      }
    ]
  },
  {
    title: 'Transactions',
    icon: CreditCard,
    roles: ['admin', 'owner', 'keuangan'],
    children: [
      {
        title: 'Offline Transactions',
        href: '/studio/offline-transactions',
        icon: CreditCard
      },
      {
        title: 'Transaction History',
        href: '/transactions',
        icon: CreditCard
      }
    ]
  },
  {
    title: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'owner', 'keuangan'],
    children: [
      {
        title: 'Transaction Reports',
        href: '/transactions/reports',
        icon: BarChart3
      },
      {
        title: 'Online Bookings Report',
        href: '/transactions/online-bookings',
        icon: FileText
      },
      {
        title: 'Offline Bookings Report',
        href: '/transactions/offline-bookings',
        icon: FileText
      },
      {
        title: 'Monthly Recaps',
        href: '/recaps',
        icon: BarChart3
      }
    ]
  },
  {
    title: 'Administration',
    icon: Users,
    roles: ['admin', 'owner'],
    children: [
      {
        title: 'Customer Management',
        href: '/admin/customers',
        icon: Users
      },
      {
        title: 'User Management',
        href: '/admin/users',
        icon: UserPlus
      },
      {
        title: 'Payment Providers',
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
      name: item.title,
      href: item.href,
      icon: item.icon,
      children: item.children || []
    }));
};
