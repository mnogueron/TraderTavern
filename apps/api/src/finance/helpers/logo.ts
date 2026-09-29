const GOOGLE_FAVICON_HOSTNAME = 'www.google.com';
const GOOGLE_FAVICON_PATHNAME = '/s2/favicons';

// Legacy logoUrl values point at Google's favicon endpoint (no API key, but
// loaded live on every ticker render). We migrate those to a one-time
// base64-embedded icon the first time the ticker is fetched, so subsequent
// renders never hit an external service.
export function isGoogleFaviconUrl(logoUrl: string): boolean {
  try {
    const url = new URL(logoUrl);
    return (
      url.hostname === GOOGLE_FAVICON_HOSTNAME &&
      url.pathname === GOOGLE_FAVICON_PATHNAME
    );
  } catch {
    return false;
  }
}

function domainFromGoogleFaviconUrl(logoUrl: string): string | null {
  return new URL(logoUrl).searchParams.get('domain');
}

export async function fetchBase64Logo(
  logoUrl: string,
): Promise<string | null> {
  const domain = domainFromGoogleFaviconUrl(logoUrl);
  if (!domain) {
    return null;
  }

  const response = await fetch(
    `https://logos-api.apistemic.com/domain:${domain}`,
  );
  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}
