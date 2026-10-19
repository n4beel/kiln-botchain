export interface KilnMetadata {
  name: string;
  description: string;
  image: string;
}

export function parseTokenURI(dataUri: string): KilnMetadata | null {
  try {
    if (!dataUri || !dataUri.startsWith("data:application/json;base64,")) return null;
    const b64 = dataUri.slice("data:application/json;base64,".length);
    if (typeof window !== "undefined") {
      const json = atob(b64);
      return JSON.parse(json);
    } else {
      const json = Buffer.from(b64, "base64").toString("utf-8");
      return JSON.parse(json);
    }
  } catch {
    return null;
  }
}

export function svgFromTokenURI(dataUri: string): string | null {
  const parsed = parseTokenURI(dataUri);
  if (!parsed?.image) return null;
  return parsed.image; // Already data:image/svg+xml;base64,... which can be used directly as img src
}
