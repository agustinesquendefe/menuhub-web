import { NextRequest, NextResponse } from "next/server";
import { getPaymentProviders } from "@/lib/db/payment-provider-actions";

const COUNTRY_CODES: Record<string, string> = {
  US: 'US',
  USA: 'US',
  'UNITED STATES': 'US',
  'UNITED STATES OF AMERICA': 'US',
  'ESTADOS UNIDOS': 'US',
};

function normalizeCountryCode(country: string | null | undefined) {
  const normalized = country?.trim().toUpperCase();
  if (!normalized) return '';
  return COUNTRY_CODES[normalized] ?? normalized;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  let providers = await getPaymentProviders();
  if (country) {
    const countryCode = normalizeCountryCode(country);
    providers = providers.filter(p =>
      normalizeCountryCode(p.country) === countryCode && p.active
    );
  }
  return NextResponse.json(providers);
}
