"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import {
  createSize, updateSize, deleteSize,
  createExtra, updateExtra, deleteExtra,
  createAddition, updateAddition, deleteAddition,
} from "@/lib/db/catalog-actions";
import { Size, Extra, Addition } from "@/lib/db/schema";
import { ActionState } from "@/lib/auth/middleware";

// ─── Reusable inline item form ─────────────────────────────────────────────────

function CatalogItemForm({
  onSubmit,
  pending,
  defaultValues,
  submitLabel,
  onCancel,
}: {
  onSubmit: (fd: FormData) => void;
  pending: boolean;
  defaultValues?: { name: string; price: string; description?: string };
  submitLabel: string;
  onCancel?: () => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <div className="flex-1 min-w-[140px]">
        <Label className="text-xs">Nombre</Label>
        <Input name="name" defaultValue={defaultValues?.name ?? ""} required className="mt-1 h-8 text-sm" />
      </div>
      <div className="w-28">
        <Label className="text-xs">Precio</Label>
        <Input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues?.price ?? "0"}
          required
          className="mt-1 h-8 text-sm"
          onWheel={e => e.currentTarget.blur()}
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <Label className="text-xs">Descripción (opcional)</Label>
        <Input name="description" defaultValue={defaultValues?.description ?? ""} className="mt-1 h-8 text-sm" />
      </div>
      <div className="flex gap-1">
        <Button type="submit" size="sm" disabled={pending} className="h-8 cursor-pointer">
          <Check className="w-4 h-4" />
          <span className="sr-only">{submitLabel}</span>
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 cursor-pointer">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

// ─── Generic section for one catalog type ──────────────────────────────────────

type CatalogItem = Size | Extra | Addition;

function CatalogSection({
  title,
  items,
  createAction,
  updateAction,
  deleteAction,
}: {
  title: string;
  items: CatalogItem[];
  createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  updateAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [, startCreate] = useTransition();
  const [, startUpdate] = useTransition();
  const [, startDelete] = useTransition();

  const [createState, createDispatch, createPending] = useActionState<ActionState, FormData>(createAction, { error: "" });
  const [updateState, updateDispatch, updatePending] = useActionState<ActionState, FormData>(updateAction, { error: "" });
  const [deleteState, deleteDispatch, deletePending] = useActionState<ActionState, FormData>(deleteAction, { error: "" });

  // Refresh after any successful action
  useEffect(() => {
    if (createState?.success || updateState?.success || deleteState?.success) {
      router.refresh();
      setEditingId(null);
    }
  }, [createState?.success, updateState?.success, deleteState?.success]);

  function handleCreate(fd: FormData) {
    startCreate(() => createDispatch(fd));
  }

  function handleUpdate(id: number, fd: FormData) {
    fd.set("id", String(id));
    startUpdate(() => updateDispatch(fd));
  }

  function handleDelete(id: number) {
    if (!confirm(`¿Eliminar este elemento? Los productos que lo usen perderán esta asociación.`)) return;
    const fd = new FormData();
    fd.set("id", String(id));
    startDelete(() => deleteDispatch(fd));
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-base">{title}</h3>

      {/* Existing items */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No hay elementos. Crea uno abajo.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="p-2 bg-gray-50 rounded-lg">
              {editingId === item.id ? (
                <CatalogItemForm
                  defaultValues={{ name: item.name, price: item.price ?? "0", description: item.description ?? "" }}
                  onSubmit={fd => handleUpdate(item.id, fd)}
                  pending={updatePending}
                  submitLabel="Guardar"
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 flex items-center gap-3">
                    <span className="font-medium text-sm">{item.name}</span>
                    {item.price && parseFloat(item.price) > 0 && (
                      <span className="text-xs text-orange-600 font-semibold">+${item.price}</span>
                    )}
                    {item.description && (
                      <span className="text-xs text-gray-500 truncate max-w-xs">{item.description}</span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 cursor-pointer" onClick={() => setEditingId(item.id)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletePending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create new item */}
      <div className="pt-2 border-t">
        <p className="text-xs text-gray-500 mb-2">Agregar nuevo</p>
        <CatalogItemForm
          onSubmit={handleCreate}
          pending={createPending}
          submitLabel={`Agregar ${title}`}
        />
        {createState?.error && <p className="text-red-500 text-xs mt-1">{createState.error}</p>}
      </div>
    </div>
  );
}

// ─── Main CatalogManager ───────────────────────────────────────────────────────

interface CatalogManagerProps {
  initialSizes: Size[];
  initialExtras: Extra[];
  initialAdditions: Addition[];
}

export default function CatalogManager({ initialSizes, initialExtras, initialAdditions }: CatalogManagerProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Gestiona el catálogo compartido de opciones que puedes asignar a tus productos. Los precios se suman al total del pedido.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <CatalogSection
            title="Tamaños"
            items={initialSizes}
            createAction={createSize}
            updateAction={updateSize}
            deleteAction={deleteSize}
          />
        </Card>
        <Card className="p-4">
          <CatalogSection
            title="Extras"
            items={initialExtras}
            createAction={createExtra}
            updateAction={updateExtra}
            deleteAction={deleteExtra}
          />
        </Card>
        <Card className="p-4">
          <CatalogSection
            title="Adiciones"
            items={initialAdditions}
            createAction={createAddition}
            updateAction={updateAddition}
            deleteAction={deleteAddition}
          />
        </Card>
      </div>
    </div>
  );
}
