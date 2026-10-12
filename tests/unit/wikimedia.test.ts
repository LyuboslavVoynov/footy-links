import { describe, expect, it } from "vitest";
import { commonsFileUrl, imageFileFromClaims } from "@/lib/data/sources/wikimedia";

describe("Wikimedia image helpers", () => {
  it("uses logos for clubs and portraits for players", () => {
    const entity = { claims: { P18: [{ mainsnak: { datavalue: { value: "Portrait.jpg" } } }], P154: [{ mainsnak: { datavalue: { value: "Badge.svg" } } }] } };
    expect(imageFileFromClaims(entity, "player")).toBe("Portrait.jpg");
    expect(imageFileFromClaims(entity, "club")).toBe("Badge.svg");
  });

  it("creates a safely encoded Commons file URL", () => {
    expect(commonsFileUrl("A badge & face.svg", 240)).toContain("A%20badge%20%26%20face.svg?width=240");
  });
});
