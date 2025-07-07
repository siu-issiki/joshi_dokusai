// ゲーム設定定数
export const GAME_CONFIG = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 5,
  BOSS_INITIAL_LIFE: 7,
  SUBORDINATE_INITIAL_LIFE: 4,
  BOSS_INITIAL_HAND_SIZE: 7,
  SUBORDINATE_INITIAL_HAND_SIZE: 2,
  MAX_TURNS: 5,
  NO_OVERTIME_TURN: 3,
  PRESIDENT_CARD_DURATION: 2,
  TOTAL_WORK_CARDS: 50,
  TOTAL_DICTATORSHIP_CARDS: 15,
  NULLIFICATION_LIMIT_3_PLAYERS: 2,
  NULLIFICATION_LIMIT_4_PLAYERS: 1,
} as const;

// 勝利条件
export const VICTORY_CONDITIONS = {
  BOSS_WIN_SUBORDINATES_DOWN: 3,
  SUBORDINATE_WIN_TURNS: 5,
} as const;

// 独裁カードデータ
export interface DictatorshipCard {
  id: string;
  type: 'dictatorship';
  category: 'dictatorship';
  name: string;
  description: string;
  target: 'boss' | 'subordinate' | 'all';
  isVisible: boolean;
}

export const DICTATORSHIP_CARDS: DictatorshipCard[] = [
  {
    id: 'dict_001',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '「サボり」スポット',
    description: '上司のみ、このターン開始時に山札を引かなくても良い。その場合、ライフを2回復する',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_002',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '俺の手柄',
    description: '上司のみ、サイコロを振って4以上なら、山札から社長を上司の場に出す',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_003',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '水も飲まずに',
    description: 'このターン中、ライフを回復した部下に1ダメージを与える',
    target: 'all',
    isVisible: true,
  },
  {
    id: 'dict_004',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '朝まで飲み会',
    description: '上司のターン終了時に、上司と部下全員に1ダメージ',
    target: 'all',
    isVisible: true,
  },
  {
    id: 'dict_005',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '連帯責任',
    description: '上司のみ、攻撃カードでダメージを与えた時、追加で他プレイヤー1人に1ダメージ',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_006',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '横領',
    description: '上司のみ、ターン開始時に1枚多く山札を引く',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_007',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '始末書',
    description: '上司のみ、ライフ1回復 または 部下1人に1ダメージ を選択',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_008',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '担当部署の消失',
    description: '部下のみ、このターン中に使用したカードの効果を2倍にする',
    target: 'subordinate',
    isVisible: true,
  },
  {
    id: 'dict_009',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '有給休暇',
    description: '部下のみ、このターン中はダメージを受けない',
    target: 'subordinate',
    isVisible: true,
  },
  {
    id: 'dict_010',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '現場の責任',
    description: '上司のみ、このターン中に1度だけ受けるダメージを0にできる',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_011',
    type: 'dictatorship',
    category: 'dictatorship',
    name: 'あの人の失言',
    description: '上司のみ、次のターンの独裁カードを無効化する',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_012',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '交戦的な態度',
    description: '上司のみ、このターン中の攻撃カードの効果を無効化する',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_013',
    type: 'dictatorship',
    category: 'dictatorship',
    name: 'たまにはランチ',
    description: '全員、このターン中は回復カードの効果が2倍になる',
    target: 'all',
    isVisible: true,
  },
  {
    id: 'dict_014',
    type: 'dictatorship',
    category: 'dictatorship',
    name: 'ルールは破ろう',
    description: '上司のみ、このターン中に1度だけ、回復カードを使用したときに攻撃カードも1枚追加で使用可能',
    target: 'boss',
    isVisible: true,
  },
  {
    id: 'dict_015',
    type: 'dictatorship',
    category: 'dictatorship',
    name: '上司独裁',
    description: '上司のみ、このターン中に1度だけ攻撃カードで与えるダメージ+100',
    target: 'boss',
    isVisible: true,
  },
];

// ユーティリティ関数
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
