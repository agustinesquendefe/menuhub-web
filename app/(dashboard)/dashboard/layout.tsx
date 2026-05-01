
'use client';
import useSWR from 'swr';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  Settings,
  Shield,
  Activity,
  Menu,
  CreditCard,
  MessageCircle
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getWhatsAppHref(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  return `https://wa.me/${digits}`;
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: user } = useSWR('/api/user', fetcher);
  const { data: company } = useSWR('/api/company', fetcher);

  let navItems = user ? [
    { href: '/dashboard', icon: Users, label: 'Team' },
    { href: '/dashboard/menu', icon: Menu, label: 'Menu' },
    { href: '/dashboard/orders', icon: Activity, label: 'Orders' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' }
  ] : [];

  // Personalización según el rol
  if (user?.role === 'superadmin') {
    navItems = [
      { href: '/dashboard/superadmin', icon: Users, label: 'Teams' },
      { href: '/dashboard/superadmin/company', icon: Settings, label: 'Company' },
      { href: '/dashboard/superadmin/fees', icon: Menu, label: 'Fees' },
      { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
      { href: '/dashboard/security', icon: Shield, label: 'Security' }
    ];
  }

  if (user?.role === 'manager') {
    navItems = [
      { href: '/dashboard/orders', icon: Activity, label: 'Orders' }
    ];
  }

  if (user?.role === 'owner') {
    navItems.splice(3, 0, {
      href: '/dashboard/billing',
      icon: CreditCard,
      label: 'Billing'
    });
  }

  const supportHref = getWhatsAppHref(company?.whatsappPhone || company?.callPhone || company?.contactPhone);
  const showSupport = (user?.role === 'owner' || user?.role === 'manager') && supportHref;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Settings</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="flex h-full flex-col overflow-y-auto p-4 pt-0">
            <div>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={`shadow-none my-1 w-full cursor-pointer justify-start ${
                      pathname === item.href ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            {showSupport && (
              <div className="mt-auto border-t pt-4">
                <p className="px-3 text-xs font-medium text-gray-500">
                  Support
                </p>
                <a
                  href={supportHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact via WhatsApp
                </a>
              </div>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
      </div>
    </div>
  );
}
