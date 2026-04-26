'use client';

import Link from 'next/link';
import { use, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Menu, X, UtensilsCrossed, Settings, ShieldAlert } from 'lucide-react';
import CompanyLogoHeader from './CompanyLogoHeader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 min-w-[220px]">
        <div className="px-3 py-2 border-b">
          <div className="font-semibold text-sm">{user.name || user.email}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
          <div className="text-xs text-orange-600 font-bold uppercase">{user.role}</div>
        </div>
        {user.role === 'superadmin' && (
          <DropdownMenuItem className="cursor-pointer">
            <Link href="/dashboard/superadmin" className="flex w-full items-center">
              <ShieldAlert className="mr-2 h-4 w-4" />
              <span>Panel Superadmin</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        {user.role !== 'superadmin' && (
          <DropdownMenuItem className="cursor-pointer">
            <Link href="/dashboard/menu" className="flex w-full items-center">
              <UtensilsCrossed className="mr-2 h-4 w-4" />
              <span>Menú</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard/policies" className="flex w-full items-center">
            <ShieldAlert className="mr-2 h-4 w-4" />
            <span>Políticas</span>
          </Link>
        </DropdownMenuItem>
        {user.role === 'superadmin' && (
          <DropdownMenuItem className="cursor-pointer">
            <Link href="/dashboard/stripe-connect" className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Pagos (Stripe)</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard/general" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <CompanyLogoHeader />
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}
