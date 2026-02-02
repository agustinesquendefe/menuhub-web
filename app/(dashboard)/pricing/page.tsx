import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { stripe } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  // Get prices from environment variables
  const subscriptionPriceId = process.env.PRICE_ID;
  const setupPriceId = process.env.SETUP_PRICE_ID;

  if (!subscriptionPriceId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-red-600 font-bold mb-4">Error: Precios no configurados</p>
          <p className="text-gray-600">Variable de entorno requerida: PRICE_ID</p>
        </div>
      </main>
    );
  }

  try {
    // Fetch subscription price details from Stripe
    const subscriptionPrice = await stripe.prices.retrieve(subscriptionPriceId, {
      expand: ['product'],
    });

    if (!subscriptionPrice) {
      throw new Error('No se pudo recuperar el precio de suscripción de Stripe');
    }

    // Fetch setup price if available
    let setupPrice = null;
    if (setupPriceId) {
      setupPrice = await stripe.prices.retrieve(setupPriceId);
    }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Menú Digital para tu Restaurante</h1>
          <p className="text-lg text-gray-600">Transforma tu menú en una experiencia digital</p>
        </div>

        {/* Single Plan Card */}
        <div className="max-w-2xl mx-auto">
          <PricingCard
            subscriptionPrice={subscriptionPrice.unit_amount || 0}
            setupPrice={setupPrice?.unit_amount || 0}
            interval={subscriptionPrice.recurring?.interval || 'month'}
            trialDays={subscriptionPrice.recurring?.trial_period_days || 14}
            features={[
              'Menú digital personalizado',
              'Administración completa de platos y precios',
              'Código QR para compartir',
              'Acceso 24/7 al panel de control',
              'Actualizaciones automáticas',
              'Soporte por email',
              'Seguridad y respaldos incluidos',
            ]}
            subscriptionPriceId={subscriptionPriceId}
            setupPriceId={setupPriceId}
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {[
              {
                q: "¿Cuál es el costo total?",
                a: `$${(setupPrice?.unit_amount || 0) / 100} de configuración inicial + $${(subscriptionPrice.unit_amount || 0) / 100}/mes`
              },
              {
                q: "¿Hay período de prueba?",
                a: "Sí, tienes 14 días gratis de suscripción para probar toda la plataforma."
              },
              {
                q: "¿Puedo cancelar en cualquier momento?",
                a: "Sí, puedes cancelar tu suscripción mensual cuando lo desees."
              },
              {
                q: "¿Qué incluye el plan?",
                a: "Menú digital personalizado, administración de platos, códigos QR, panel de control, actualizaciones automáticas y soporte por email."
              },
            ].map((item, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
  } catch (error) {
    console.error('Error fetching price from Stripe:', error);
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-red-600 font-bold mb-4">Error al cargar el precio</p>
          <p className="text-gray-600 mb-4">No se pudo recuperar el precio desde Stripe.</p>
          <p className="text-sm text-gray-500">
            Verifica que PRICE_ID esté correctamente configurado en las variables de entorno.
          </p>
          <pre className="mt-4 bg-red-50 p-4 rounded text-left text-sm overflow-auto">
            {String(error)}
          </pre>
        </div>
      </main>
    );
  }
}


function PricingCard({
  subscriptionPrice,
  setupPrice,
  interval,
  trialDays,
  features,
  subscriptionPriceId,
  setupPriceId,
}: {
  subscriptionPrice: number;
  setupPrice: number;
  interval: string;
  trialDays: number;
  features: string[];
  subscriptionPriceId: string;
  setupPriceId?: string;
}) {
  const monthlyPrice = subscriptionPrice / 100;
  const setupCost = setupPrice / 100;

  return (
    <div className="relative rounded-lg border border-orange-500 bg-white shadow-lg ring-2 ring-orange-100 p-8">
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Plan Completo
        </span>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2 mt-4">Menú Digital</h2>
      <p className="text-sm text-gray-600 mb-8">14 días de prueba gratis</p>
      
      {/* Pricing */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="space-y-3">
          {setupCost > 0 && (
            <div className="flex justify-between text-base">
              <span className="text-gray-700">Configuración inicial:</span>
              <span className="font-semibold text-gray-900">${setupCost.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base">
            <span className="text-gray-700">Suscripción mensual:</span>
            <span className="font-semibold text-gray-900">${monthlyPrice.toFixed(2)}</span>
          </div>
          {setupCost > 0 && (
            <p className="text-xs text-gray-500">
              El cargo de configuración se cobra solo una vez en el primer mes
            </p>
          )}
        </div>
      </div>
      
      <ul className="space-y-3 mb-10">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      
      <form action={checkoutAction} className="w-full">
        <input type="hidden" name="priceId" value={subscriptionPriceId} />
        {setupPriceId && <input type="hidden" name="setupPriceId" value={setupPriceId} />}
        <SubmitButton />
      </form>
    </div>
  );
}
