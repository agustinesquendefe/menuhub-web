"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MenuManager({ onCategoryCreated, onProductCreated }) {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <Button onClick={() => setShowCategoryForm((v) => !v)}>
          {showCategoryForm ? 'Ocultar formulario de categoría' : 'Crear categoría'}
        </Button>
        {showCategoryForm && (
          <form className="mt-4 space-y-2">
            <Label>Nombre</Label>
            <Input name="category-name" placeholder="Nombre de la categoría" />
            <Label>Descripción</Label>
            <Input name="category-description" placeholder="Descripción (opcional)" />
            <Button type="submit">Guardar categoría</Button>
          </form>
        )}
      </div>
      <div>
        <Button onClick={() => setShowProductForm((v) => !v)}>
          {showProductForm ? 'Ocultar formulario de producto' : 'Crear producto'}
        </Button>
        {showProductForm && (
          <form className="mt-4 space-y-2" onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = form['product-name'].value;
            const description = form['product-description'].value;
            const price = form['product-price'].value;
            const imageFile = form['product-image'].files[0];
            const showPicture = form['show-picture'].checked;

            let imageUrl = null;
            if (imageFile) {
              const fileExt = imageFile.name.split('.').pop();
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
              const { data, error } = await supabase.storage.from('menu-images').upload(fileName, imageFile);
              if (error) {
                alert('Error subiendo imagen: ' + error.message);
                return;
              }
              imageUrl = supabase.storage.from('menu-images').getPublicUrl(fileName).data.publicUrl;
            }

            // Aquí deberías llamar a tu endpoint o acción para guardar el producto en la base de datos
            // Por ejemplo: await createProduct({ name, description, price, image: imageUrl, showPicture })
            alert(`Producto creado:\nNombre: ${name}\nDescripción: ${description}\nPrecio: ${price}\nImagen: ${imageUrl}\nMostrar imagen: ${showPicture}`);
            form.reset();
          }}>
            <Label>Nombre</Label>
            <Input name="product-name" placeholder="Nombre del producto" />
            <Label>Descripción</Label>
            <Input name="product-description" placeholder="Descripción (opcional)" />
            <Label>Precio</Label>
            <Input name="product-price" placeholder="Precio" type="number" min="0" step="0.01" />
            <Label>Imagen</Label>
            <Input name="product-image" type="file" accept="image/*" />
            <div className="flex items-center gap-2">
              <input id="show-picture" name="show-picture" type="checkbox" className="accent-orange-500" />
              <Label htmlFor="show-picture">Mostrar imagen en el menú</Label>
            </div>
            <Button type="submit">Guardar producto</Button>
          </form>
        )}
      </div>
    </div>
  );
}
