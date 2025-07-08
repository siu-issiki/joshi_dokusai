import { ALL_WORK_CARDS, DICTATORSHIP_CARDS, CardUtils } from './card-data';
import { gameRandom } from './random';
import { Card, WorkCard, DictatorshipCard } from './types';
import { shuffleArray } from './utils';

/**
 * デッキ管理クラス
 * カードのシャッフル、配布、ドロー機能を提供
 */
export class DeckManager {
  private workDeck: WorkCard[];
  private dictatorshipDeck: DictatorshipCard[];
  private discardPile: Card[];

  constructor() {
    this.workDeck = [...ALL_WORK_CARDS];
    this.dictatorshipDeck = [...DICTATORSHIP_CARDS];
    this.discardPile = [];
  }

  /**
   * デッキをシャッフル
   */
  shuffleWorkDeck(): void {
    this.workDeck = shuffleArray(this.workDeck);
  }

  shuffleDictatorshipDeck(): void {
    this.dictatorshipDeck = shuffleArray(this.dictatorshipDeck);
  }

  /**
   * 勤務カードをドロー
   */
  drawWorkCard(): WorkCard | null {
    if (this.workDeck.length === 0) {
      // 捨札から勤務カードを回収してシャッフル
      const workCardsInDiscard = this.discardPile.filter((card): card is WorkCard => card.type === 'work');
      if (workCardsInDiscard.length === 0) {
        return null; // カードが尽きた
      }

      this.workDeck = shuffleArray(workCardsInDiscard);
      this.discardPile = this.discardPile.filter((card) => card.type !== 'work');
    }

    return this.workDeck.pop() || null;
  }

  /**
   * 独裁カードをドロー
   */
  drawDictatorshipCard(): DictatorshipCard | null {
    if (this.dictatorshipDeck.length === 0) {
      return null; // 独裁カードは使い切り
    }

    return this.dictatorshipDeck.pop() || null;
  }

  /**
   * 複数の勤務カードをドロー
   */
  drawWorkCards(count: number): WorkCard[] {
    const cards: WorkCard[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.drawWorkCard();
      if (card) {
        cards.push(card);
      } else {
        break; // カードが尽きた
      }
    }
    return cards;
  }

  /**
   * カードを捨札に追加
   */
  discardCard(card: Card): void {
    this.discardPile.push(card);
  }

  /**
   * 複数のカードを捨札に追加
   */
  discardCards(cards: Card[]): void {
    this.discardPile.push(...cards);
  }

  /**
   * 初期手札を配布
   */
  dealInitialHands(playerCount: number): { [playerId: string]: WorkCard[] } {
    this.shuffleWorkDeck();

    const hands: { [playerId: string]: WorkCard[] } = {};

    // プレイヤーIDを生成（実際の実装では外部から受け取る）
    for (let i = 0; i < playerCount; i++) {
      const playerId = `player_${i}`;
      const role = i === 0 ? 'boss' : 'subordinate';
      const handSize = role === 'boss' ? 7 : 2;

      hands[playerId] = this.drawWorkCards(handSize);
    }

    return hands;
  }

  /**
   * ランダムな独裁カードを取得（ターン開始時用）
   */
  getRandomDictatorshipCard(): DictatorshipCard | null {
    if (this.dictatorshipDeck.length === 0) {
      return null;
    }

    return gameRandom.pickRandom(this.dictatorshipDeck);
  }

  /**
   * デッキの状態を取得
   */
  getDeckState() {
    return {
      workDeckCount: this.workDeck.length,
      dictatorshipDeckCount: this.dictatorshipDeck.length,
      discardPileCount: this.discardPile.length,
      discardPile: [...this.discardPile],
    };
  }

  /**
   * デッキの状態をリセット
   */
  reset(): void {
    this.workDeck = [...ALL_WORK_CARDS];
    this.dictatorshipDeck = [...DICTATORSHIP_CARDS];
    this.discardPile = [];
  }

  /**
   * デッキの状態をシリアライズ（Firebase保存用）
   */
  serialize() {
    return {
      workDeck: this.workDeck.map((card) => card.id),
      dictatorshipDeck: this.dictatorshipDeck.map((card) => card.id),
      discardPile: this.discardPile.map((card) => card.id),
    };
  }

  /**
   * シリアライズされた状態からデッキを復元
   */
  static deserialize(serializedData: { workDeck: string[]; dictatorshipDeck: string[]; discardPile: string[] }): DeckManager {
    const manager = new DeckManager();

    manager.workDeck = serializedData.workDeck
      .map((id) => CardUtils.findById(id))
      .filter((card): card is WorkCard => card !== undefined && card.type === 'work');

    manager.dictatorshipDeck = serializedData.dictatorshipDeck
      .map((id) => CardUtils.findById(id))
      .filter((card): card is DictatorshipCard => card !== undefined && card.type === 'dictatorship');

    manager.discardPile = serializedData.discardPile
      .map((id) => CardUtils.findById(id))
      .filter((card): card is WorkCard | DictatorshipCard => card !== undefined);

    return manager;
  }
}

/**
 * デッキマネージャーのユーティリティ関数
 */
export const DeckUtils = {
  /**
   * 新しいデッキマネージャーを作成してシャッフル
   */
  createShuffledDeck(): DeckManager {
    const manager = new DeckManager();
    manager.shuffleWorkDeck();
    manager.shuffleDictatorshipDeck();
    return manager;
  },

  /**
   * プレイヤー数に応じた初期手札を配布
   */
  dealInitialHandsForPlayers(playerIds: string[]): {
    [playerId: string]: WorkCard[];
  } {
    const manager = DeckUtils.createShuffledDeck();
    const hands: { [playerId: string]: WorkCard[] } = {};

    playerIds.forEach((playerId, index) => {
      const role = index === 0 ? 'boss' : 'subordinate';
      const handSize = role === 'boss' ? 7 : 2;
      hands[playerId] = manager.drawWorkCards(handSize);
    });

    return hands;
  },

  /**
   * ゲーム開始時のデッキ状態を作成
   */
  createInitialGameDeck(playerIds: string[]): {
    deckState: ReturnType<DeckManager['serialize']>;
    hands: { [playerId: string]: WorkCard[] };
  } {
    const manager = DeckUtils.createShuffledDeck();

    // プレイヤーIDを使って初期手札を配布
    const hands: { [playerId: string]: WorkCard[] } = {};

    playerIds.forEach((playerId, index) => {
      const role = index === 0 ? 'boss' : 'subordinate';
      const handSize = role === 'boss' ? 7 : 2;
      hands[playerId] = manager.drawWorkCards(handSize);
    });

    return {
      deckState: manager.serialize(),
      hands,
    };
  },
};
