'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import {
  createCategory,
  createProduct,
  updateCategory,
  updateProduct,
  deleteCategory,
  deleteProduct,
} from '@/lib/db/menu-actions';
import { Category, Product } from '@/lib/db/schema';
import type { ActionState } from '@/lib/auth/middleware';

interface MenuManagerProps {
  teamId: number;
  initialCategories: (Category & { products: Product[] })[];
}

export function MenuManager({ teamId, initialCategories }: MenuManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // Category form state
  const [categoryState, categoryAction, categoryPending] = useActionState<ActionState, FormData>(
    createCategory,
    { error: '' }
  );

  // Product form state
  const [productState, productAction, productPending] = useActionState<ActionState, FormData>(
    createProduct,
    { error: '' }
  );

  const handleDeleteCategory = async (categoryId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría y todos sus productos?')) {
      const formData = new FormData();
      formData.append('id', categoryId.toString());
      const result = await deleteCategory({}, formData);
      if (!result.error) {
        setCategories(categories.filter(c => c.id !== categoryId));
      }
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      const formData = new FormData();
      formData.append('id', productId.toString());
      const result = await deleteProduct({}, formData);
      if (!result.error) {
        setCategories(
          categories.map(c => ({
            ...c,
            products: c.products.filter(p => p.id !== productId),
          }))
        );
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Add Category Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Crear Nueva Categoría</h2>
        <form action={categoryAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="cat-name">Nombre de la Categoría</Label>
              <Input
                id="cat-name"
                name="name"
                placeholder="Ej: Entrantes, Platos Principales, Bebidas"
                required
                maxLength={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Descripción (opcional)</Label>
              <Input
                id="cat-desc"
                name="description"
                placeholder="Descripción de la categoría"
                maxLength={500}
                className="mt-1"
              />
            </div>
          </div>
          {categoryState?.error && (
            <div className="text-red-500 text-sm">{categoryState.error}</div>
          )}
          <Button
            type="submit"
            disabled={categoryPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {categoryPending ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </form>
      </Card>

      {/* Categories List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Categorías y Productos</h2>
        {categories.length === 0 ? (
          <p className="text-gray-500">No hay categorías aún. Crea una para comenzar.</p>
        ) : (
          categories.map(category => (
            <Card key={category.id} className="overflow-hidden">
              <div className="p-4">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">{category.products.length} productos</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Edit Category Form */}
                {editingCategory === category.id && (
                  <div className="mt-4 pt-4 border-t">
                    <EditCategoryForm category={category} onClose={() => setEditingCategory(null)} />
                  </div>
                )}

                {/* Products List */}
                {expandedCategory === category.id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-3">
                      {category.products.length === 0 ? (
                        <p className="text-sm text-gray-500">Sin productos</p>
                      ) : (
                        category.products.map(product => (
                          <div key={product.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-gray-600">{product.description}</p>
                              )}
                              <p className="text-sm font-semibold text-orange-600 mt-1">${product.price}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Product Form */}
                    <div className="mt-4 pt-4 border-t">
                      <AddProductForm categoryId={category.id} categoryName={category.name} />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function EditCategoryForm({ category, onClose }: { category: Category; onClose: () => void }) {
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

function AddProductForm({ categoryId, categoryName }: { categoryId: number; categoryName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createProduct, { error: '' });

  return (
    <form action={action} className="space-y-3 bg-white p-3 rounded-lg border border-dashed">
      <h4 className="font-medium">Agregar Producto a {categoryName}</h4>
      <input type="hidden" name="categoryId" value={categoryId} />
      
      <div className="grid grid-cols-2 gap-3">
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
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`prod-desc-${categoryId}`} className="text-sm">Descripción (opcional)</Label>
        <Input
          id={`prod-desc-${categoryId}`}
          name="description"
          placeholder="Descripción del producto"
          className="mt-1 text-sm"
        />
      </div>

      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}

      <Button type="submit" size="sm" disabled={pending} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        {pending ? 'Agregando...' : 'Agregar Producto'}
      </Button>
    </form>
  );
}
