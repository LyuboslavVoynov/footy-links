const source = require("../prisma/data/representative-data");

const edges = source.flatMap((player) => player.senior_careers
  .map((career) => `${player.full_name}|${career.club}`));
const connectedPlayers = new Set(edges.map((edge) => edge.split("|")[0]));
const duplicateEdges = edges.length - new Set(edges).size;
const clubs = new Set(source.flatMap((player) => player.senior_careers.map((career) => career.club)));

console.log(`Players: ${source.length}`);
console.log(`Clubs: ${clubs.size}`);
console.log(`Connections: ${edges.length}`);
console.log(`Players with no included clubs: ${source.length - connectedPlayers.size}`);
console.log(`Duplicate relationships: ${duplicateEdges}`);

if (source.length < 100 || clubs.size < 30 || duplicateEdges > 0 || connectedPlayers.size !== source.length) {
  process.exitCode = 1;
}
