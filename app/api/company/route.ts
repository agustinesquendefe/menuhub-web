import { db } from '@/lib/db/drizzle';
import { company } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  const result = await db.select().from(company).limit(1);
  return NextResponse.json(result[0] || {});
}

export async function POST(req: Request) {
  const data = await req.json();
  // No enviar campos automáticos
  delete data.createdAt;
  delete data.updatedAt;
  // Solo hay una compañía, actualiza la primera
  const existing = await db.select().from(company).limit(1);
  if (existing[0]) {
    await db.update(company).set(data).where(eq(company.id, existing[0].id));
    return NextResponse.json({ success: true });
  } else {
    const [created] = await db.insert(company).values(data).returning();
    return NextResponse.json(created);
  }
}
