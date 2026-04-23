import { NextResponse } from "next/server";
import { getPaymentProviders } from "@/lib/db/payment-provider-actions";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  let providers = await getPaymentProviders();
  if (country) {
    providers = providers.filter(p => p.country === country && p.active);
  }
  return NextResponse.json(providers);
}
