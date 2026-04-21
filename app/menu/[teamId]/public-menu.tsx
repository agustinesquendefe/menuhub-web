'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, ShoppingCart, Plus, CheckCircle2 } from 'lucide-react';
import { Team, TeamPolicy, Category } from '@/lib/db/schema';
import { CartProvider, ProductWithAssociations, useCart } from './cart-context';
import { AddToCartModal } from './add-to-cart-modal';
import { CartDrawer } from './cart-drawer';
import { CheckoutView } from './checkout-view';

interface CategoryWithProducts extends Category {
  products: ProductWithAssociations[];
}

interface PublicMenuProps {
  team: Team;
  categories: CategoryWithProducts[];
  policies: TeamPolicy | null;
}

function currencySymbol(currency: string | null | undefined): string {
  if (!currency || currency === 'MXN') return '$';
  return currency + ' ';
}

function PolicyBadges({ policies }: { policies: TeamPolicy }) {
  const warnings: string[] = [];
  if (policies.warnRawIngredients) warnings.push('Puede contener ingredientes crudos');
  if (policies.warnAllergens) warnings.push('Informe sobre alergias antes de ordenar');
  if (policies.warnAlcohol) warnings.push('Contiene alcohol — prohibido a menores');
  if (policies.warnGluten) warnings.push('Puede contener gluten');
  if (policies.warnNuts) warnings.push('Puede contener frutos secos');
  if (policies.warnDairy) warnings.push('Puede contener lácteos');
  if (warnings.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800 mb-1">Avisos del establecimiento</p>
        <ul className="list-disc list-inside space-y-0.5">
          {warnings.map(w => (
            <li key={w} className="text-sm text-amber-700">{w}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onSelect,
}: {
  product: ProductWithAssociations;
  onSelect: (p: ProductWithAssociations) => void;
}) {
  const currency = currencySymbol(product.currency);

  return (
    <div
      className="flex container gap-4 py-4 border-b last:border-0 cursor-pointer group"
      onClick={() => onSelect(product)}
    >
      {product.image && product.showPicture && (
        <div className="shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-xl group-hover:brightness-95 transition-all"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>
            {product.allergenWarning && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                <AlertTriangle className="w-3 h-3" />
                Alérgenos
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {product.price && (
              <span className="font-bold text-gray-900">
                {currency}{parseFloat(product.price).toFixed(2)}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); onSelect(product); }}
              className="cursor-pointer w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-sm"
              aria-label={`Agregar ${product.name}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
        )}

        {/* Options chips */}
        {(product.sizes.filter(s => s.isActive).length > 0 ||
          product.extras.filter(e => e.isActive).length > 0 ||
          product.additions.filter(a => a.isActive).length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.sizes.filter(s => s.isActive).map(s => (
              <span key={s.id} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s.name}</span>
            ))}
            {product.extras.filter(e => e.isActive).map(e => (
              <span key={e.id} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{e.name}</span>
            ))}
            {product.additions.filter(a => a.isActive).map(a => (
              <span key={a.id} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{a.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CartIconButton({ onClick }: { onClick: () => void }) {
  const { totalItems } = useCart();
  return (
    <button
      onClick={onClick}
      className="cursor-pointer relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      aria-label="Abrir carrito"
    >
      <ShoppingCart className="w-6 h-6 text-gray-600" />
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
}

function FloatingCartButton({ currency, onClick }: { currency: string; onClick: () => void }) {
  const { totalItems, totalPrice } = useCart();
  if (totalItems === 0) return null;

  return (
    <button
      onClick={onClick}
      className="cursor-pointer fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-full shadow-lg px-6 py-3 flex items-center gap-3 transition-all"
    >
      <div className="relative">
        <ShoppingCart className="w-5 h-5" />
        <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {totalItems}
        </span>
      </div>
      <span className="font-semibold">Ver pedido</span>
      <span className="font-bold">{currency}{totalPrice.toFixed(2)}</span>
    </button>
  );
}

function MenuContent({ team, categories, policies }: PublicMenuProps) {
  const [activeCategory, setActiveCategory] = useState<number>(categories[0]?.id ?? 0);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithAssociations | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const paymentSuccess = searchParams.get('payment') === 'success';

  useEffect(() => {
    if (paymentSuccess) clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSuccess]);

  const currentCategory = categories.find(c => c.id === activeCategory) ?? categories[0];
  const currency = currencySymbol(currentCategory?.products[0]?.currency);

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">¡Pago realizado!</h2>
          <p className="text-gray-500 text-sm">Tu pedido ha sido confirmado. Recibirás un email con el resumen.</p>
          <button
            onClick={() => router.replace(window.location.pathname)}
            className="cursor-pointer w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  if (checkoutOpen) {
    return (
      <CheckoutView
        currency={currency}
        teamName={team.name}
        teamId={team.id}
        onBack={() => setCheckoutOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      
      {/* Header con banner de fondo y logo centrado */}
      <header className="w-full mx-auto bg-white border-b shadow-sm">
        <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center px-0 pb-4">
          
          {/* Banner de fondo */}
          {team.bannerUrl && (
            <div className="w-full h-40 md:h-48 relative flex items-end justify-center overflow-hidden rounded-b-2xl" style={{ background: '#f9fafb' }}>
              <img
                src={team.bannerUrl}
                alt={team.name + ' banner'}
                className="w-full h-full object-cover object-center"
                style={{ zIndex: 1 }}
              />
              {/* Sombra para legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
            </div>
          )}
          
          {/* Espaciador para el logo flotante */}
          <div className="" />

            {/* Datos del restaurante */}
            <div className="w-full mt-3">
              
              <div className="relative flex flex-row text-left">

                {/* Logo sobre el banner */}
                {team.profilePictureUrl && (
                  <div className="flex flex-col items-center">
                    <div className="bg-white me-5 rounded-2xl shadow-lg p-2" style={{ width: 140, height: 140 }}>
                      <img
                        src={team.profilePictureUrl}
                        alt={team.name}
                        className="w-32 h-32 object-contain rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="w-full flex flex-row items-center justify-between mb-auto pt-3">
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-extrabold text-gray-900 text-left w-full">
                      {team.name}
                    </h1>
                    {team.description && (
                      <p className="mt-2 text-sm text-gray-700 text-left max-w-xl">{team.description}</p>
                    )}
                    <div className="w-full flex flex-row items-start">
                      {/* Open Hours */}
                      <div className="">
                        <h3 className='mt-2 text-sm'>
                          Horarios de atencion: Hoy 11:00 AM - 10:00 PM Abierto
                        </h3>
                        
                        {/* Links de contacto/redes */}
                        <div className="flex flex-wrap gap-4 mt-3">
                          
                          {team.whatsappPhone && (
                            <a href={`https://wa.me/${team.whatsappPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm gap-1">
                              <span role="img" aria-label="WhatsApp">💬</span> WhatsApp
                            </a>
                          )}
                          {team.contactEmail && (
                            <a href={`mailto:${team.contactEmail}`} className="text-gray-700 hover:underline text-sm gap-1">
                              <span role="img" aria-label="Email">✉️</span> Email
                            </a>
                          )}
                          {team.callPhone && (
                            <a href={`tel:${team.callPhone}`} className="text-gray-700 hover:underline text-sm gap-1">
                              <span role="img" aria-label="Llamar">📞</span> Llamar
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Our Social Media */}
                      <div className="">
                        <h3 className='mt-2 text-sm'>
                          Follow us:
                        </h3>
                        {team.facebookUrl && (
                          <a href={team.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <span role="img" aria-label="Facebook">📘</span> Facebook
                          </a>
                        )}
                        {team.instagramUrl && (
                          <a href={team.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline flex items-center gap-1">
                            <span role="img" aria-label="Instagram">📸</span> Instagram
                          </a>
                        )}
                      </div>

                      {/* Our Location */}
                      {team.address && (
                        <div className="mt-3">
                          <h3 className='mt-2'>
                            Location:
                          </h3>
                          <p className="text-sm text-gray-500">{team.address}</p>
                        </div>
                      )}


                    </div>
                  </div>
                  <div className="mb-auto">
                    <CartIconButton onClick={() => setCartOpen(true)} />
                  </div>
                </div>

                
              </div>
            </div>
          </div>

          {/* Category tabs */}
          {categories.length > 1 && (
            <div className="max-w-6xl mx-auto px-4 overflow-x-auto sticky top-[calc(100px+1.5rem)] z-10 bg-white">
              <div className="flex pb-0 min-w-max">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === cat.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-28">
        {/* Policy warnings */}
        {policies && <PolicyBadges policies={policies} />}

        {/* Empty state */}
        {categories.length === 0 && (
          <p className="text-center text-gray-400 py-16">El menú está vacío por el momento.</p>
        )}

        {/* Category section */}
        {currentCategory && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">{currentCategory.name}</h2>
              {currentCategory.description && (
                <p className="text-sm text-gray-500 mt-1">{currentCategory.description}</p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm divide-y px-4">
              {currentCategory.products.map(product => (
                <ProductCard key={product.id} product={product} onSelect={setSelectedProduct} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating cart button */}
      <FloatingCartButton currency={currency} onClick={() => setCartOpen(true)} />

      {/* Add-to-cart modal */}
      {selectedProduct && (
        <AddToCartModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          currency={currency}
          onClose={() => setCartOpen(false)}
          onCheckout={() => setCheckoutOpen(true)}
        />
      )}

      {/* Footer público con dirección */}
      <footer className="mt-auto bg-white border-t py-8 px-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-3">
          {team.address && (
            <p className="text-sm text-gray-500 flex items-center gap-1 justify-center">
              <span role="img" aria-label="Dirección">📍</span> {team.address}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function PublicMenu(props: PublicMenuProps) {
  return (
    <CartProvider>
      <MenuContent {...props} />
    </CartProvider>
  );
}
