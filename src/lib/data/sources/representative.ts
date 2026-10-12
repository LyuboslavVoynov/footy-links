import { createRequire } from "node:module";
import { normalizeProviderData, type ProviderPlayer } from "@/lib/data/normalize";

const loadModule = createRequire(import.meta.url);
const rawRepresentativeData = loadModule("../../../../prisma/data/representative-data.js") as ProviderPlayer[];

export const representativeSource = {
  name: "representative-fixture",
  limitations: "Hand-curated development fixture. It is not a complete record of senior competitive appearances and must be replaced or independently verified before production use.",
  load: () => normalizeProviderData(rawRepresentativeData),
};
