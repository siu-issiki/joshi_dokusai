"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerRole = getPlayerRole;
exports.getAliveSubordinatesCount = getAliveSubordinatesCount;
exports.checkBossVictory = checkBossVictory;
exports.checkSubordinateVictory = checkSubordinateVictory;
exports.checkGameEnd = checkGameEnd;
exports.getNextPlayerIndex = getNextPlayerIndex;
exports.canSubmitResignation = canSubmitResignation;
exports.calculateResignationDamage = calculateResignationDamage;
exports.isNoOvertimeDay = isNoOvertimeDay;
exports.getNullificationLimit = getNullificationLimit;
exports.isEvenDiceResult = isEvenDiceResult;
exports.generateId = generateId;
exports.shuffleArray = shuffleArray;
exports.rollDice = rollDice;
const _1 = require("./");
// ゲームユーティリティ関数
/**
 * プレイヤーの役割を判定
 */
function getPlayerRole(playerIndex) {
    return playerIndex === 0 ? 'boss' : 'subordinate';
}
/**
 * 生存している部下の数を取得
 */
function getAliveSubordinatesCount(players) {
    return players.filter(player => player.role === 'subordinate' && player.life > 0).length;
}
/**
 * 上司の勝利条件をチェック
 */
function checkBossVictory(players) {
    const aliveSubordinates = getAliveSubordinatesCount(players);
    return aliveSubordinates <= (players.length - _1.VICTORY_CONDITIONS.BOSS_WIN_SUBORDINATES_DOWN);
}
/**
 * 部下の勝利条件をチェック
 */
function checkSubordinateVictory(gameState) {
    const boss = gameState.players.find(p => p.role === 'boss');
    if (!boss)
        return false;
    // 上司のライフが0
    if (boss.life <= _1.VICTORY_CONDITIONS.SUBORDINATE_WIN_BOSS_LIFE) {
        return true;
    }
    // 5ターン経過
    if (gameState.turnCount >= _1.VICTORY_CONDITIONS.SUBORDINATE_WIN_TURNS) {
        return true;
    }
    return false;
}
/**
 * ゲーム終了条件をチェック
 */
function checkGameEnd(gameState) {
    if (checkBossVictory(gameState.players)) {
        return { isEnded: true, winner: 'boss' };
    }
    if (checkSubordinateVictory(gameState)) {
        return { isEnded: true, winner: 'subordinate' };
    }
    return { isEnded: false };
}
/**
 * 次のプレイヤーのインデックスを取得
 */
function getNextPlayerIndex(currentIndex, players) {
    let nextIndex = (currentIndex + 1) % players.length;
    // 上司（インデックス0）はスキップして部下のターンのみ
    if (nextIndex === 0) {
        nextIndex = 1;
    }
    return nextIndex;
}
/**
 * 辞表提出可能かチェック
 */
function canSubmitResignation(players, playerId) {
    const player = players.find(p => p.id === playerId);
    if (!player || player.role === 'boss' || player.life <= 0) {
        return false;
    }
    const aliveSubordinates = getAliveSubordinatesCount(players);
    return aliveSubordinates <= 3;
}
/**
 * 辞表によるダメージ計算
 */
function calculateResignationDamage(currentLife, maxLife = _1.GAME_CONFIG.SUBORDINATE_INITIAL_LIFE) {
    return maxLife - currentLife;
}
/**
 * ノー残業デーかどうかチェック
 */
function isNoOvertimeDay(turnCount) {
    return turnCount === _1.GAME_CONFIG.NO_OVERTIME_TURN;
}
/**
 * 独裁カード無効化可能回数を取得
 */
function getNullificationLimit(playerCount) {
    return playerCount === 5
        ? _1.GAME_CONFIG.NULLIFICATION_LIMIT_4_PLAYERS
        : _1.GAME_CONFIG.NULLIFICATION_LIMIT_3_PLAYERS;
}
/**
 * サイコロの結果が偶数かチェック
 */
function isEvenDiceResult(diceResult) {
    return diceResult % 2 === 0;
}
/**
 * ランダムなIDを生成
 */
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
/**
 * 配列をシャッフル
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
/**
 * サイコロを振る（1-6）
 */
function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}
//# sourceMappingURL=utils.js.map