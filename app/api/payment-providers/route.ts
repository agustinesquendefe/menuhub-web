import { NextResponse } from "next/server";
import { createPaymentProvider, getPaymentProviders } from "@/lib/db/payment-provider-actions";

export async function GET() {
  const providers = await getPaymentProviders();
  return NextResponse.json(providers);
}

export async function POST(req: any) {
  const data = await req.json();
  try {
    await createPaymentProvider({
      ...data,
      feePercent: parseFloat(data.feePercent),
      feeFixed: parseFloat(data.feeFixed),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
