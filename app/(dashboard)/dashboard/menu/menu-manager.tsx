'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
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
import { Category, Product, Size, Extra, Addition, TeamPolicy } from '@/lib/db/schema';
import type { ActionState } from '@/lib/auth/middleware';
import EditProductForm from '@/components/ui/menu/EditProductForm';
import AddProductForm from '@/components/ui/menu/AddProductForm';
import EditCategoryForm from '@/components/ui/menu/EditCategoryForm';
import CatalogManager from '@/components/ui/menu/CatalogManager';
import PoliciesForm from '../policies/policies-form';

interface ProductWithAssociations extends Product {
  sizes: Size[];
  extras: Extra[];
  additions: Addition[];
}

interface CategoryWithProducts extends Category {
  products: ProductWithAssociations[];
}

interface TeamCatalog {
  sizes: Size[];
  extras: Extra[];
  additions: Addition[];
}

interface MenuManagerProps {
  teamId: number;
  initialCategories: CategoryWithProducts[];
  teamCatalog: TeamCatalog;
  initialPolicies: TeamPolicy | null;
}

type Tab = 'menu' | 'catalog' | 'policies';

export function MenuManager({ teamId, initialCategories, teamCatalog, initialPolicies }: MenuManagerProps) {
  const [tab, setTab] = useState<Tab>('menu');
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [addingProductForCategory, setAddingProductForCategory] = useState<number | null>(null);

  // Sincronizar con datos frescos del servidor tras router.refresh()
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const router = useRouter();

  // Category form state
  const [categoryState, categoryAction, categoryPending] = useActionState<ActionState, FormData>(
    createCategory,
    { error: '' }
  );

  useEffect(() => {
    if (categoryState?.success) {
      router.refresh();
    }
  }, [categoryState?.success]);

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
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setTab('menu')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === 'menu' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Menú
        </button>
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === 'catalog' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setTab('policies')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === 'policies' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          Políticas
        </button>
      </div>

      {tab === 'catalog' && (
        <CatalogManager
          initialSizes={teamCatalog.sizes}
          initialExtras={teamCatalog.extras}
          initialAdditions={teamCatalog.additions}
        />
      )}

      {tab === 'policies' && (
        <PoliciesForm initialPolicies={initialPolicies} />
      )}

      {tab === 'menu' && (
      <div className="space-y-8">
      {/* Add Category Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Crear Nueva Categoría
        </h2>
        <form action={categoryAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="cat-name">
                Nombre de la Categoría
              </Label>
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
              <Label htmlFor="cat-desc">
                Descripción (opcional)
              </Label>
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
            <div className="text-red-500 text-sm">
              {categoryState.error}
            </div>
          )}
          <Button
            type="submit"
            disabled={categoryPending}
            className="w-full cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            {categoryPending ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </form>
      </Card>

      {/* Categories List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Categorías y Productos
        </h2>
        {categories.length === 0 ? (
          <p className="text-gray-500">No hay categorías aún. Crea una para comenzar.</p>
        ) : (
          categories.map(category => (
            <Card key={category.id} className="overflow-hidden">
              <div className="p-4">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}>
                    <h3 className="font-semibold text-lg">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">{category.products.length} productos</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className='cursor-pointer'
                      onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 cursor-pointer"
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

                {/* Products List x*/}
                {expandedCategory === category.id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-3">
                      {category.products.length === 0 ? (
                        <div className="py-2">
                          {addingProductForCategory === category.id ? (
                            <AddProductForm
                              categoryId={category.id}
                              categoryName={category.name}
                              teamId={teamId}
                              onClose={() => setAddingProductForCategory(null)}
                            />
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="cursor-pointer"
                                onClick={() => setAddingProductForCategory(category.id)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar producto
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        category.products.map(product => (
                          <div key={product.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-start">
                            {editingProduct === product.id ? (
                              <div className="w-full">
                                <EditProductForm product={product} categoryId={category.id} teamId={teamId} catalog={teamCatalog} onClose={() => setEditingProduct(null)} />
                              </div>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  {product.description && (
                                    <p className="text-sm text-gray-600">{product.description}</p>
                                  )}
                                  {product.price && (
                                    <p className="text-sm font-semibold text-orange-600 mt-1">
                                      {product.currency === 'MXN' ? '$' : product.currency + ' '}
                                      {product.price}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className='cursor-pointer'
                                    onClick={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Product Form */}
                    {category.products.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        {addingProductForCategory === category.id ? (
                          <AddProductForm
                            categoryId={category.id}
                            categoryName={category.name}
                            teamId={teamId}
                            onClose={() => setAddingProductForCategory(null)}
                          />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setAddingProductForCategory(category.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar producto
                          </Button>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            </Card>
          ))
        )}
      </div>
      </div>
      )}
    </div>
  );
}
