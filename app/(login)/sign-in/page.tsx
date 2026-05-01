import { Suspense } from 'react';
import { Login } from '../login';
import { db } from '@/lib/db/drizzle';
import { company } from '@/lib/db/schema';

export default async function SignInPage() {
  const [companyInfo] = await db.select().from(company).limit(1);

  return (
    <Suspense>
      <Login
        mode="signin"
        companyName={companyInfo?.name || 'MenuHub'}
        logoUrl={companyInfo?.logoUrl}
      />
    </Suspense>
  );
}
