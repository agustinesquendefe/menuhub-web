import useSWR from 'swr';

export default function CompanyLogoHeader() {
  const { data: user } = useSWR('/api/user', (url) => fetch(url).then(r => r.json()));
  const { data: team } = useSWR(user && user.role !== 'superadmin' ? '/api/team' : null, (url) => fetch(url).then(r => r.json()));
  const { data: company } = useSWR('/api/company', (url) => fetch(url).then(r => r.json()));

  if (user && user.role !== 'superadmin' && team?.profilePictureUrl) {
    return (
      <img src={team.profilePictureUrl} alt={team.name || 'Logo Team'} className="h-14 w-14" />
    );
  }
  if (company?.logoUrl) {
    return (
      <img src={company.logoUrl} alt={company.name || 'Logo'} className="h-14 w-14" />
    );
  }
  return (
    <span className="ml-2 text-xl font-semibold text-gray-900">
      {company?.name || 'Compañía'}
    </span>
  );
}
