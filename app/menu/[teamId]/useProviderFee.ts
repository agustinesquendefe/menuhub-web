import useSWR from 'swr';

export function useProviderFee(country: string | undefined) {
  const { data, isLoading } = useSWR(
    country ? `/api/payment-providers/by-country?country=${encodeURIComponent(country)}` : null,
    (url) => fetch(url).then(r => r.json())
  );
  if (!data || !Array.isArray(data) || data.length === 0) return { feePercent: 0, feeFixed: 0, isLoading };
  return {
    feePercent: parseFloat(data[0].feePercent),
    feeFixed: parseFloat(data[0].feeFixed),
    isLoading
  };
}
