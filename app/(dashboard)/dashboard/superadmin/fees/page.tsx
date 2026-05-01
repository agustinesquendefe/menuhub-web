import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import CompanyFeesManager from "../company/CompanyFeesManager";

import { db } from '@/lib/db/drizzle';
import { company } from '@/lib/db/schema';

interface FeesPageProps {
  params?: { id?: string };
  searchParams?: { id?: string };
}

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const session = await getSession();
  if (!session || session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  let companyId: number | undefined = undefined;
  if (searchParams?.id) {
    companyId = Number(searchParams.id);
  } else {
    const result = await db.select().from(company).limit(1);
    if (result[0]) companyId = result[0].id;
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Fee Management</h1>
      {companyId && <CompanyFeesManager companyId={companyId} />}
      {!companyId && <div className="text-red-600">No company registered.</div>}
    </div>
  );
}
