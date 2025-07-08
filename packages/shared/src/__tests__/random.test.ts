import { SeededRandom, gameRandom, NonDeterministicRandom } from "../random";

describe("SeededRandom", () => {
  test("should produce consistent results with the same seed", () => {
    const random1 = new SeededRandom(12345);
    const random2 = new SeededRandom(12345);

    const results1 = [];
    const results2 = [];

    for (let i = 0; i < 10; i++) {
      results1.push(random1.next());
      results2.push(random2.next());
    }

    expect(results1).toEqual(results2);
  });

  test("should produce different results with different seeds", () => {
    const random1 = new SeededRandom(12345);
    const random2 = new SeededRandom(54321);

    const results1 = [];
    const results2 = [];

    for (let i = 0; i < 10; i++) {
      results1.push(random1.next());
      results2.push(random2.next());
    }

    expect(results1).not.toEqual(results2);
  });

  test("rollDice should return values between 1 and 6", () => {
    const random = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const roll = random.rollDice();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
      expect(Number.isInteger(roll)).toBe(true);
    }
  });

  test("shuffle should consistently shuffle with same seed", () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const random1 = new SeededRandom(12345);
    const random2 = new SeededRandom(12345);

    const shuffled1 = random1.shuffle(array);
    const shuffled2 = random2.shuffle(array);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1).toHaveLength(array.length);
    expect(shuffled1.sort()).toEqual(array.sort());
  });

  test("pickRandom should consistently pick the same element with same seed", () => {
    const array = ["a", "b", "c", "d", "e"];

    const random1 = new SeededRandom(12345);
    const random2 = new SeededRandom(12345);

    const picked1 = random1.pickRandom(array);
    const picked2 = random2.pickRandom(array);

    expect(picked1).toBe(picked2);
    expect(array).toContain(picked1);
  });

  test("nextInt should return values in the specified range", () => {
    const random = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const value = random.nextInt(5, 15);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(15);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe("NonDeterministicRandom", () => {
  test("should generate unique game IDs", () => {
    const id1 = NonDeterministicRandom.generateGameId();
    const id2 = NonDeterministicRandom.generateGameId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^game_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^game_\d+_[a-z0-9]+$/);
  });

  test("should generate unique player IDs", () => {
    const id1 = NonDeterministicRandom.generatePlayerId();
    const id2 = NonDeterministicRandom.generatePlayerId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^player_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^player_\d+_[a-z0-9]+$/);
  });

  test("should generate UUID-like strings", () => {
    const uuid1 = NonDeterministicRandom.generateUUID();
    const uuid2 = NonDeterministicRandom.generateUUID();

    expect(uuid1).not.toBe(uuid2);
    expect(typeof uuid1).toBe("string");
    expect(uuid1.length).toBeGreaterThan(10);
  });
});

describe("gameRandom global instance", () => {
  test("should be initialized and functional", () => {
    const originalSeed = gameRandom.getSeed();

    // Test basic functionality
    const value = gameRandom.next();
    expect(typeof value).toBe("number");
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);

    // Test seed setting
    gameRandom.setSeed(12345);
    const value1 = gameRandom.next();

    gameRandom.setSeed(12345);
    const value2 = gameRandom.next();

    expect(value1).toBe(value2);

    // Restore original seed
    gameRandom.setSeed(originalSeed);
  });
});
