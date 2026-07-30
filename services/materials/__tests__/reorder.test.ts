import { describe, expect, it } from "vitest";
import { swapForMove } from "@/services/materials/reorder";

const rows = [
  { id: "a", position: 0 },
  { id: "b", position: 1 },
  { id: "c", position: 2 },
];

describe("swapForMove", () => {
  it("moves middle up: swaps with previous", () => {
    expect(swapForMove(rows, "b", "up")).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
    ]);
  });
  it("moves middle down: swaps with next", () => {
    expect(swapForMove(rows, "b", "down")).toEqual([
      { id: "b", position: 2 },
      { id: "c", position: 1 },
    ]);
  });
  it("no-op moving first up", () => {
    expect(swapForMove(rows, "a", "up")).toEqual([]);
  });
  it("no-op moving last down", () => {
    expect(swapForMove(rows, "c", "down")).toEqual([]);
  });
  it("handles unsorted input", () => {
    const shuffled = [rows[2], rows[0], rows[1]];
    expect(swapForMove(shuffled, "a", "down")).toEqual([
      { id: "a", position: 1 },
      { id: "b", position: 0 },
    ]);
  });
  it("returns [] for unknown id", () => {
    expect(swapForMove(rows, "z", "up")).toEqual([]);
  });
});
