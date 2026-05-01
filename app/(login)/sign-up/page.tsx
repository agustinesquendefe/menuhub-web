import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Login } from '../login';
import { db } from '@/lib/db/drizzle';
import { company } from '@/lib/db/schema';

type SignUpPageProps = {
  searchParams?: Promise<{
    inviteId?: string;
    service?: string;
    session_id?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const hasPaidCheckout = params?.service === 'paid' && params?.session_id;
  const hasInvite = Boolean(params?.inviteId);

  if (!hasPaidCheckout && !hasInvite) {
    redirect('/sign-in');
  }

  const [companyInfo] = await db.select().from(company).limit(1);

  return (
    <Suspense>
      <Login
        mode="signup"
        companyName={companyInfo?.name || 'MenuHub'}
        logoUrl={companyInfo?.logoUrl}
      />
    </Suspense>
  );
}
