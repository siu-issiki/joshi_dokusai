/**
 * デッキ管理ユーティリティ
 */

import {
  DICTATORSHIP_CARDS,
  shuffleArray,
  ALL_WORK_CARDS,
  CardUtils,
} from "@joshi-dokusai/shared";

/**
 * デッキ管理ユーティリティ
 */
export interface GameDeck {
  workCards: string[]; // カードIDの配列
  dictatorshipCards: string[]; // 独裁カードIDの配列
  discardPile: string[]; // 捨札のカードID配列
}

/**
 * 初期デッキを作成
 * @return {GameDeck} 初期デッキ
 */
export function createInitialDeck(): GameDeck {
  // 勤務カードをシャッフル
  const workCards = shuffleArray([...ALL_WORK_CARDS.map((card) => card.id)]);

  // 独裁カードをシャッフル
  const dictatorshipCards = shuffleArray([
    ...DICTATORSHIP_CARDS.map((card) => card.id),
  ]);

  return {
    workCards,
    dictatorshipCards,
    discardPile: [],
  };
}

/**
 * デッキからカードをドロー
 * @param {GameDeck} deck - ゲームデッキ
 * @return {object} ドローしたカードと更新されたデッキ
 */
export function drawCardFromDeck(deck: GameDeck): {
  card: string | null;
  updatedDeck: GameDeck;
} {
  if (deck.workCards.length === 0) {
    // 捨札から勤務カードを回収してシャッフル
    const workCardsInDiscard = deck.discardPile.filter((cardId) => {
      const card = CardUtils.findById(cardId);
      return card && card.type === "work";
    });

    if (workCardsInDiscard.length === 0) {
      return {card: null, updatedDeck: deck}; // カードが尽きた
    }

    const shuffledWorkCards = shuffleArray(workCardsInDiscard);
    const remainingDiscard = deck.discardPile.filter((cardId) => {
      const card = CardUtils.findById(cardId);
      return card && card.type !== "work";
    });

    const updatedDeck = {
      ...deck,
      workCards: shuffledWorkCards,
      discardPile: remainingDiscard,
    };

    const drawnCard = updatedDeck.workCards.pop() || null;
    return {card: drawnCard, updatedDeck};
  }

  const updatedDeck = {...deck};
  const drawnCard = updatedDeck.workCards.pop() || null;
  return {card: drawnCard, updatedDeck};
}

/**
 * カードを捨札に追加
 * @param {GameDeck} deck - ゲームデッキ
 * @param {string} cardId - 捨札に追加するカードID
 * @return {GameDeck} 更新されたデッキ
 */
export function addToDiscardPile(deck: GameDeck, cardId: string): GameDeck {
  return {
    ...deck,
    discardPile: [...deck.discardPile, cardId],
  };
}
