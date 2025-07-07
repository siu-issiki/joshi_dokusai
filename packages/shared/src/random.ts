/**
 * Seedable random number generator for game logic
 * Uses a simple Linear Congruential Generator (LCG) for reproducible results
 */
export class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  /**
   * Generate a random number between 0 and 1 (exclusive)
   */
  next(): number {
    // Linear Congruential Generator parameters (same as used in Java)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x80000000;
  }

  /**
   * Generate a random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Generate a dice roll (1-6)
   */
  rollDice(): number {
    return this.nextInt(1, 7);
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm with seeded randomness
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Pick a random element from an array
   */
  pickRandom<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  /**
   * Get the current seed value
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Set a new seed value
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }
}

/**
 * Default instance for game logic
 * Should be initialized with a server-provided seed for multiplayer consistency
 */
export const gameRandom = new SeededRandom();

/**
 * Utility functions for non-deterministic operations (like ID generation)
 */
export const NonDeterministicRandom = {
  /**
   * Generate a game ID
   */
  generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  },

  /**
   * Generate a player ID
   */
  generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  },

  /**
   * Generate a UUID-like string
   */
  generateUUID(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  },

  /**
   * Generate a notification ID
   */
  generateNotificationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  },
};
