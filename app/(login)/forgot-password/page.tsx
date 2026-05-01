import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { company } from '@/lib/db/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default async function ForgotPasswordPage() {
  const [companyInfo] = await db.select().from(company).limit(1);
  const companyName = companyInfo?.name || 'MenuHub';

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {companyInfo?.logoUrl ? (
            <img
              src={companyInfo.logoUrl}
              alt={companyName}
              className="h-16 w-16 object-contain"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-lg bg-orange-500 text-2xl font-bold text-white">
              {companyName.slice(0, 1)}
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6">
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={50}
                className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Send reset link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
