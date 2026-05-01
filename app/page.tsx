import Link from 'next/link';
import { Mail, Phone, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { company } from '@/lib/db/schema';
import { publicServiceCheckoutAction } from './public-checkout-actions';

function getCompanyAddress(data: typeof company.$inferSelect | null) {
  if (!data) return '';
  return [data.address, data.city, data.state, data.zipcode, data.country]
    .filter(Boolean)
    .join(', ');
}

function getWhatsAppHref(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

export default async function Home() {
  const [companyInfo] = await db.select().from(company).limit(1);
  const name = companyInfo?.name || 'MenuHub';
  const description =
    companyInfo?.description ||
    'We build digital menus for restaurants that want to sell, charge, and operate with a simple experience for their customers.';
  const address = getCompanyAddress(companyInfo ?? null);
  const whatsappHref = getWhatsAppHref(companyInfo?.whatsappPhone);

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {companyInfo?.logoUrl ? (
              <img
                src={companyInfo.logoUrl}
                alt={name}
                className="h-11 w-11 object-contain"
              />
            ) : (
              <div className="h-11 w-11 rounded-lg bg-orange-500 text-white font-bold grid place-items-center">
                {name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold truncate">{name}</p>
              <p className="text-xs text-gray-500 truncate">Digital menu service</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-950">
              Sign in
            </Link>
            {/* <Link
              href="/pricing"
              className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Ver precios
            </Link> */}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            {companyInfo?.logoUrl && (
              <img
                src={companyInfo.logoUrl}
                alt={name}
                className="mb-6 h-20 w-20 object-contain"
              />
            )}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-950">
              Get your digital menu service
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-600 leading-8">
              {description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <form action={publicServiceCheckoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600 cursor-pointer"
                >
                  Start service
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-md border border-gray-300 px-6 font-semibold text-gray-950 hover:bg-gray-50"
              >
                View plan and pricing
              </Link>
            </div>
          </div>

          <div className="rounded-xl border bg-gray-50 p-5 md:p-7">
            <h2 className="text-xl font-bold">Company information</h2>
            <div className="mt-5 space-y-3 text-sm text-gray-700">
              {companyInfo?.contactEmail && (
                <a href={`mailto:${companyInfo.contactEmail}`} className="flex items-center gap-3 hover:text-orange-600">
                  <Mail className="h-4 w-4 text-orange-500" />
                  {companyInfo.contactEmail}
                </a>
              )}
              {companyInfo?.contactPhone && (
                <a href={`tel:${companyInfo.contactPhone}`} className="flex items-center gap-3 hover:text-orange-600">
                  <Phone className="h-4 w-4 text-orange-500" />
                  {companyInfo.contactPhone}
                </a>
              )}
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-orange-600">
                  <MessageCircle className="h-4 w-4 text-orange-500" />
                  WhatsApp
                </a>
              )}
              {address && <p className="pt-2 text-gray-500">{address}</p>}
            </div>

            <div className="mt-7 border-t pt-6 space-y-4">
              {[
                'Public menu to share by QR or link',
                'Cart and checkout to receive orders',
                'Dashboard to manage products, orders, and statuses',
              ].map(item => (
                <div key={item} className="flex gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-gray-50">
        <div className="mx-auto max-w-6xl px-5 py-10 grid gap-5 md:grid-cols-3">
          {[
            ['Setup', 'We prepare your menu with your business information, pricing, and brand identity.'],
            ['Operations', 'Your customers browse the menu, add products, and complete the order.'],
            ['Tracking', 'You manage orders, payments, statuses, and notifications from the dashboard.'],
          ].map(([title, copy]) => (
            <div key={title}>
              <h3 className="font-bold text-gray-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} {name}. Digital menu service.</p>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-gray-950">Pricing</Link>
          <Link href="/sign-in" className="hover:text-gray-950">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
