'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface StripeConnectSetupProps {
  teamId: number;
  connectAccountId: string | null;
  teamName: string;
}

export function StripeConnectSetup({
  teamId,
  connectAccountId,
  teamName,
}: StripeConnectSetupProps) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<'loading' | 'not-configured' | 'configured'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(connectAccountId);

  useEffect(() => {
    if (accountId) {
      setStatus('configured');
    } else {
      setStatus('not-configured');
    }
  }, [accountId]);

  const handleSetupConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup Stripe Connect');
      }

      // Update state with new account ID if created
      if (data.accountId) {
        setAccountId(data.accountId);
      }

      // Redirect to Stripe Connect setup
      window.location.href = data.accountLink;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect');
      const data = await response.json();

      if (response.ok && data.accountId) {
        setAccountId(data.accountId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-l-4 border-l-orange-500">
        <div className="flex items-start gap-4">
          {status === 'configured' ? (
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          ) : status === 'loading' ? (
            <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1 animate-spin" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          )}
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {status === 'configured'
                ? 'Connected account'
                : status === 'loading'
                ? 'Loading...'
                : 'Setup pending'}
            </h3>
            <p className="text-gray-600 mt-1">
              {status === 'configured'
                ? 'Your Stripe Connect account is configured and ready to receive customer payments.'
                : status === 'loading'
                ? 'Checking your account status...'
                : 'Complete your Stripe Connect account setup to start receiving payments.'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">What is Stripe Connect?</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Receive payments directly into your bank account for each order</span>
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Your customers pay through secure methods</span>
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Access detailed transaction reports</span>
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Fast and secure processing with Stripe</span>
          </li>
        </ul>
      </Card>

      {status !== 'configured' && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-lg mb-4">Setup steps</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                1
              </span>
              <span>Click the "Set up Stripe Connect" button below</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                2
              </span>
              <span>Complete your personal and banking information</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                3
              </span>
              <span>Verify your identity if needed</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                4
              </span>
              <span>Done. Start receiving payments</span>
            </li>
          </ol>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      {status !== 'configured' && (
        <Button
          onClick={handleSetupConnect}
          disabled={loading || status === 'loading'}
          size="lg"
          className="w-full"
        >
          {loading ? 'Redirecting...' : 'Set up Stripe Connect'}
        </Button>
      )}

      {status === 'not-configured' && (
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="w-full mt-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {refreshing ? 'Refreshing...' : 'Refresh status'}
        </Button>
      )}

      {status === 'configured' && accountId && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-lg mb-2">Account ID</h3>
          <code className="text-sm bg-white p-3 rounded border border-green-300 break-all block">
            {accountId}
          </code>
          <p className="text-sm text-gray-600 mt-4">
            Your platform can now process customer payments. Funds will be transferred to your bank account according to your setup.
          </p>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh setup'}
          </Button>
        </Card>
      )}
    </div>
  );
}
