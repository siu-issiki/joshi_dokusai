"use strict";
// ゲーム定数
Object.defineProperty(exports, "__esModule", { value: true });
exports.VICTORY_CONDITIONS = exports.CARD_NAMES = exports.GAME_CONFIG = void 0;
exports.GAME_CONFIG = {
    // プレイヤー設定
    MIN_PLAYERS: 4,
    MAX_PLAYERS: 5,
    BOSS_INITIAL_LIFE: 7,
    SUBORDINATE_INITIAL_LIFE: 4,
    BOSS_INITIAL_HAND_SIZE: 7,
    SUBORDINATE_INITIAL_HAND_SIZE: 2,
    // ターン設定
    MAX_TURNS: 5,
    NO_OVERTIME_TURN: 3, // ノー残業デーが発生するターン
    BOSS_ACTIONS_PER_TURN: 2,
    SUBORDINATE_ACTIONS_PER_TURN: 1,
    // カード構成
    TOTAL_WORK_CARDS: 50,
    ATTACK_CARDS: 22,
    DEFENSE_CARDS: 11,
    RECOVERY_CARDS: 10,
    PRESIDENT_CARDS: 7,
    DICTATORSHIP_CARDS: 15,
    // 社長カード設定
    PRESIDENT_CARD_DURATION: 2, // ターン数
    // 独裁カード無効化回数
    NULLIFICATION_LIMIT_4_PLAYERS: 1,
    NULLIFICATION_LIMIT_3_PLAYERS: 2,
    // ノー残業デー時の手札調整
    NO_OVERTIME_BOSS_HAND_SIZE: 5,
    NO_OVERTIME_SUBORDINATE_HAND_SIZE: 2
};
// カード名定数
exports.CARD_NAMES = {
    // 勤務カード
    ATTACK: '攻撃',
    DEFENSE: '防御',
    RECOVERY: '回復',
    PRESIDENT: '社長',
    // 独裁カード
    SLACKING_SPOT: '「サボり」スポット',
    MY_ACHIEVEMENT: '俺の手柄',
    WITHOUT_DRINKING_WATER: '水も飲まずに',
    MORNING_DRINKING_PARTY: '朝まで飲み会',
    COLLECTIVE_RESPONSIBILITY: '連帯責任',
    EMBEZZLEMENT: '横領',
    WRITTEN_APOLOGY: '始末書',
    DEPARTMENT_DISAPPEARANCE: '担当部署の消失',
    PAID_VACATION: '有給休暇',
    FIELD_RESPONSIBILITY: '現場の責任',
    THAT_PERSONS_SLIP: 'あの人の失言',
    AGGRESSIVE_ATTITUDE: '交戦的な態度',
    OCCASIONAL_LUNCH: 'たまにはランチ',
    BREAK_THE_RULES: 'ルールは破ろう',
    BOSS_DICTATORSHIP: '上司独裁'
};
// 勝利条件
exports.VICTORY_CONDITIONS = {
    BOSS_WIN_SUBORDINATES_DOWN: 3, // 部下3人以上がライフ0で上司勝利
    SUBORDINATE_WIN_BOSS_LIFE: 0, // 上司のライフが0で部下勝利
    SUBORDINATE_WIN_TURNS: 5 // 5ターン経過で部下勝利
};
//# sourceMappingURL=constants.js.map