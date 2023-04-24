import { inRange } from "../autnum";

describe("inRange", () => {
  test("returns true when value is within the given range", () => {
    let isInRange: boolean;
    isInRange = inRange(5, "1-10");
    expect(isInRange).toBe(true);

    isInRange = inRange(8, "1-10");
    expect(isInRange).toBe(true);

    isInRange = inRange(83456, "3234-386455");
    expect(isInRange).toBe(true);
  });

  test("returns false when value is outside the given range", () => {
    let isInRange: boolean;
    isInRange = inRange(15, "1-10");
    expect(isInRange).toBe(false);

    isInRange = inRange(-5, "1-10");
    expect(isInRange).toBe(false);

    isInRange = inRange(154398634, "654675475-43218432765");
    expect(isInRange).toBe(false);
  });

  test("no values return true when range is invalid.", () => {
    const range = "10-1";
    let isInRange: boolean;
    for (let i = -10; i < 20; i++) {
      isInRange = inRange(i, range);
      expect(isInRange).toBe(false);
    }
  });
});
