import { representativeSource } from "@/lib/data/sources/representative";
import { validateDataset } from "@/lib/data/validate";

const report = validateDataset(representativeSource.load());
console.log(`Players: ${report.players}`);
console.log(`Clubs: ${report.clubs}`);
console.log(`Connections: ${report.connections}`);
console.log(`Challenge eligible players: ${report.challengeEligiblePlayers}`);
console.log(`Orphan players: ${report.orphanPlayers}`);
console.log(`Orphan clubs: ${report.orphanClubs}`);
console.log(`Broken relationships: ${report.brokenRelationships}`);
console.log(`Likely duplicate players: ${report.likelyDuplicatePlayers}`);
console.log(`Likely duplicate clubs: ${report.likelyDuplicateClubs}`);
console.log(`Disconnected eligible players: ${report.disconnectedEligiblePlayers}`);
console.log(`Stress challenges: ${report.stressChallenges}`);
console.log(`Invalid challenges: ${report.invalidChallenges}`);
console.log(`Data limitation: ${representativeSource.limitations}`);

if (report.orphanPlayers || report.orphanClubs || report.brokenRelationships || report.likelyDuplicatePlayers || report.likelyDuplicateClubs || report.disconnectedEligiblePlayers || report.invalidChallenges) process.exitCode = 1;
