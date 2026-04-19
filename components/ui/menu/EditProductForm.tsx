"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Eye, EyeOff, X, ChevronDown, ChevronUp } from "lucide-react";
import { updateProduct } from "@/lib/db/menu-actions";
import { ActionState } from "@/lib/auth/middleware";
import { Product, Size, Extra, Addition } from "@/lib/db/schema";
import { supabase } from "@/lib/supabase/client";

interface ProductWithAssociations extends Product {
  sizes: Size[];
  extras: Extra[];
  additions: Addition[];
}

interface Catalog {
  sizes: Size[];
  extras: Extra[];
  additions: Addition[];
}

function AssociationCheckboxGroup({
  label,
  items,
  selectedIds,
  onChange,
  emptyMessage,
}: {
  label: string;
  items: { id: number; name: string; price: string | null }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  emptyMessage: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-medium"
      >
        <span>{label} {selectedIds.length > 0 && <span className="ml-1 text-xs text-orange-600 font-semibold">({selectedIds.length})</span>}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-3 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-gray-400">{emptyMessage}</p>
          ) : (
            items.map(item => (
              <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggle(item.id)}
                  className="accent-black"
                />
                <span className="flex-1">{item.name}</span>
                {item.price && parseFloat(item.price) > 0 && (
                  <span className="text-xs text-gray-500">+${item.price}</span>
                )}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function EditProductForm({
  product,
  categoryId,
  teamId,
  catalog,
  onClose,
}: {
  product: ProductWithAssociations;
  categoryId: number;
  teamId: number;
  catalog: Catalog;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProduct, { error: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(product.isActive);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>(product.sizes.map(s => s.id));
  const [selectedExtraIds, setSelectedExtraIds] = useState<number[]>(product.extras.map(e => e.id));
  const [selectedAdditionIds, setSelectedAdditionIds] = useState<number[]>(product.additions.map(a => a.id));

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onClose();
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

    let imageUrl = product.image || '';
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${teamId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('team-images').upload(fileName, imageFile);
      if (uploadError) {
        setError('Error subiendo imagen: ' + uploadError.message);
        setSubmitting(false);
        return;
      }
      imageUrl = supabase.storage.from('team-images').getPublicUrl(fileName).data.publicUrl;
    }

    const submitData = new FormData();
    submitData.set('productId', String(product.id));
    submitData.set('categoryId', String(categoryId));
    submitData.set('name', name);
    submitData.set('price', price);
    submitData.set('description', description);
    submitData.set('image', imageUrl);
    submitData.set('showPicture', showPicture ? 'true' : 'false');
    submitData.set('isActive', isActive ? 'true' : 'false');
    submitData.set('sizeIds', selectedSizeIds.join(','));
    submitData.set('extraIds', selectedExtraIds.join(','));
    submitData.set('additionIds', selectedAdditionIds.join(','));

    startTransition(() => {
      action(submitData);
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-3 rounded-lg border border-dashed">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Editar Producto</h4>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsActive(v => !v)} className="cursor-pointer" title={isActive ? 'Ocultar producto' : 'Mostrar producto'}>
          {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
        </Button>
      </div>
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <div className="grid grid-cols-2 gap-5">
        <div>
          <Label htmlFor={`edit-prod-name-${product.id}`} className="text-sm">Nombre</Label>
          <Input id={`edit-prod-name-${product.id}`} name="name" defaultValue={product.name} required className="mt-1 text-sm" />
        </div>
        <div>
          <Label htmlFor={`edit-prod-price-${product.id}`} className="text-sm">Precio</Label>
          <Input
            id={`edit-prod-price-${product.id}`}
            name="price"
            placeholder="0.00"
            type="number"
            step="0.01"
            required
            className="mt-1 text-sm"
            defaultValue={product.price || ''}
            onWheel={e => e.currentTarget.blur()}
          />
        </div>
      </div>
      <div>
        <Label htmlFor={`edit-prod-desc-${product.id}`} className="text-sm my-5">Descripción (opcional)</Label>
        <Input
          id={`edit-prod-desc-${product.id}`}
          name="description"
          placeholder="Descripción del producto"
          className="mt-1 text-sm"
          defaultValue={product.description || ''}
        />
      </div>
      <div>
        <Label htmlFor={`edit-prod-image-${product.id}`} className="text-sm my-5">Imagen</Label>
        {product.image && (
          <div className="mt-1 mb-2 flex items-center gap-3">
            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded border" />
            <span className="text-xs text-gray-500">Imagen actual. Selecciona un archivo para reemplazarla.</span>
          </div>
        )}
        <Input id={`edit-prod-image-${product.id}`} name="image" type="file" accept="image/*" className="mt-1 text-sm cursor-pointer" />
      </div>
      <div className="flex items-center gap-2">
        <input id={`edit-prod-showPicture-${product.id}`} name="showPicture" type="checkbox" className="accent-black cursor-pointer" defaultChecked={product.showPicture} />
        <Label htmlFor={`edit-prod-showPicture-${product.id}`}>Mostrar imagen en el menú</Label>
      </div>

      {/* Sizes / Extras / Additions */}
      <div className="space-y-2 pt-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Opciones del producto</p>
        <AssociationCheckboxGroup
          label="Tamaños"
          items={catalog.sizes}
          selectedIds={selectedSizeIds}
          onChange={setSelectedSizeIds}
          emptyMessage="No hay tamaños en el catálogo. Agrégalos en la pestaña Catálogo."
        />
        <AssociationCheckboxGroup
          label="Extras"
          items={catalog.extras}
          selectedIds={selectedExtraIds}
          onChange={setSelectedExtraIds}
          emptyMessage="No hay extras en el catálogo. Agrégalos en la pestaña Catálogo."
        />
        <AssociationCheckboxGroup
          label="Adiciones"
          items={catalog.additions}
          selectedIds={selectedAdditionIds}
          onChange={setSelectedAdditionIds}
          emptyMessage="No hay adiciones en el catálogo. Agrégalos en la pestaña Catálogo."
        />
      </div>

      {(state?.error || error) && <p className="text-red-500 text-sm">{state?.error || error}</p>}
      <div className="flex flex-col gap-2">
        <Button type="submit" size="sm" disabled={pending || submitting} className="w-full cursor-pointer">
          <Edit2 className="w-4 h-4 mr-2" />
          {(pending || submitting) ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full cursor-pointer hover:bg-black hover:text-white">
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </form>
  );
}

