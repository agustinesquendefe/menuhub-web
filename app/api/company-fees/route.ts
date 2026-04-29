import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFees, createCompanyFee, updateCompanyFee, deleteCompanyFee } from '@/lib/db/company-fee-actions';

// GET /api/company-fees?companyId=1
export async function GET(req: NextRequest) {
  const companyId = Number(req.nextUrl.searchParams.get('companyId'));
  if (!companyId) return NextResponse.json({ error: 'companyId requerido' }, { status: 400 });
  const fees = await getCompanyFees(companyId);
  return NextResponse.json({ fees });
}

// POST /api/company-fees
export async function POST(req: NextRequest) {
  const data = await req.json();
  if (!data.companyId || !data.country) return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
  const created = await createCompanyFee(data);
  return NextResponse.json({ fee: created });
}

// PATCH /api/company-fees
export async function PATCH(req: NextRequest) {
  const data = await req.json();
  if (!data.id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  const updated = await updateCompanyFee(data.id, data);
  return NextResponse.json({ fee: updated });
}

// DELETE /api/company-fees?id=123
export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  const deleted = await deleteCompanyFee(id);
  return NextResponse.json({ fee: deleted });
}
