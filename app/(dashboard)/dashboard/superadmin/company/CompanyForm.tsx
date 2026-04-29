"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadCompanyLogo } from "@/lib/supabase/upload-company-logo";
import CompanyFeesManager from "./CompanyFeesManager";

export default function CompanyForm() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/company")
      .then((res) => res.json())
      .then((data) => {
        setCompany(data);
        setLoading(false);
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setCompany({ ...company, [e.target.name]: e.target.value });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    // Si hay un archivo de logo nuevo, súbelo
    const file = fileInputRef.current?.files?.[0];
    let logoUrl = company.logoUrl;
    if (file) {
      const uploadedUrl = await uploadCompanyLogo({ file });
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      }
    }

    const res = await fetch("/api/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...company, logoUrl }),
    });
    setSaving(false);
    if (res.ok) setSuccess(true);
    if (logoUrl) setCompany((c: any) => ({ ...c, logoUrl }));
  }

  if (loading) return <div>Cargando...</div>;

  // company?.id puede ser undefined hasta que cargue
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <Input name="name" value={company?.name || ""} onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Logo</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleLogoChange}
              className="block"
            />
            {(logoPreview || company?.logoUrl) && (
              <img src={logoPreview || company.logoUrl} alt="Logo preview" className="h-12 w-12 rounded object-contain border" />
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea name="description" value={company?.description || ""} onChange={handleChange} className="w-full border rounded p-2 min-h-[80px]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email de contacto</label>
          <Input name="contactEmail" value={company?.contactEmail || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono de contacto</label>
          <Input name="contactPhone" value={company?.contactPhone || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección línea 1</label>
          <Input name="line1" value={company?.line1 || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección línea 2</label>
          <Input name="line2" value={company?.line2 || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <Input name="city" value={company?.city || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado/Provincia</label>
          <Input name="state" value={company?.state || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Código postal</label>
          <Input name="zipcode" value={company?.zipcode || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">País</label>
          <Input name="country" value={company?.country || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Facebook</label>
          <Input name="facebookUrl" value={company?.facebookUrl || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Instagram</label>
          <Input name="instagramUrl" value={company?.instagramUrl || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">TikTok</label>
          <Input name="tiktokUrl" value={company?.tiktokUrl || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">YouTube</label>
          <Input name="youtubeUrl" value={company?.youtubeUrl || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <Input name="whatsappPhone" value={company?.whatsappPhone || ""} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono de llamadas</label>
          <Input name="callPhone" value={company?.callPhone || ""} onChange={handleChange} />
        </div>
        <Button type="submit" disabled={saving} className="cursor-pointer">{saving ? "Guardando..." : "Guardar cambios"}</Button>
        {success && <div className="text-green-600 text-sm">¡Cambios guardados!</div>}
      </form>
    </>
  );
}
