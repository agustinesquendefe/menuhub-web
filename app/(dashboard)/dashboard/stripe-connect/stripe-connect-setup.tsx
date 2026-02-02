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
      {/* Status Card */}
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
                ? 'Cuenta Conectada'
                : status === 'loading'
                ? 'Cargando...'
                : 'Configuración Pendiente'}
            </h3>
            <p className="text-gray-600 mt-1">
              {status === 'configured'
                ? 'Tu cuenta de Stripe Connect está configurada y lista para recibir pagos de tus clientes.'
                : status === 'loading'
                ? 'Verificando el estado de tu cuenta...'
                : 'Completa la configuración de tu cuenta de Stripe Connect para comenzar a recibir pagos.'}
            </p>
          </div>
        </div>
      </Card>

      {/* What is Stripe Connect */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">¿Qué es Stripe Connect?</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Recibe pagos directamente en tu cuenta bancaria por cada orden</span>
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Tus clientes pagan a través de métodos seguros</span>
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Acceso a reportes detallados de transacciones</span>
          </li>
          <li className="flex gap-3">
            <span className="text-orange-500 font-bold">•</span>
            <span>Procesamiento rápido y seguro con Stripe</span>
          </li>
        </ul>
      </Card>

      {/* Setup Instructions */}
      {status !== 'configured' && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-lg mb-4">Pasos para Configurar</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                1
              </span>
              <span>Haz clic en el botón "Configurar Stripe Connect" abajo</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                2
              </span>
              <span>Completa tu información personal y bancaria</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                3
              </span>
              <span>Verifica tu identidad si es necesario</span>
            </li>
            <li className="flex gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
                4
              </span>
              <span>¡Listo! Comienza a recibir pagos</span>
            </li>
          </ol>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      {/* Setup Button */}
      {status !== 'configured' && (
        <Button
          onClick={handleSetupConnect}
          disabled={loading || status === 'loading'}
          size="lg"
          className="w-full"
        >
          {loading ? 'Redirigiendo...' : 'Configurar Stripe Connect'}
        </Button>
      )}

      {/* Refresh Button */}
      {status === 'not-configured' && (
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="w-full mt-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {refreshing ? 'Actualizando...' : 'Actualizar Estado'}
        </Button>
      )}

      {/* Account Info */}
      {status === 'configured' && accountId && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-lg mb-2">ID de Cuenta</h3>
          <code className="text-sm bg-white p-3 rounded border border-green-300 break-all block">
            {accountId}
          </code>
          <p className="text-sm text-gray-600 mt-4">
            Tu plataforma ahora puede procesar pagos de tus clientes. Los fondos se transferirán a tu cuenta bancaria según tu configuración.
          </p>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {refreshing ? 'Actualizando...' : 'Actualizar Configuración'}
          </Button>
        </Card>
      )}
    </div>
  );
}
