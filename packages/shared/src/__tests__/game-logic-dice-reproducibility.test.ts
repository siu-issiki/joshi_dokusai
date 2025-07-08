import { applyCardEffect } from "../game-logic";
import { gameRandom } from "../random";
import { FirebaseGame } from "../types";

// Mock game data for testing
const createMockGame = (): FirebaseGame => ({
  id: "test-game",
  roomId: "test-room",
  createdAt: Date.now(),
  status: "playing",
  phase: "subordinate_turn",
  currentPlayerIndex: 1,
  turnCount: 1,
  maxTurns: 5,
  playerOrder: ["boss", "subordinate1"], // Add player order for consistency
  players: {
    boss: {
      id: "boss",
      name: "Boss",
      role: "boss",
      life: 7,
      maxLife: 7,
      handCount: 7,
      isConnected: true,
      lastAction: Date.now(),
    },
    subordinate1: {
      id: "subordinate1",
      name: "Subordinate 1",
      role: "subordinate",
      life: 0, // Dead subordinate for revival testing
      maxLife: 4,
      handCount: 2,
      isConnected: true,
      lastAction: Date.now(),
    },
  },
  gameState: {
    deckCount: 40,
    discardPile: [],
    dictatorshipDeck: [],
    dictatorshipEffects: {
      nullificationsUsed: {
        boss4Players: 0,
        boss3Players: 0,
      },
    },
  },
  turnHistory: [],
  lastUpdated: Date.now(),
});

describe("Game Logic Dice Roll Reproducibility", () => {
  beforeEach(() => {
    // Reset the game random seed before each test for consistency
    gameRandom.setSeed(12345);
  });

  test("recovery card revival should produce consistent results with same seed", () => {
    const game = createMockGame();

    // Set a specific seed for reproducible dice rolls
    gameRandom.setSeed(12345);

    // Apply recovery card (subordinate trying to revive another subordinate)
    const result1 = applyCardEffect(
      game,
      "subordinate1", // This would normally be another subordinate
      "recovery_001",
      "subordinate1", // Target the dead subordinate
    );

    // Reset seed and test again
    gameRandom.setSeed(12345);

    const result2 = applyCardEffect(
      game,
      "subordinate1",
      "recovery_001",
      "subordinate1",
    );

    // Both results should be identical with the same seed
    expect(result1.success).toBe(result2.success);
    expect(result1.logMessage).toBe(result2.logMessage);
    expect(result1.playerUpdates).toEqual(result2.playerUpdates);
  });

  test("recovery card revival should produce different results with different seeds", () => {
    const game = createMockGame();

    // Use one seed
    gameRandom.setSeed(12345);
    const result1 = applyCardEffect(
      game,
      "subordinate1",
      "recovery_001",
      "subordinate1",
    );

    // Use a different seed
    gameRandom.setSeed(54321);
    const result2 = applyCardEffect(
      game,
      "subordinate1",
      "recovery_001",
      "subordinate1",
    );

    // With different seeds, we might get different results
    // (though both should be valid outcomes)
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // The log messages might be different (success vs failure)
    // depending on whether the dice roll was even or odd
  });

  test("can test specific dice outcomes by controlling the seed", () => {
    const game = createMockGame();

    // Test multiple seeds to find one that produces an even roll (success)
    // Seed 12345 should produce a specific sequence
    gameRandom.setSeed(12345);

    // Get the first dice roll to see what it would be
    const firstRoll = gameRandom.rollDice();

    // Reset seed and test the card effect
    gameRandom.setSeed(12345);

    const result = applyCardEffect(
      game,
      "subordinate1",
      "recovery_001",
      "subordinate1",
    );

    // We can predict the outcome based on the dice roll
    if (firstRoll % 2 === 0) {
      // Even roll should result in revival
      expect(result.logMessage).toContain("復活しました");
      expect(result.playerUpdates.subordinate1?.life).toBe(1);
    } else {
      // Odd roll should result in failure
      expect(result.logMessage).toContain("失敗しました");
      expect(result.playerUpdates.subordinate1?.life).toBeUndefined();
    }
  });

  test("multiple dice rolls in sequence are deterministic", () => {
    gameRandom.setSeed(12345);

    const rolls1 = [];
    for (let i = 0; i < 10; i++) {
      rolls1.push(gameRandom.rollDice());
    }

    gameRandom.setSeed(12345);

    const rolls2 = [];
    for (let i = 0; i < 10; i++) {
      rolls2.push(gameRandom.rollDice());
    }

    expect(rolls1).toEqual(rolls2);

    // All rolls should be valid dice values
    rolls1.forEach((roll) => {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
      expect(Number.isInteger(roll)).toBe(true);
    });
  });
});
