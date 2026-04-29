import { db } from '@/lib/db/drizzle';
import { companyFees, NewCompanyFee } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const COUNTRY_CODES: Record<string, string> = {
  US: 'US',
  USA: 'US',
  'UNITED STATES': 'US',
  'UNITED STATES OF AMERICA': 'US',
  'ESTADOS UNIDOS': 'US',
};

const US_STATE_CODES: Record<string, string> = {
  AL: 'AL',
  ALABAMA: 'AL',
  AK: 'AK',
  ALASKA: 'AK',
  AZ: 'AZ',
  ARIZONA: 'AZ',
  AR: 'AR',
  ARKANSAS: 'AR',
  CA: 'CA',
  CALIFORNIA: 'CA',
  CO: 'CO',
  COLORADO: 'CO',
  CT: 'CT',
  CONNECTICUT: 'CT',
  DE: 'DE',
  DELAWARE: 'DE',
  FL: 'FL',
  FLORIDA: 'FL',
  GA: 'GA',
  GEORGIA: 'GA',
  HI: 'HI',
  HAWAII: 'HI',
  ID: 'ID',
  IDAHO: 'ID',
  IL: 'IL',
  ILLINOIS: 'IL',
  IN: 'IN',
  INDIANA: 'IN',
  IA: 'IA',
  IOWA: 'IA',
  KS: 'KS',
  KANSAS: 'KS',
  KY: 'KY',
  KENTUCKY: 'KY',
  LA: 'LA',
  LOUISIANA: 'LA',
  ME: 'ME',
  MAINE: 'ME',
  MD: 'MD',
  MARYLAND: 'MD',
  MA: 'MA',
  MASSACHUSETTS: 'MA',
  MI: 'MI',
  MICHIGAN: 'MI',
  MN: 'MN',
  MINNESOTA: 'MN',
  MS: 'MS',
  MISSISSIPPI: 'MS',
  MO: 'MO',
  MISSOURI: 'MO',
  MT: 'MT',
  MONTANA: 'MT',
  NE: 'NE',
  NEBRASKA: 'NE',
  NV: 'NV',
  NEVADA: 'NV',
  NH: 'NH',
  'NEW HAMPSHIRE': 'NH',
  NJ: 'NJ',
  'NEW JERSEY': 'NJ',
  NM: 'NM',
  'NEW MEXICO': 'NM',
  NY: 'NY',
  'NEW YORK': 'NY',
  NC: 'NC',
  'NORTH CAROLINA': 'NC',
  'CAROLINA DEL NORTE': 'NC',
  ND: 'ND',
  'NORTH DAKOTA': 'ND',
  OH: 'OH',
  OHIO: 'OH',
  OK: 'OK',
  OKLAHOMA: 'OK',
  OR: 'OR',
  OREGON: 'OR',
  PA: 'PA',
  PENNSYLVANIA: 'PA',
  RI: 'RI',
  'RHODE ISLAND': 'RI',
  SC: 'SC',
  'SOUTH CAROLINA': 'SC',
  SD: 'SD',
  'SOUTH DAKOTA': 'SD',
  TN: 'TN',
  TENNESSEE: 'TN',
  TX: 'TX',
  TEXAS: 'TX',
  UT: 'UT',
  UTAH: 'UT',
  VT: 'VT',
  VERMONT: 'VT',
  VA: 'VA',
  VIRGINIA: 'VA',
  WA: 'WA',
  WASHINGTON: 'WA',
  WV: 'WV',
  'WEST VIRGINIA': 'WV',
  WI: 'WI',
  WISCONSIN: 'WI',
  WY: 'WY',
  WYOMING: 'WY',
};

function normalizeCountryCode(country: string | null | undefined) {
  const normalized = country?.trim().toUpperCase();
  if (!normalized) return '';
  return COUNTRY_CODES[normalized] ?? normalized;
}

function normalizeStateCode(state: string | null | undefined) {
  const normalized = state?.trim().toUpperCase();
  if (!normalized) return '';
  return US_STATE_CODES[normalized] ?? normalized.slice(0, 2);
}

// Obtener todos los fees de una compañía
export async function getCompanyFees(companyId: number) {
  return await db.select().from(companyFees).where(eq(companyFees.companyId, companyId));
}

// Obtener fee por país/estado
export async function getCompanyFeeByLocation(companyId: number, country?: string | null, state?: string | null) {
  const normalizedCountry = normalizeCountryCode(country);
  const normalizedState = normalizeStateCode(state);
  const fees = await getCompanyFees(companyId);

  if (normalizedState) {
    const byState = fees.find(fee =>
      normalizeStateCode(fee.state) === normalizedState
    );
    if (byState) return byState;
  }

  const byCountry = fees.find(fee =>
    normalizeCountryCode(fee.country) === normalizedCountry &&
    !normalizeStateCode(fee.state)
  );
  if (byCountry) return byCountry;
  return null;
}

// Crear un fee
export async function createCompanyFee(data: NewCompanyFee) {
  const [created] = await db.insert(companyFees).values(data).returning();
  return created;
}

// Actualizar un fee
export async function updateCompanyFee(id: number, data: Partial<NewCompanyFee>) {
  const [updated] = await db.update(companyFees).set({ ...data, updatedAt: new Date() }).where(eq(companyFees.id, id)).returning();
  return updated;
}

// Eliminar un fee
export async function deleteCompanyFee(id: number) {
  const [deleted] = await db.delete(companyFees).where(eq(companyFees.id, id)).returning();
  return deleted;
}
