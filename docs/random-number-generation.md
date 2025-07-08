# Random Number Generation System

## Overview

The codebase has been refactored to use a seedable random number generator instead of `Math.random()` for improved testability and consistency in multiplayer scenarios.

## Key Components

### 1. SeededRandom Class (`packages/shared/src/random.ts`)

A Linear Congruential Generator (LCG) that produces reproducible pseudo-random sequences:

```typescript
import { SeededRandom } from '@joshi-dokusai/shared';

const random = new SeededRandom(12345); // Seeded for reproducibility
const diceRoll = random.rollDice(); // Always produces the same result with same seed
```

#### Methods:

- `next()`: Generate a random number between 0 and 1
- `nextInt(min, max)`: Generate random integer in range [min, max)
- `rollDice()`: Generate dice roll (1-6)
- `shuffle(array)`: Shuffle array using Fisher-Yates algorithm
- `pickRandom(array)`: Pick random element from array
- `getSeed()` / `setSeed(seed)`: Get/set the current seed

### 2. Global Game Random Instance

```typescript
import { gameRandom } from '@joshi-dokusai/shared';

// Use for all game logic that requires randomness
const result = gameRandom.rollDice();
```

### 3. Non-Deterministic Random Utilities

For ID generation and other non-game-logic operations:

```typescript
import { NonDeterministicRandom } from '@joshi-dokusai/shared';

const gameId = NonDeterministicRandom.generateGameId();
const playerId = NonDeterministicRandom.generatePlayerId();
```

## Benefits

### 1. Testability

```typescript
// Tests can control randomness for predictable outcomes
gameRandom.setSeed(12345);
const result = applyCardEffect(game, playerId, cardId, targetId);
// Result is now deterministic and testable
```

### 2. Multiplayer Consistency

- Server can control the seed for all game operations
- All clients will see identical results when using the same seed
- Prevents desynchronization issues

### 3. Debugging

- Reproducible bugs can be investigated using the same seed
- Game replays become possible with seed storage

## Migration Summary

The following files were updated to use the new random system:

### Game Logic (Seeded Random)

- `packages/shared/src/game-logic.ts` - Dice rolls for card effects
- `packages/shared/src/utils.ts` - Shuffle and dice utilities
- `packages/shared/src/card-data.ts` - Card shuffling and selection
- `packages/shared/src/deck-manager.ts` - Random card selection
- `functions/src/shared-constants.ts` - Shuffle function

### ID Generation (Non-Deterministic)

- `packages/shared/src/firebase-utils.ts` - Game/player ID generation
- `functions/src/game/gameService.ts` - Game ID generation
- `apps/frontend/src/hooks/useGameNotifications.ts` - Notification IDs

## Usage Guidelines

### For Game Logic

Always use the seeded random generator:

```typescript
import { gameRandom } from '@joshi-dokusai/shared';

// ✅ Good - Deterministic and testable
const diceResult = gameRandom.rollDice();
const shuffledDeck = gameRandom.shuffle(cards);

// ❌ Bad - Non-deterministic
const diceResult = Math.floor(Math.random() * 6) + 1;
```

### For ID Generation

Use non-deterministic utilities:

```typescript
import { NonDeterministicRandom } from '@joshi-dokusai/shared';

// ✅ Good - Unique IDs
const id = NonDeterministicRandom.generateGameId();

// ❌ Bad - Predictable IDs
const id = `game_${gameRandom.nextInt(1000, 9999)}`;
```

### For Server Implementation

Initialize the game random with a server-controlled seed:

```typescript
// When starting a new game
const gameSeed = Date.now(); // Or use a more sophisticated seed
gameRandom.setSeed(gameSeed);

// Store the seed with game data for reproducibility
await db.ref(`games/${gameId}/seed`).set(gameSeed);
```

## Testing

The random system includes comprehensive tests:

- `packages/shared/src/__tests__/random.test.ts` - Core functionality tests
- `packages/shared/src/__tests__/game-logic-dice-reproducibility.test.ts` - Game logic integration tests

Run tests with:

```bash
cd packages/shared
npm test -- random.test.ts
npm test -- game-logic-dice-reproducibility.test.ts
```

## Future Considerations

1. **Seed Distribution**: Consider how to distribute seeds from server to clients
2. **Seed Storage**: Store seeds with game state for replay functionality
3. **Validation**: Add seed validation to prevent tampering
4. **Performance**: Monitor performance impact of LCG vs Math.random()
