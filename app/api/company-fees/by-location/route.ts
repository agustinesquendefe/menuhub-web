import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFeeByLocation } from '@/lib/db/company-fee-actions';
import { db } from '@/lib/db/drizzle';
import { company, teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/company-fees/by-location?country=US&state=CA
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let country = searchParams.get('country');
  let state = searchParams.get('state');
  const requestedCompanyId = Number(searchParams.get('companyId'));
  const requestedTeamId = Number(searchParams.get('teamId'));
  let companyId = Number.isFinite(requestedCompanyId) && requestedCompanyId > 0
    ? requestedCompanyId
    : null;
  if (Number.isFinite(requestedTeamId) && requestedTeamId > 0) {
    const [team] = await db.select().from(teams).where(eq(teams.id, requestedTeamId)).limit(1);
    if (team) {
      companyId = companyId ?? team.companyId;
      country = team.country;
      state = team.state;
    }
  }
  if (!companyId) {
    const result = await db.select().from(company).limit(1);
    if (!result[0]) return NextResponse.json({ error: 'No company found' }, { status: 404 });
    companyId = result[0].id;
  }
  const fee = await getCompanyFeeByLocation(companyId, country, state);
  if (!fee) {
    return NextResponse.json({
      feePercent: 0,
      feeFixed: 0,
      matchedBy: null,
      companyId,
      country,
      state,
    });
  }
  return NextResponse.json({
    feePercent: Number(fee.feePercent),
    feeFixed: Number(fee.feeFixed),
    matchedBy: fee.state ? 'state' : 'country',
    companyId,
    country,
    state,
  });
}
