"use client";

import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { X } from "lucide-react";
import { useActionState, useState } from "react";
import { updateCategory } from "@/lib/db/menu-actions";
import { ActionState } from "@/lib/auth/middleware";
import { Category } from "@/lib/db/schema";

export default function EditCategoryForm({ category, onClose }: { category: Category; onClose: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateCategory, { error: '' });

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="categoryId" value={category.id} />
      <div>
        <Label htmlFor="edit-cat-name">Nombre</Label>
        <Input
          id="edit-cat-name"
          name="name"
          defaultValue={category.name}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="edit-cat-desc">Descripción</Label>
        <Input
          id="edit-cat-desc"
          name="description"
          defaultValue={category.description || ''}
          className="mt-1"
        />
      </div>
      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}