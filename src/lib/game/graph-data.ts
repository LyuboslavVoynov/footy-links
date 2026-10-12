import { getGraphDataset } from "@/lib/db/queries";
import { buildFootballGraph } from "@/lib/game/graph";

export async function getFootballGraph() {
  return buildFootballGraph(await getGraphDataset());
}
