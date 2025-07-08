import { DeckManager, DeckUtils } from "../deck-manager";
import { ALL_WORK_CARDS, DICTATORSHIP_CARDS } from "../card-data";

describe("DeckManager Tests", () => {
  let deckManager: DeckManager;

  beforeEach(() => {
    deckManager = new DeckManager();
  });

  describe("Initialization", () => {
    it("should initialize with full deck", () => {
      const state = deckManager.getDeckState();

      expect(state.workDeckCount).toBe(ALL_WORK_CARDS.length);
      expect(state.dictatorshipDeckCount).toBe(DICTATORSHIP_CARDS.length);
      expect(state.discardPileCount).toBe(0);
    });
  });

  describe("Shuffling", () => {
    it("should shuffle work deck", () => {
      const originalState = deckManager.getDeckState();
      deckManager.shuffleWorkDeck();
      const newState = deckManager.getDeckState();

      // デッキ数は変わらない
      expect(newState.workDeckCount).toBe(originalState.workDeckCount);
    });

    it("should shuffle dictatorship deck", () => {
      const originalState = deckManager.getDeckState();
      deckManager.shuffleDictatorshipDeck();
      const newState = deckManager.getDeckState();

      // デッキ数は変わらない
      expect(newState.dictatorshipDeckCount).toBe(
        originalState.dictatorshipDeckCount,
      );
    });
  });

  describe("Drawing Cards", () => {
    it("should draw work card successfully", () => {
      const card = deckManager.drawWorkCard();

      expect(card).toBeDefined();
      expect(card?.type).toBe("work");

      const state = deckManager.getDeckState();
      expect(state.workDeckCount).toBe(ALL_WORK_CARDS.length - 1);
    });

    it("should draw dictatorship card successfully", () => {
      const card = deckManager.drawDictatorshipCard();

      expect(card).toBeDefined();
      expect(card?.type).toBe("dictatorship");

      const state = deckManager.getDeckState();
      expect(state.dictatorshipDeckCount).toBe(DICTATORSHIP_CARDS.length - 1);
    });

    it("should draw multiple work cards", () => {
      const cards = deckManager.drawWorkCards(5);

      expect(cards).toHaveLength(5);
      cards.forEach((card) => {
        expect(card.type).toBe("work");
      });

      const state = deckManager.getDeckState();
      expect(state.workDeckCount).toBe(ALL_WORK_CARDS.length - 5);
    });

    it("should return null when work deck is empty", () => {
      // 全カードを引く
      while (deckManager.getDeckState().workDeckCount > 0) {
        deckManager.drawWorkCard();
      }

      const card = deckManager.drawWorkCard();
      expect(card).toBeNull();
    });

    it("should return null when dictatorship deck is empty", () => {
      // 全カードを引く
      while (deckManager.getDeckState().dictatorshipDeckCount > 0) {
        deckManager.drawDictatorshipCard();
      }

      const card = deckManager.drawDictatorshipCard();
      expect(card).toBeNull();
    });
  });

  describe("Discard Pile", () => {
    it("should add card to discard pile", () => {
      const card = deckManager.drawWorkCard()!;
      deckManager.discardCard(card);

      const state = deckManager.getDeckState();
      expect(state.discardPileCount).toBe(1);
      expect(state.discardPile[0].id).toBe(card.id);
    });

    it("should add multiple cards to discard pile", () => {
      const cards = deckManager.drawWorkCards(3);
      deckManager.discardCards(cards);

      const state = deckManager.getDeckState();
      expect(state.discardPileCount).toBe(3);
    });

    it("should recycle discard pile when work deck is empty", () => {
      // 全カードを引いて捨てる
      const allCards = [];
      while (deckManager.getDeckState().workDeckCount > 0) {
        const card = deckManager.drawWorkCard()!;
        allCards.push(card);
      }
      deckManager.discardCards(allCards);

      // 捨札からカードを引けるはず
      const newCard = deckManager.drawWorkCard();
      expect(newCard).toBeDefined();
      expect(newCard?.type).toBe("work");
    });
  });

  describe("Initial Hand Dealing", () => {
    it("should deal initial hands correctly", () => {
      const hands = deckManager.dealInitialHands(4);

      expect(Object.keys(hands)).toHaveLength(4);

      // 上司（player_0）は7枚
      expect(hands["player_0"]).toHaveLength(7);

      // 部下（player_1, 2, 3）は2枚ずつ
      expect(hands["player_1"]).toHaveLength(2);
      expect(hands["player_2"]).toHaveLength(2);
      expect(hands["player_3"]).toHaveLength(2);
    });
  });

  describe("Random Dictatorship Card", () => {
    it("should get random dictatorship card", () => {
      const card = deckManager.getRandomDictatorshipCard();

      expect(card).toBeDefined();
      expect(card?.type).toBe("dictatorship");

      // デッキからは削除されない
      const state = deckManager.getDeckState();
      expect(state.dictatorshipDeckCount).toBe(DICTATORSHIP_CARDS.length);
    });

    it("should return null when dictatorship deck is empty", () => {
      // 全カードを引く
      while (deckManager.getDeckState().dictatorshipDeckCount > 0) {
        deckManager.drawDictatorshipCard();
      }

      const card = deckManager.getRandomDictatorshipCard();
      expect(card).toBeNull();
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize correctly", () => {
      // いくつかカードを引いて状態を変更
      deckManager.drawWorkCards(5);
      deckManager.drawDictatorshipCard();
      const drawnCard = deckManager.drawWorkCard()!;
      deckManager.discardCard(drawnCard);

      const serialized = deckManager.serialize();
      const newManager = DeckManager.deserialize(serialized);

      const originalState = deckManager.getDeckState();
      const newState = newManager.getDeckState();

      expect(newState.workDeckCount).toBe(originalState.workDeckCount);
      expect(newState.dictatorshipDeckCount).toBe(
        originalState.dictatorshipDeckCount,
      );
      expect(newState.discardPileCount).toBe(originalState.discardPileCount);
    });
  });

  describe("Reset", () => {
    it("should reset to initial state", () => {
      // 状態を変更
      deckManager.drawWorkCards(10);
      deckManager.drawDictatorshipCard();

      deckManager.reset();

      const state = deckManager.getDeckState();
      expect(state.workDeckCount).toBe(ALL_WORK_CARDS.length);
      expect(state.dictatorshipDeckCount).toBe(DICTATORSHIP_CARDS.length);
      expect(state.discardPileCount).toBe(0);
    });
  });
});

describe("DeckUtils Tests", () => {
  describe("createShuffledDeck", () => {
    it("should create shuffled deck manager", () => {
      const manager = DeckUtils.createShuffledDeck();
      const state = manager.getDeckState();

      expect(state.workDeckCount).toBe(ALL_WORK_CARDS.length);
      expect(state.dictatorshipDeckCount).toBe(DICTATORSHIP_CARDS.length);
    });
  });

  describe("dealInitialHandsForPlayers", () => {
    it("should deal hands for specific player IDs", () => {
      const playerIds = ["boss-1", "sub-1", "sub-2", "sub-3"];
      const hands = DeckUtils.dealInitialHandsForPlayers(playerIds);

      expect(Object.keys(hands)).toHaveLength(4);
      expect(hands["boss-1"]).toHaveLength(7); // 上司
      expect(hands["sub-1"]).toHaveLength(2); // 部下
      expect(hands["sub-2"]).toHaveLength(2); // 部下
      expect(hands["sub-3"]).toHaveLength(2); // 部下
    });
  });

  describe("createInitialGameDeck", () => {
    it("should create initial game deck with hands", () => {
      const playerIds = ["boss-1", "sub-1", "sub-2", "sub-3"];
      const result = DeckUtils.createInitialGameDeck(playerIds);

      expect(result.deckState).toBeDefined();
      expect(result.hands).toBeDefined();
      expect(Object.keys(result.hands)).toHaveLength(4);
    });
  });
});
