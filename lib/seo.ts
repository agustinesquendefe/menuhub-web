import type { Metadata } from 'next';

const SITE_NAME = 'MenuHub';
const DEFAULT_TITLE = 'Digital menus for restaurants | MenuHub';
const DEFAULT_DESCRIPTION =
  'MenuHub helps restaurants publish fast, mobile-friendly digital menus with online ordering and a simple management dashboard.';

type TeamSeoInput = {
  name: string;
  username?: string | null;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  profilePictureUrl?: string | null;
};

export function getBaseUrl() {
  return process.env.BASE_URL || 'http://localhost:3000';
}

export function getMetadataBase() {
  return new URL(getBaseUrl());
}

export function getSiteMetadata(): Metadata {
  return {
    metadataBase: getMetadataBase(),
    applicationName: SITE_NAME,
    title: {
      default: DEFAULT_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [
      'digital menu',
      'restaurant menu',
      'qr menu',
      'online ordering',
      'restaurant ordering system',
      'MenuHub',
    ],
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: '/',
    },
    twitter: {
      card: 'summary',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    },
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      shortcut: ['/icon.svg'],
    },
  };
}

function buildTeamDescription(team: TeamSeoInput) {
  const location = [team.city, team.state, team.country].filter(Boolean).join(', ');
  const base = team.description?.trim()
    ? team.description.trim()
    : `${team.name} menu available online with MenuHub.`;

  return location ? `${base} View the menu for ${team.name} in ${location}.` : base;
}

export function getTeamMenuMetadata(team: TeamSeoInput): Metadata {
  const canonicalPath = team.username ? `/${team.username}` : '/';
  const title = `${team.name} Menu`;
  const description = buildTeamDescription(team);
  const images = team.profilePictureUrl ? [{ url: team.profilePictureUrl }] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalPath,
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images?.map(image => image.url),
    },
  };
}

export function getSecondaryTeamMenuMetadata(team: TeamSeoInput): Metadata {
  return {
    ...getTeamMenuMetadata(team),
    robots: {
      index: false,
      follow: true,
    },
  };
}