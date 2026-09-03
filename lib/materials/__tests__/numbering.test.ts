import { describe, expect, it } from "vitest";

import { itemLabel, numberItems } from "../numbering";

describe("numberItems", () => {
  it("numbers items in order", () => {
    const map = numberItems([{ id: "a" }, { id: "b" }, { id: "c" }]);
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(3);
  });

  it("skips unnumbered items and passes the number to the next", () => {
    const map = numberItems([
      { id: "a" },
      { id: "b", unnumbered: true },
      { id: "c" },
    ]);
    expect(map.get("a")).toBe(1);
    expect(map.has("b")).toBe(false);
    expect(map.get("c")).toBe(2);
  });
});

describe("itemLabel", () => {
  it("builds an M.E label", () => {
    expect(itemLabel(2, 3)).toBe("2.3");
  });

  it("returns null for an unnumbered item", () => {
    expect(itemLabel(2, undefined)).toBeNull();
  });
});
