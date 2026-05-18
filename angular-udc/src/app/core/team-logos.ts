const TEAM_LOGOS: Record<string, string> = {
  'arona voley': 'Arona Voley.png',
  'cb laguna': 'CB Laguna.png',
  'cd teide': 'CD Teide.png',
  'costa adeje handball': 'Costa Adeje Handball.png',
  'gran canaria b': 'Gran Canaria B.png',
  'lanzarote arena': 'Lanzarote Arena.png',
  'teide vc': 'TeideVC.png',
  'telde vc': 'TeideVC.png',
  'udc norte': 'UDC Norte.png',
  'udc sur': 'UDC Sur.png',
  'union la palma': 'Unión La Palma.png',
};

const FALLBACK_LOGOS = [
  'logo-equipo-1.png',
  'logo-equipo-2.png',
  'logo-equipo-3.png',
  'logo-equipo-4.png',
  'logo-equipo-5.png',
  'logo-equipo-6.png',
];

export function teamLogoUrl(teamName?: string | null, fallbackIndex = 0): string {
  const key = normalizeTeamName(teamName);
  const fileName = TEAM_LOGOS[key] ?? FALLBACK_LOGOS[Math.abs(fallbackIndex) % FALLBACK_LOGOS.length];

  return `/assets/images/${encodeURIComponent(fileName)}`;
}

function normalizeTeamName(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}
