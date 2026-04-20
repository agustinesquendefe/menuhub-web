"use client";

import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Plus, X } from "lucide-react";
import { useActionState, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/db/menu-actions";
import { ActionState } from "@/lib/auth/middleware";
import { supabase } from "@/lib/supabase/client";

export default function AddProductForm({ categoryId, categoryName, teamId, onClose }: { categoryId: number; categoryName: string; teamId: number; onClose?: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProduct, { error: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      formRef.current?.reset();
      onClose?.();
    }
  }, [state?.success]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const description = formData.get('description') as string;
    const imageFile = (form.elements.namedItem('image') as HTMLInputElement)?.files?.[0] || null;
    const showPicture = (form.elements.namedItem('showPicture') as HTMLInputElement)?.checked || false;

    let imageUrl = '';
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${teamId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('team-images').upload(fileName, imageFile);
      if (error) {
        setError('Error subiendo imagen: ' + error.message);
        setSubmitting(false);
        return;
      }
      imageUrl = supabase.storage.from('team-images').getPublicUrl(fileName).data.publicUrl;
    }

    // Construir FormData para enviar a la acción
    const submitData = new FormData();
    submitData.set('categoryId', String(categoryId));
    submitData.set('name', name);
    submitData.set('price', price);
    submitData.set('description', description);
    submitData.set('image', imageUrl);
    submitData.set('showPicture', showPicture ? 'true' : 'false');
    const allergenWarning = (form.elements.namedItem('allergenWarning') as HTMLInputElement)?.checked || false;
    submitData.set('allergenWarning', allergenWarning ? 'true' : 'false');

    // Llamar a la acción del backend
    startTransition(() => {
      action(submitData);
    });
    setSubmitting(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 bg-white p-3 rounded-lg border border-dashed">
      <h4 className="font-medium">
        Agregar Producto a {categoryName}
      </h4>
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label htmlFor={`prod-name-${categoryId}`} className="text-sm">Nombre</Label>
          <Input
            id={`prod-name-${categoryId}`}
            name="name"
            placeholder="Nombre del producto"
            required
            className="mt-1 text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`prod-price-${categoryId}`} className="text-sm">Precio</Label>
          <Input
            id={`prod-price-${categoryId}`}
            name="price"
            placeholder="0.00"
            type="number"
            step="0.01"
            required
            className="mt-1 text-sm"
            onWheel={e => e.currentTarget.blur()}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`prod-desc-${categoryId}`} className="text-sm my-5">Descripción (opcional)</Label>
        <Input
          id={`prod-desc-${categoryId}`}
          name="description"
          placeholder="Descripción del producto"
          className="mt-1 text-sm"
        />
      </div>
      <div>
        <Label htmlFor={`prod-image-${categoryId}`} className="text-sm my-5">Imagen</Label>
        <Input
          id={`prod-image-${categoryId}`}
          name="image"
          type="file"
          accept="image/*"
          className="mt-1 text-sm cursor-pointer"
        />
      </div>
      <div className="flex items-center gap-2 my-10">
        <input id={`prod-showPicture-${categoryId}`} name="showPicture" type="checkbox" className="accent-black cursor-pointer" />
        <Label htmlFor={`prod-showPicture-${categoryId}`}>Mostrar imagen en el menú</Label>
      </div>
      <div className="flex items-center gap-2">
        <input id={`prod-allergen-${categoryId}`} name="allergenWarning" type="checkbox" className="accent-orange-500 cursor-pointer" />
        <Label htmlFor={`prod-allergen-${categoryId}`} className="text-orange-700">Aplica aviso de alérgenos</Label>
      </div>
      {(state?.error || error) && <p className="text-red-500 text-sm">{state?.error || error}</p>}
      <div className="flex flex-col gap-2">
        <Button type="submit" size="sm" disabled={pending || submitting} className="w-full cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          {(pending || submitting) ? 'Agregando...' : 'Agregar Producto'}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full cursor-pointer hover:bg-black hover:text-white">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}