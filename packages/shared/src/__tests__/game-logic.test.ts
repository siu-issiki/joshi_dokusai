import {
  validateCardPlay,
  applyCardEffect,
  checkFirebaseGameEnd,
  getNextFirebasePlayerIndex,
  getNextPhase,
  getCurrentPlayer,
} from "../game-logic";
import { FirebaseGame } from "../types";

// テスト用のモックゲームデータ
const createMockGame = (
  overrides: Partial<FirebaseGame> = {},
): FirebaseGame => {
  const defaultGame: FirebaseGame = {
    id: "test-game",
    roomId: "test-room",
    createdAt: Date.now(),
    status: "playing",
    phase: "subordinate_turn",
    currentPlayerIndex: 1,
    turnCount: 1,
    maxTurns: 5,
    playerOrder: ["boss-1", "sub-1", "sub-2", "sub-3"], // Add player order for consistency
    players: {
      "boss-1": {
        id: "boss-1",
        name: "上司",
        role: "boss",
        life: 7,
        maxLife: 7,
        handCount: 5,
        isConnected: true,
        lastAction: Date.now(),
      },
      "sub-1": {
        id: "sub-1",
        name: "部下1",
        role: "subordinate",
        life: 4,
        maxLife: 4,
        handCount: 3,
        isConnected: true,
        lastAction: Date.now(),
      },
      "sub-2": {
        id: "sub-2",
        name: "部下2",
        role: "subordinate",
        life: 4,
        maxLife: 4,
        handCount: 3,
        isConnected: true,
        lastAction: Date.now(),
      },
      "sub-3": {
        id: "sub-3",
        name: "部下3",
        role: "subordinate",
        life: 4,
        maxLife: 4,
        handCount: 3,
        isConnected: true,
        lastAction: Date.now(),
      },
    },
    gameState: {
      deckCount: 40,
      discardPile: [],
      dictatorshipDeck: [], // 必須プロパティを追加
      dictatorshipEffects: {
        nullificationsUsed: {
          boss4Players: 0,
          boss3Players: 0,
        },
      },
    },
    turnHistory: [],
    lastUpdated: Date.now(),
  };

  return { ...defaultGame, ...overrides };
};

describe("Game Logic Tests", () => {
  describe("getCurrentPlayer", () => {
    it("should return the current player correctly", () => {
      const game = createMockGame();
      const currentPlayer = getCurrentPlayer(game);

      expect(currentPlayer).toBeDefined();
      expect(currentPlayer?.id).toBe("sub-1");
      expect(currentPlayer?.role).toBe("subordinate");
    });

    it("should return null for invalid player index", () => {
      const game = createMockGame({ currentPlayerIndex: 10 });
      const currentPlayer = getCurrentPlayer(game);

      expect(currentPlayer).toBeNull();
    });
  });

  describe("validateCardPlay", () => {
    it("should validate successful card play", () => {
      const game = createMockGame();
      const validation = validateCardPlay(game, "sub-1", "attack_001");

      expect(validation.isValid).toBe(false); // ターゲットが必要
      expect(validation.requiredTarget).toBe(true);
    });

    it("should validate attack card with target", () => {
      const game = createMockGame();
      const validation = validateCardPlay(
        game,
        "sub-1",
        "attack_001",
        "boss-1",
      );

      expect(validation.isValid).toBe(true);
    });

    it("should reject play when not player turn", () => {
      const game = createMockGame();
      const validation = validateCardPlay(
        game,
        "sub-2",
        "attack_001",
        "boss-1",
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("ターンではありません");
    });

    it("should reject attack on same faction", () => {
      const game = createMockGame();
      const validation = validateCardPlay(game, "sub-1", "attack_001", "sub-2");

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain("同じ陣営は攻撃できません");
    });
  });

  describe("applyCardEffect", () => {
    it("should apply attack card effect for subordinate", () => {
      const game = createMockGame();
      const result = applyCardEffect(game, "sub-1", "attack_001", "boss-1");

      expect(result.success).toBe(true);
      expect(result.playerUpdates["sub-1"]?.life).toBe(3); // 自分のライフ-1
      expect(result.playerUpdates["boss-1"]?.life).toBe(6); // 上司に1ダメージ
      expect(result.logMessage).toContain("1ダメージを与えました");
    });

    it("should apply attack card effect for boss", () => {
      const game = createMockGame({ currentPlayerIndex: 0 });
      const result = applyCardEffect(game, "boss-1", "attack_001", "sub-1");

      expect(result.success).toBe(true);
      expect(result.playerUpdates["sub-1"]?.life).toBe(2); // 部下に2ダメージ
      expect(result.logMessage).toContain("2ダメージを与えました");
    });

    it("should apply recovery card effect", () => {
      const game = createMockGame({
        players: {
          ...createMockGame().players,
          "sub-1": {
            ...createMockGame().players["sub-1"],
            life: 2, // ダメージを受けた状態
          },
        },
      });

      const result = applyCardEffect(game, "sub-1", "recovery_001", "sub-1");

      expect(result.success).toBe(true);
      expect(result.playerUpdates["sub-1"]?.life).toBe(3); // 1回復
      expect(result.logMessage).toContain("回復しました");
    });
  });

  describe("checkFirebaseGameEnd", () => {
    it("should detect boss victory when 3+ subordinates are down", () => {
      const game = createMockGame({
        players: {
          ...createMockGame().players,
          "sub-1": { ...createMockGame().players["sub-1"], life: 0 },
          "sub-2": { ...createMockGame().players["sub-2"], life: 0 },
          "sub-3": { ...createMockGame().players["sub-3"], life: 0 },
        },
      });

      const result = checkFirebaseGameEnd(game);

      expect(result.isGameEnd).toBe(true);
      expect(result.winner).toBe("boss");
      expect(result.reason).toContain("部下3人以上がライフ0");
    });

    it("should detect subordinate victory when boss life is 0", () => {
      const game = createMockGame({
        players: {
          ...createMockGame().players,
          "boss-1": { ...createMockGame().players["boss-1"], life: 0 },
        },
      });

      const result = checkFirebaseGameEnd(game);

      expect(result.isGameEnd).toBe(true);
      expect(result.winner).toBe("subordinate");
      expect(result.reason).toContain("上司のライフが0");
    });

    it("should detect subordinate victory after 5 turns", () => {
      const game = createMockGame({ turnCount: 5 });

      const result = checkFirebaseGameEnd(game);

      expect(result.isGameEnd).toBe(true);
      expect(result.winner).toBe("subordinate");
      expect(result.reason).toContain("5ターンが経過");
    });

    it("should not end game in normal conditions", () => {
      const game = createMockGame();

      const result = checkFirebaseGameEnd(game);

      expect(result.isGameEnd).toBe(false);
    });
  });

  describe("getNextFirebasePlayerIndex", () => {
    it("should calculate next player index correctly", () => {
      const game = createMockGame({ currentPlayerIndex: 1 });
      const nextIndex = getNextFirebasePlayerIndex(game);

      expect(nextIndex).toBe(2);
    });

    it("should wrap around to first player", () => {
      const game = createMockGame({ currentPlayerIndex: 3 });
      const nextIndex = getNextFirebasePlayerIndex(game);

      expect(nextIndex).toBe(0);
    });
  });

  describe("getNextPhase", () => {
    it("should transition from dictatorship to subordinate_consultation", () => {
      const game = createMockGame({ phase: "dictatorship" });
      const nextPhase = getNextPhase(game);

      expect(nextPhase).toBe("subordinate_consultation");
    });

    it("should transition from subordinate_consultation to subordinate_turn", () => {
      const game = createMockGame({ phase: "subordinate_consultation" });
      const nextPhase = getNextPhase(game);

      expect(nextPhase).toBe("subordinate_turn");
    });

    it("should stay in subordinate_turn until last subordinate", () => {
      const game = createMockGame({
        phase: "subordinate_turn",
        currentPlayerIndex: 1, // 最初の部下
      });
      const nextPhase = getNextPhase(game);

      expect(nextPhase).toBe("subordinate_turn");
    });

    it("should transition to boss_turn after last subordinate", () => {
      const game = createMockGame({
        phase: "subordinate_turn",
        currentPlayerIndex: 3, // 最後の部下
      });
      const nextPhase = getNextPhase(game);

      expect(nextPhase).toBe("boss_turn");
    });

    it("should transition from boss_turn to turn_end", () => {
      const game = createMockGame({ phase: "boss_turn" });
      const nextPhase = getNextPhase(game);

      expect(nextPhase).toBe("turn_end");
    });

    it("should transition from turn_end to dictatorship", () => {
      const game = createMockGame({ phase: "turn_end" });
      const nextPhase = getNextPhase(game);

      expect(nextPhase).toBe("dictatorship");
    });
  });
});
