export function getLocalAssetUrl(assetPath: string): string {
  const base = import.meta.env?.BASE_URL ?? './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${normalizedBase}${cleanPath}`;
}
