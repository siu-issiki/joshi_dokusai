import { WorkCard, DictatorshipCard } from "./types";
import { gameRandom } from "./random";

// 勤務カードデータ定義

// 攻撃カード（22枚）
export const ATTACK_CARDS: WorkCard[] = Array.from(
  { length: 22 },
  (_, index) => ({
    id: `attack_${String(index + 1).padStart(3, "0")}`,
    type: "work",
    category: "attack",
    name: "攻撃",
    description:
      "部下：自身のライフを-1して上司に1ダメージ / 上司：部下1人に2ダメージ",
    isVisible: false,
  }),
);

// 防御カード（11枚）
export const DEFENSE_CARDS: WorkCard[] = Array.from(
  { length: 11 },
  (_, index) => ({
    id: `defense_${String(index + 1).padStart(3, "0")}`,
    type: "work",
    category: "defense",
    name: "防御",
    description:
      "部下：場に出してターン中ダメージ1軽減、または手札から直接使用でダメージ1軽減 / 上司：手札から直接使用でダメージ1軽減",
    isVisible: false,
  }),
);

// 回復カード（10枚）
export const RECOVERY_CARDS: WorkCard[] = Array.from(
  { length: 10 },
  (_, index) => ({
    id: `recovery_${String(index + 1).padStart(3, "0")}`,
    type: "work",
    category: "recovery",
    name: "回復",
    description:
      "部下：部下陣営1人のライフ1回復、またはライフ0時にサイコロ偶数で復活 / 上司：自身のライフを2回復（最大7まで）",
    isVisible: false,
  }),
);

// 社長カード（7枚）
export const PRESIDENT_CARDS: WorkCard[] = Array.from(
  { length: 7 },
  (_, index) => ({
    id: `president_${String(index + 1).padStart(3, "0")}`,
    type: "work",
    category: "president",
    name: "社長",
    description:
      "自陣営の場に配置。ターン終了時に1ダメージまたは1回復を選択。2ターン後に捨札。場に1枚まで。",
    isVisible: false,
  }),
);

// 独裁カード（15枚）
export const DICTATORSHIP_CARDS: DictatorshipCard[] = [
  {
    id: "dict_001",
    type: "dictatorship",
    category: "dictatorship",
    name: "「サボり」スポット",
    description:
      "上司のみ、このターン開始時に山札を引かなくても良い。その場合、ライフを2回復する",
    target: "boss",
    isVisible: true,
  },
  {
    id: "dict_002",
    type: "dictatorship",
    category: "dictatorship",
    name: "俺の手柄",
    description:
      "上司のみ、サイコロを振って4以上なら、山札から社長を上司の場に出す",
    target: "boss",
    isVisible: true,
  },
  {
    id: "dict_003",
    type: "dictatorship",
    category: "dictatorship",
    name: "水も飲まずに",
    description: "このターン中、ライフを回復した部下に1ダメージを与える",
    target: "all",
    isVisible: true,
  },
  {
    id: "dict_004",
    type: "dictatorship",
    category: "dictatorship",
    name: "朝まで飲み会",
    description: "上司のターン終了時に、上司と部下全員に1ダメージ",
    target: "all",
    isVisible: true,
  },
  {
    id: "dict_005",
    type: "dictatorship",
    category: "dictatorship",
    name: "連帯責任",
    description:
      "上司のみ、上司のターン中に一度だけ、攻撃カードでダメージを与えた時、他のプレイヤー1人に1ダメージを与える",
    target: "boss",
    isVisible: true,
  },
  {
    id: "dict_006",
    type: "dictatorship",
    category: "dictatorship",
    name: "横領",
    description: "上司のみ、上司のターン開始時に1枚多く山札を引く",
    target: "boss",
    isVisible: true,
  },
  {
    id: "dict_007",
    type: "dictatorship",
    category: "dictatorship",
    name: "始末書",
    description:
      "上司は以下の効果からどちらかを選ぶ：1.上司のライフを1回復する 2.部下1人に1ダメージ",
    target: "boss",
    isVisible: true,
  },
  {
    id: "dict_008",
    type: "dictatorship",
    category: "dictatorship",
    name: "担当部署の消失",
    description: "このターン中部下は防御カードを使用できない",
    target: "all",
    isVisible: true,
  },
  {
    id: "dict_009",
    type: "dictatorship",
    category: "dictatorship",
    name: "有給休暇",
    description:
      "このターン中、ライフを回復したプレイヤーは手札を1枚選んで捨てる",
    target: "all",
    isVisible: true,
  },
  {
    id: "dict_010",
    type: "dictatorship",
    category: "dictatorship",
    name: "現場の責任",
    description: "上司のみ、このターン中に1度だけ受けるダメージを0にできる",
    target: "boss",
    isVisible: true,
  },
  {
    id: "dict_011",
    type: "dictatorship",
    category: "dictatorship",
    name: "あの人の失言",
    description: "場に出ている社長を捨札に置く",
    target: "all",
    isVisible: true,
  },
  {
    id: "dict_012",
    type: "dictatorship",
    category: "dictatorship",
    name: "交戦的な態度",
    description:
      "このターン中、各陣営が最初に攻撃カードを使用した時、与えるダメージ+1",
    target: "all",
    isVisible: true,
  },
  {
    id: "dict_013",
    type: "dictatorship",
    category: "dictatorship",
    name: "たまにはランチ",
    description:
      "社長が捨札にある場合、サイコロを振る。偶数なら上司の場に社長を出す、奇数なら部下の場に社長を出す",
    target: "all",
    isVisible: true,
  },
  {
    id: "dict_014",
    type: "dictatorship",
    category: "dictatorship",
    name: "ルールは破ろう",
    description:
      "上司のみ、このターン中に1度だけ、回復カードを使用したときに攻撃カードも1枚追加で使用できる",
    target: "boss",
    isVisible: true,
  },
  {
    id: "dict_015",
    type: "dictatorship",
    category: "dictatorship",
    name: "上司独裁",
    description:
      "上司のみ、このターン中に1度だけ攻撃カードで与えるダメージ+100",
    target: "boss",
    isVisible: true,
  },
];

// 全カードデータ
export const ALL_WORK_CARDS: WorkCard[] = [
  ...ATTACK_CARDS,
  ...DEFENSE_CARDS,
  ...RECOVERY_CARDS,
  ...PRESIDENT_CARDS,
];

export const ALL_CARDS = [...ALL_WORK_CARDS, ...DICTATORSHIP_CARDS];

// カード検索ユーティリティ
export const CardUtils = {
  // IDでカードを検索
  findById: (id: string) => ALL_CARDS.find((card) => card.id === id),

  // カテゴリでフィルタ
  filterByCategory: (category: string) =>
    ALL_WORK_CARDS.filter((card) => card.category === category),

  // 独裁カードを取得
  getDictatorshipCards: () => DICTATORSHIP_CARDS,

  // 勤務カードを取得
  getWorkCards: () => ALL_WORK_CARDS,

  // ランダムな独裁カードを取得
  getRandomDictatorshipCard: () => {
    return gameRandom.pickRandom(DICTATORSHIP_CARDS);
  },

  // デッキをシャッフル
  shuffleDeck: (cards: WorkCard[]) => {
    return gameRandom.shuffle(cards);
  },

  // 初期デッキを作成
  createInitialDeck: () => CardUtils.shuffleDeck([...ALL_WORK_CARDS]),

  // カード効果の対象を判定
  getCardTargets: (
    card: DictatorshipCard,
    playerRole: "boss" | "subordinate",
  ) => {
    switch (card.target) {
      case "boss":
        return playerRole === "boss";
      case "subordinate":
        return playerRole === "subordinate";
      case "all":
        return true;
      default:
        return false;
    }
  },
} as const;
