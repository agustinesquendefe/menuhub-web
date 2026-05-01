import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { getTeamForUser, getUser } from '@/lib/db/queries';

export const metadata = {
  title: 'Billing'
};

const subscriptionLabels: Record<string, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past due',
  unpaid: 'Unpaid',
  canceled: 'Canceled',
  incomplete: 'Incomplete'
};

export default async function BillingPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  if (user.role !== 'owner') {
    redirect('/dashboard');
  }

  const team = await getTeamForUser();
  const subscriptionStatus = team?.subscriptionStatus || 'inactive';
  const statusLabel =
    subscriptionLabels[subscriptionStatus] || 'No active subscription';
  const hasStripeCustomer = Boolean(
    team?.stripeCustomerId && team?.stripeProductId
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
          Billing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage MenuHub payments and subscription for your restaurant.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                Plan actual: {team?.planName || 'Free'}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {statusLabel}
              </p>
            </div>

            {hasStripeCustomer ? (
              <form action={customerPortalAction}>
                <Button type="submit" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  Manage subscription
                </Button>
              </form>
            ) : (
              <Button asChild>
                <Link href="/pricing">Choose plan</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
