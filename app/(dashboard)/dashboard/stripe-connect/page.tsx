import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Stripe Connect Setup',
};

export default async function StripeConnectPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }
  if (user.role !== 'superadmin') {
    redirect('/dashboard');
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Setup</h1>
        <p className="text-gray-600 mt-2">
          Configure your Stripe Connect account to receive customer payments
        </p>
      </div>
    </div>
  );
}
