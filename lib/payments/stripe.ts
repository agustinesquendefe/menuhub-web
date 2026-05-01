// Actualiza los datos del Stripe Connect Account si cambian en el equipo
export async function updateStripeConnectAccount({
  accountId,
  name,
  email,
  phone,
  line1,
  line2,
  city,
  state,
  zipcode,
  country
}: {
  accountId: string;
  name?: string;
  email?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}) {
  if (!accountId) return;
  const update: any = {};
  if (name) update["business_profile"] = { name };
  if (email) update["email"] = email;
  if (phone) update["company"] = { ...update["company"], phone };
  if (line1 || line2 || city || state || zipcode || country) {
    update["company"] = {
      ...update["company"],
      address: {
        ...(line1 ? { line1 } : {}),
        ...(line2 ? { line2 } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(zipcode ? { postal_code: zipcode } : {}),
        ...(country ? { country } : {})
      }
    };
  }
  if (Object.keys(update).length === 0) return;
  await stripe.accounts.update(accountId, update);
}
import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription
} from '@/lib/db/queries';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

export async function createCheckoutSession({
  team,
  subscriptionPriceId,
  setupPriceId
}: {
  team: Team | null;
  subscriptionPriceId: string;
  setupPriceId?: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect('/pricing');
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Add setup/flat fee if provided
  if (setupPriceId) {
    lineItems.push({
      price: setupPriceId,
      quantity: 1
    });
  }

  // Add recurring subscription
  lineItems.push({
    price: subscriptionPriceId,
    quantity: 1
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: team.stripeCustomerId || undefined,
    client_reference_id: user.id.toString(),
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14
    }
  });

  redirect(session.url!);
}

export async function createCustomerPortalSession(team: Team) {
  if (!team.stripeCustomerId || !team.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(team.stripeProductId);
    if (!product.active) {
      throw new Error("Team's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: 'recurring'
    });

    const portalUpdatePrices = prices.data.filter((price) => {
      return (
        price.active &&
        price.billing_scheme === 'per_unit' &&
        price.recurring?.usage_type === 'licensed'
      );
    });

    const subscriptionUpdateFeature:
      Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate =
      portalUpdatePrices.length > 0
        ? {
            enabled: true,
            default_allowed_updates: ['price', 'quantity', 'promotion_code'],
            proration_behavior: 'create_prorations',
            products: [
              {
                product: product.id,
                prices: portalUpdatePrices.map((price) => price.id)
              }
            ]
          }
        : {
            enabled: false
          };

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: subscriptionUpdateFeature,
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        payment_method_update: {
          enabled: true
        }
      }
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error('Team not found for Stripe customer:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: (plan?.product as Stripe.Product).name,
      subscriptionStatus: status
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring'
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days
  }));
}

export async function getStripeOneTimePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'one_time'
  });

  return prices.data.map((price) => {
    const productName = typeof price.product === 'string' 
      ? '' 
      : (price.product && 'name' in price.product ? price.product.name : '');
    
    return {
      id: price.id,
      productId:
        typeof price.product === 'string' ? price.product : price.product?.id || '',
      unitAmount: price.unit_amount,
      currency: price.currency,
      productName
    };
  });
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}

export async function createStripeConnectAccount(teamName: string, teamId: number) {
  try {
    // Build the URL safely
    let businessUrl: string | undefined;
    const baseUrl = process.env.BASE_URL;
    
    // Only include URL if BASE_URL is set and is a valid URL (not localhost for development)
    if (baseUrl && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
      businessUrl = `${baseUrl}/menu/${teamId}`;
    }

    // Create a restricted Stripe Connect account
    const accountData: any = {
      type: 'express',
      country: 'ES',
      business_type: 'individual',
      business_profile: {
        name: teamName
      },
      capabilities: {
        card_payments: {
          requested: true
        },
        transfers: {
          requested: true
        }
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily'
          }
        }
      }
    };

    // Only add URL if we have a valid production URL
    if (businessUrl) {
      accountData.business_profile.url = businessUrl;
    }

    const account = await stripe.accounts.create(accountData);
    return account.id;
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw new Error('Failed to create Stripe Connect account');
  }
}

export async function getStripeConnectAccountLink(connectAccountId: string, teamId: number) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      type: 'account_onboarding',
      refresh_url: `${process.env.BASE_URL}/dashboard/stripe-connect?reauth=true&teamId=${teamId}`,
      return_url: `${process.env.BASE_URL}/dashboard/stripe-connect?onboarded=true&teamId=${teamId}`
    } as any);

    return accountLink.url;
  } catch (error) {
    console.error('Error creating Stripe Connect account link:', error);
    throw new Error('Failed to create Stripe Connect account link');
  }
}
