export function commonsFileUrl(fileName: string, width = 320) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
}

export type WikidataImageClaims = { claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: string } } }>> };

export function imageFileFromClaims(entity: WikidataImageClaims, type: "player" | "club") {
  const properties = type === "club" ? ["P154", "P18"] : ["P18"];
  for (const property of properties) {
    const value = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}
