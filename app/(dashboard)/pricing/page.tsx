import { Check } from 'lucide-react';
import Link from 'next/link';
import { stripe } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import { db } from '@/lib/db/drizzle';
import { company } from '@/lib/db/schema';
import { publicServiceCheckoutAction } from '@/app/public-checkout-actions';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [companyInfo] = await db.select().from(company).limit(1);
  const companyName = companyInfo?.name || 'MenuHub';

  const subscriptionPriceId = process.env.PRICE_ID;
  const setupPriceId = process.env.SETUP_PRICE_ID;

  if (!subscriptionPriceId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center">
          <p className="text-red-600 font-bold mb-4">Error: Pricing not configured</p>
          <p className="text-gray-600">Required environment variable: PRICE_ID</p>
        </div>
        <PublicFooter companyName={companyName} />
      </main>
    );
  }

  try {
    const subscriptionPrice = await stripe.prices.retrieve(subscriptionPriceId, {
      expand: ['product'],
    });

    if (!subscriptionPrice) {
      throw new Error('Could not retrieve the Stripe subscription price');
    }

    let setupPrice = null;
    if (setupPriceId) {
      setupPrice = await stripe.prices.retrieve(setupPriceId);
    }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Digital Menu for Your Restaurant</h1>
          <p className="text-lg text-gray-600">Turn your menu into a digital experience</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <PricingCard
            subscriptionPrice={subscriptionPrice.unit_amount || 0}
            setupPrice={setupPrice?.unit_amount || 0}
            interval={subscriptionPrice.recurring?.interval || 'month'}
            trialDays={subscriptionPrice.recurring?.trial_period_days || 14}
            features={[
              'Custom digital menu',
              'Full dish and price management',
              'QR code for sharing',
              '24/7 dashboard access',
              'Automatic updates',
              'Email support',
              'Security and backups included',
            ]}
            subscriptionPriceId={subscriptionPriceId}
            setupPriceId={setupPriceId}
          />
        </div>

        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "What is the total cost?",
                a: `$${(setupPrice?.unit_amount || 0) / 100} initial setup + $${(subscriptionPrice.unit_amount || 0) / 100}/month`
              },
              {
                q: "Is there a trial period?",
                a: "Yes, you get 14 free subscription days to try the full platform."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your monthly subscription whenever you want."
              },
              {
                q: "What does the plan include?",
                a: "Custom digital menu, dish management, QR codes, dashboard access, automatic updates, and email support."
              },
            ].map((item, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PublicFooter companyName={companyName} />
    </main>
  );
  } catch (error) {
    console.error('Error fetching price from Stripe:', error);
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center">
          <p className="text-red-600 font-bold mb-4">Error loading price</p>
          <p className="text-gray-600 mb-4">Could not retrieve the price from Stripe.</p>
          <p className="text-sm text-gray-500">
            Verify that PRICE_ID is correctly configured in the environment variables.
          </p>
          <pre className="mt-4 bg-red-50 p-4 rounded text-left text-sm overflow-auto">
            {String(error)}
          </pre>
        </div>
        <PublicFooter companyName={companyName} />
      </main>
    );
  }
}

function PublicFooter({ companyName }: { companyName: string }) {
  return (
    <footer className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-500">
      <p>© {new Date().getFullYear()} {companyName}. Digital menu service.</p>
      <div className="flex gap-4">
        <Link href="/pricing" className="hover:text-gray-950">Pricing</Link>
        <Link href="/sign-in" className="hover:text-gray-950">Sign in</Link>
      </div>
    </footer>
  );
}


function PricingCard({
  subscriptionPrice,
  setupPrice,
  interval,
  trialDays,
  features,
  subscriptionPriceId,
  setupPriceId,
}: {
  subscriptionPrice: number;
  setupPrice: number;
  interval: string;
  trialDays: number;
  features: string[];
  subscriptionPriceId: string;
  setupPriceId?: string;
}) {
  const monthlyPrice = subscriptionPrice / 100;
  const setupCost = setupPrice / 100;

  return (
    <div className="relative rounded-lg border border-orange-500 bg-white shadow-lg ring-2 ring-orange-100 p-8">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Full Plan
        </span>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2 mt-4">Digital Menu</h2>
      <p className="text-sm text-gray-600 mb-8">14-day free trial</p>
      
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="space-y-3">
          {setupCost > 0 && (
            <div className="flex justify-between text-base">
              <span className="text-gray-700">Initial setup:</span>
              <span className="font-semibold text-gray-900">${setupCost.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base">
            <span className="text-gray-700">Monthly subscription:</span>
            <span className="font-semibold text-gray-900">${monthlyPrice.toFixed(2)}</span>
          </div>
          {setupCost > 0 && (
            <p className="text-xs text-gray-500">
              The setup fee is charged only once in the first month
            </p>
          )}
        </div>
      </div>
      
      <ul className="space-y-3 mb-10">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      
      <form action={publicServiceCheckoutAction} className="w-full">
        <input type="hidden" name="priceId" value={subscriptionPriceId} />
        {setupPriceId && <input type="hidden" name="setupPriceId" value={setupPriceId} />}
        <SubmitButton />
      </form>
    </div>
  );
}
