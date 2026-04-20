import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      
      {/* Hero */}
      <section className="px-6 md:px-10 lg:px-16 py-20 md:py-28">
        <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 text-xs md:text-sm px-3 py-1 mb-4">
              Menú digital para restaurantes
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900">
              Adquiere tu menú online y empieza a vender hoy
            </h1>
            <p className="mt-4 text-neutral-600 text-lg">
              Un único pago para configurar tu restaurante y una membresía
              mensual para mantenimiento, mejoras y soporte. Simple, moderno y
              listo para tus clientes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-md bg-black px-5 text-white shadow-sm hover:bg-neutral-800 transition"
              >
                Comenzar ahora
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 text-neutral-900 hover:bg-neutral-50 transition"
              >
                Ver precios
              </Link>
            </div>
            <div className="mt-6 text-sm text-neutral-500">
              Mantendremos pricing y signup para quienes ya tienen perfil y
              acceso al panel de administración.
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video w-full rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-black/90 text-white grid place-items-center">
                    <span className="text-xl">🍽️</span>
                  </div>
                  <p className="text-neutral-700">Vista previa del menú digital</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Configuración única",
                desc: "Nos encargamos de crear tu menú online con tu marca y platos.",
              },
              {
                title: "Mantenimiento mensual",
                desc: "Actualizaciones, soporte y mejoras continuas para tu negocio.",
              },
              {
                title: "Experiencia moderna",
                desc: "Rápido, adaptable a móviles y listo para compartir por QR.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-medium text-neutral-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-neutral-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-10 lg:px-16 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
            ¿Cómo funciona?
          </h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Regístrate",
                desc: "Crea tu cuenta y dinos sobre tu restaurante.",
              },
              {
                step: "2",
                title: "Configuración",
                desc: "Realizamos el setup con tu identidad y platos.",
              },
              {
                step: "3",
                title: "Lanza y crece",
                desc: "Comparte tu menú por QR y actualiza cuando quieras.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="h-8 w-8 rounded-full bg-black text-white grid place-items-center">
                  {s.step}
                </div>
                <h3 className="mt-3 text-lg font-medium text-neutral-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-neutral-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing summary CTA */}
      <section className="px-6 md:px-10 lg:px-16 py-16">
        <div className="mx-auto max-w-4xl\">
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-8 text-center">
            Modelo de precios simple
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: "🔧",
                title: "Configuración inicial",
                price: "Precio único",
                desc: "Incluye setup completo de tu restaurante y menú digital",
              },
              {
                icon: "✨",
                title: "Membresía mensual",
                price: "Bajo costo",
                desc: "Mantenimiento, actualizaciones y soporte continuo",
              },
              {
                icon: "🎯",
                title: "Sin sorpresas",
                price: "Transparencia",
                desc: "Conoce exactamente qué pagarás cada mes",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-neutral-900 mb-1">{item.title}</h3>
                <p className="text-sm text-orange-600 font-medium mb-2">{item.price}</p>
                <p className="text-sm text-neutral-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  ¿Cuánto cuesta?
                </h3>
                <ul className="space-y-3 text-neutral-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">→</span>
                    <span><strong>Configuración:</strong> Precio único para setup inicial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">→</span>
                    <span><strong>Suscripción:</strong> Membresía mensual desde el primer mes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">→</span>
                    <span><strong>Prueba:</strong> 14 días gratis de suscripción</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-black px-6 text-white shadow-sm hover:bg-neutral-800 transition font-medium"
                >
                  Ver plan y precios
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-6 text-neutral-900 hover:bg-neutral-50 transition font-medium"
                >
                  Comenzar ahora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-10 lg:px-16 py-10 border-t border-neutral-200 text-sm text-neutral-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} MenuHub — Menú online para restaurantes
          </p>
          <div className="flex gap-4">
            <Link href="/sign-in" className="hover:text-neutral-700">
              Acceder
            </Link>
            <Link href="/pricing" className="hover:text-neutral-700">
              Precios
            </Link>
          </div>
        </div>
      </footer>
      
    </main>
  );
}
