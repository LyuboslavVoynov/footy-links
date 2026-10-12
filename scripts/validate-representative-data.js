const source = require("../prisma/data/representative-data");
const clubUniverse = new Set(require("../prisma/data/club-universe.json"));

const edges = source.flatMap((player) => player.senior_careers
  .filter((career) => clubUniverse.has(career.club))
  .map((career) => `${player.full_name}|${career.club}`));
const connectedPlayers = new Set(edges.map((edge) => edge.split("|")[0]));
const duplicateEdges = edges.length - new Set(edges).size;

console.log(`Players: ${source.length}`);
console.log(`Clubs: ${clubUniverse.size}`);
console.log(`Connections: ${edges.length}`);
console.log(`Players with no included clubs: ${source.length - connectedPlayers.size}`);
console.log(`Duplicate relationships: ${duplicateEdges}`);

if (source.length < 100 || clubUniverse.size < 30 || clubUniverse.size > 60 || duplicateEdges > 0 || connectedPlayers.size !== source.length) {
  process.exitCode = 1;
}
