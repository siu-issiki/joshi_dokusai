import { Player, GameState } from './';
/**
 * プレイヤーの役割を判定
 */
export declare function getPlayerRole(playerIndex: number): 'boss' | 'subordinate';
/**
 * 生存している部下の数を取得
 */
export declare function getAliveSubordinatesCount(players: Player[]): number;
/**
 * 上司の勝利条件をチェック
 */
export declare function checkBossVictory(players: Player[]): boolean;
/**
 * 部下の勝利条件をチェック
 */
export declare function checkSubordinateVictory(gameState: GameState): boolean;
/**
 * ゲーム終了条件をチェック
 */
export declare function checkGameEnd(gameState: GameState): {
    isEnded: boolean;
    winner?: 'boss' | 'subordinate';
};
/**
 * 次のプレイヤーのインデックスを取得
 */
export declare function getNextPlayerIndex(currentIndex: number, players: Player[]): number;
/**
 * 辞表提出可能かチェック
 */
export declare function canSubmitResignation(players: Player[], playerId: string): boolean;
/**
 * 辞表によるダメージ計算
 */
export declare function calculateResignationDamage(currentLife: number, maxLife?: number): number;
/**
 * ノー残業デーかどうかチェック
 */
export declare function isNoOvertimeDay(turnCount: number): boolean;
/**
 * 独裁カード無効化可能回数を取得
 */
export declare function getNullificationLimit(playerCount: number): number;
/**
 * サイコロの結果が偶数かチェック
 */
export declare function isEvenDiceResult(diceResult: number): boolean;
/**
 * ランダムなIDを生成
 */
export declare function generateId(): string;
/**
 * 配列をシャッフル
 */
export declare function shuffleArray<T>(array: T[]): T[];
/**
 * サイコロを振る（1-6）
 */
export declare function rollDice(): number;
//# sourceMappingURL=utils.d.ts.map