import { describe, expect, it } from "vitest";
import { HOLES_PER_LEVEL, holeInLevel, levelOf, levelName, getHole } from "@/game/course";

describe("levels", () => {
  it("groups holes into levels of 6", () => {
    expect(HOLES_PER_LEVEL).toBe(6);
  });

  it("finishes a level on every 6th hole", () => {
    expect(levelOf(0)).toBe(0); // hole 1  -> level 1
    expect(levelOf(5)).toBe(0); // hole 6  -> still level 1
    expect(levelOf(6)).toBe(1); // hole 7  -> level 2 starts
    expect(levelOf(11)).toBe(1); // hole 12 -> still level 2
    expect(levelOf(12)).toBe(2); // hole 13 -> level 3 starts
  });

  it("numbers holes 1..6 inside a level", () => {
    expect(holeInLevel(0)).toBe(0);
    expect(holeInLevel(5)).toBe(5);
    expect(holeInLevel(6)).toBe(0);
    expect(holeInLevel(11)).toBe(5);
  });

  it("numbers levels instead of naming them", () => {
    expect(levelName(0)).toBe("Level 1");
    expect(levelName(1)).toBe("Level 2");
    expect(levelName(12)).toBe("Level 13");
  });

  it("gives every hole in a level a playable par", () => {
    for (let k = 0; k < HOLES_PER_LEVEL; k++) {
      const h = getHole(6 + k); // level 2
      expect(h.par).toBeGreaterThanOrEqual(2);
      expect(h.par).toBeLessThanOrEqual(6);
    }
  });
});
