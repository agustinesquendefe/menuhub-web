import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import CompanyForm from "./CompanyForm";

export default async function CompanyPage() {
  const session = await getSession();
  if (!session || session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Configuración de la compañía</h1>
      <CompanyForm />
    </div>
  );
}
