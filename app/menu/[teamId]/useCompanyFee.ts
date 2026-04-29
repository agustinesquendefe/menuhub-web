import useSWR from 'swr';

export function useCompanyFee(
  country: string | undefined,
  state?: string,
  companyId?: number | null,
  teamId?: number
) {
  const params = country || companyId || teamId
    ? new URLSearchParams({
        ...(country ? { country } : {}),
        ...(state ? { state } : {}),
        ...(companyId ? { companyId: String(companyId) } : {}),
        ...(teamId ? { teamId: String(teamId) } : {}),
      })
    : null;
  const { data, isLoading } = useSWR(
    params ? `/api/company-fees/by-location?${params.toString()}` : null,
    (url) => fetch(url).then(r => r.json())
  );
  if (!data) return { feePercent: 0, feeFixed: 0, isLoading };
  return {
    feePercent: Number(data.feePercent) || 0,
    feeFixed: Number(data.feeFixed) || 0,
    isLoading
  };
}
