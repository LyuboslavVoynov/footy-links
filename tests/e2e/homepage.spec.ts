import { expect, test } from "@playwright/test";

test("homepage loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "FOOTBALL LINKS" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Game" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("a known challenge can be completed", async ({ page }) => {
  const entities: Record<string, { entity: object; connections: object[] }> = {
    "/api/game/entity/player/cristiano-ronaldo": { entity: { id: "player:cristiano-ronaldo", type: "player", slug: "cristiano-ronaldo", name: "Cristiano Ronaldo", nationality: "Portugal" }, connections: [{ id: "club:manchester-united", type: "club", slug: "manchester-united", name: "Manchester United", country: "England" }] },
    "/api/game/entity/club/manchester-united": { entity: { id: "club:manchester-united", type: "club", slug: "manchester-united", name: "Manchester United", country: "England" }, connections: [{ id: "player:wayne-rooney", type: "player", slug: "wayne-rooney", name: "Wayne Rooney", nationality: "England" }] },
    "/api/game/entity/player/wayne-rooney": { entity: { id: "player:wayne-rooney", type: "player", slug: "wayne-rooney", name: "Wayne Rooney", nationality: "England" }, connections: [{ id: "club:everton", type: "club", slug: "everton", name: "Everton", country: "England" }] },
    "/api/game/entity/club/everton": { entity: { id: "club:everton", type: "club", slug: "everton", name: "Everton", country: "England" }, connections: [{ id: "player:mikel-arteta", type: "player", slug: "mikel-arteta", name: "Mikel Arteta", nationality: "Spain" }] },
    "/api/game/entity/player/mikel-arteta": { entity: { id: "player:mikel-arteta", type: "player", slug: "mikel-arteta", name: "Mikel Arteta", nationality: "Spain" }, connections: [{ id: "club:arsenal", type: "club", slug: "arsenal", name: "Arsenal", country: "England" }] },
    "/api/game/entity/club/arsenal": { entity: { id: "club:arsenal", type: "club", slug: "arsenal", name: "Arsenal", country: "England" }, connections: [{ id: "player:bukayo-saka", type: "player", slug: "bukayo-saka", name: "Bukayo Saka", nationality: "England" }] },
  };
  await page.route("**/api/game/challenge", (route) => route.fulfill({ json: { startPlayer: { id: "player:cristiano-ronaldo", type: "player", name: "Cristiano Ronaldo" }, targetPlayer: { id: "player:bukayo-saka", type: "player", name: "Bukayo Saka" } } }));
  await page.route("**/api/game/entity/**", (route) => route.fulfill({ json: entities[new URL(route.request().url()).pathname] }));
  await page.route("**/api/game/result", (route) => route.fulfill({ json: { optimalClicks: 6, optimalPath: [{ id: "player:cristiano-ronaldo", type: "player", name: "Cristiano Ronaldo" }, { id: "club:manchester-united", type: "club", name: "Manchester United" }, { id: "player:wayne-rooney", type: "player", name: "Wayne Rooney" }, { id: "club:everton", type: "club", name: "Everton" }, { id: "player:mikel-arteta", type: "player", name: "Mikel Arteta" }, { id: "club:arsenal", type: "club", name: "Arsenal" }, { id: "player:bukayo-saka", type: "player", name: "Bukayo Saka" }] } }));
  await page.goto("/game");
  await page.getByRole("button", { name: "I’m ready" }).click();
  for (const name of ["Manchester United", "Wayne Rooney", "Everton", "Mikel Arteta", "Arsenal", "Bukayo Saka"]) await page.getByRole("button", { name }).click();
  await expect(page.getByText("Round complete")).toBeVisible();
  await expect(page.getByText("6 clicks", { exact: true })).toBeVisible();
  await expect(page.getByText("You found the shortest route")).toBeVisible();
  await page.getByRole("button", { name: "Play Again" }).click();
  await expect(page.getByRole("heading", { name: "Cristiano Ronaldo" })).toBeVisible();
});
