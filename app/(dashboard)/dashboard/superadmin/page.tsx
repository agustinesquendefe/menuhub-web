import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

import TeamsTable from "./TeamsTable";
import CompanyConfig from "./CompanyConfig";
import PaymentProvidersTable from "./PaymentProvidersTable.client";

export default async function SuperadminPage() {
  const session = await getSession();
  if (!session || session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Panel Superadmin</h1>
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Equipos registrados</h2>
        <TeamsTable />
      </section>
      <section>
        <PaymentProvidersTable />
      </section>
    </div>
  );
}
