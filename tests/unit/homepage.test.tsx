import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("homepage", () => {
  it("renders the title and Start Game control", () => {
    const page = renderToStaticMarkup(<Home />);

    expect(page).toContain("FOOTBALL LINKS");
    expect(page).toContain("Start Game");
  });
});
