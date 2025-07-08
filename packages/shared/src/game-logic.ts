import { CardUtils } from './card-data';
import { GAME_CONFIG, VICTORY_CONDITIONS } from './constants';
import { gameRandom } from './random';
import { FirebaseGame, FirebaseGamePlayer, FirebaseGameState } from './types';

/**
 * ゲームロジック関連のユーティリティ関数
 */

// カードプレイの妥当性検証
export interface CardPlayValidation {
  isValid: boolean;
  error?: string;
  requiredTarget?: boolean;
}

/**
 * カードプレイの妥当性を検証
 */
export function validateCardPlay(game: FirebaseGame, playerId: string, cardId: string, targetPlayerId?: string): CardPlayValidation {
  const player = game.players[playerId];
  if (!player) {
    return { isValid: false, error: 'プレイヤーが見つかりません' };
  }

  // プレイヤーのターンかチェック
  const currentPlayer = getCurrentPlayer(game);
  if (!currentPlayer || currentPlayer.id !== playerId) {
    return { isValid: false, error: 'あなたのターンではありません' };
  }

  // カードの存在確認
  const card = CardUtils.findById(cardId);
  if (!card) {
    return { isValid: false, error: 'カードが見つかりません' };
  }

  // 攻撃カードの場合、ターゲットが必要
  if (card.category === 'attack' && !targetPlayerId) {
    return {
      isValid: false,
      error: 'ターゲットを選択してください',
      requiredTarget: true,
    };
  }

  // ターゲットの妥当性チェック
  if (targetPlayerId) {
    const targetPlayer = game.players[targetPlayerId];
    if (!targetPlayer) {
      return { isValid: false, error: 'ターゲットプレイヤーが見つかりません' };
    }

    // 攻撃カードの場合、敵対陣営のみターゲット可能
    if (card.category === 'attack') {
      if (player.role === targetPlayer.role) {
        return { isValid: false, error: '同じ陣営は攻撃できません' };
      }
    }

    // 回復カードの場合、同じ陣営のみターゲット可能
    if (card.category === 'recovery' && targetPlayerId !== playerId) {
      if (player.role !== targetPlayer.role) {
        return { isValid: false, error: '敵対陣営は回復できません' };
      }
    }
  }

  return { isValid: true };
}

/**
 * 現在のプレイヤーを取得
 */
export function getCurrentPlayer(game: FirebaseGame): FirebaseGamePlayer | null {
  // Use stored playerOrder for consistent indexing instead of Object.keys()
  const playerIds = game.playerOrder || Object.keys(game.players);
  const currentPlayerId = playerIds[game.currentPlayerIndex];
  return currentPlayerId ? game.players[currentPlayerId] : null;
}

/**
 * カード効果を適用
 */
export interface CardEffectResult {
  success: boolean;
  playerUpdates: Record<string, Partial<FirebaseGamePlayer>>;
  gameStateUpdates: Partial<FirebaseGameState>;
  logMessage: string;
  error?: string;
}

export function applyCardEffect(game: FirebaseGame, playerId: string, cardId: string, targetPlayerId?: string): CardEffectResult {
  const card = CardUtils.findById(cardId);
  const player = game.players[playerId];

  if (!card || !player) {
    return {
      success: false,
      playerUpdates: {},
      gameStateUpdates: {},
      logMessage: '',
      error: 'カードまたはプレイヤーが見つかりません',
    };
  }

  switch (card.category) {
    case 'attack':
      return applyAttackCard(game, player, targetPlayerId);

    case 'defense':
      return applyDefenseCard(game, player);

    case 'recovery':
      return applyRecoveryCard(game, player, targetPlayerId);

    case 'president':
      return applyPresidentCard(game, player);

    default:
      return {
        success: false,
        playerUpdates: {},
        gameStateUpdates: {},
        logMessage: '',
        error: '未対応のカードタイプです',
      };
  }
}

/**
 * 攻撃カード効果適用
 */
function applyAttackCard(game: FirebaseGame, player: FirebaseGamePlayer, targetPlayerId?: string): CardEffectResult {
  if (!targetPlayerId) {
    return {
      success: false,
      playerUpdates: {},
      gameStateUpdates: {},
      logMessage: '',
      error: 'ターゲットが指定されていません',
    };
  }

  const targetPlayer = game.players[targetPlayerId];
  if (!targetPlayer) {
    return {
      success: false,
      playerUpdates: {},
      gameStateUpdates: {},
      logMessage: '',
      error: 'ターゲットプレイヤーが見つかりません',
    };
  }

  const playerUpdates: Record<string, Partial<FirebaseGamePlayer>> = {};

  if (player.role === 'subordinate') {
    // 部下：自身のライフを-1して上司に1ダメージ
    playerUpdates[player.id] = {
      life: Math.max(0, player.life - 1),
    };
    playerUpdates[targetPlayerId] = {
      life: Math.max(0, targetPlayer.life - 1),
    };

    return {
      success: true,
      playerUpdates,
      gameStateUpdates: {},
      logMessage: `${player.name}が自身のライフを1消費して${targetPlayer.name}に1ダメージを与えました`,
    };
  } else {
    // 上司：部下1人に2ダメージ
    playerUpdates[targetPlayerId] = {
      life: Math.max(0, targetPlayer.life - 2),
    };

    return {
      success: true,
      playerUpdates,
      gameStateUpdates: {},
      logMessage: `${player.name}が${targetPlayer.name}に2ダメージを与えました`,
    };
  }
}

/**
 * 防御カード効果適用
 */
function applyDefenseCard(game: FirebaseGame, player: FirebaseGamePlayer): CardEffectResult {
  // 防御カードは場に出すか、直接使用でダメージ軽減
  // 今回は簡単な実装として、次のダメージを1軽減する効果を付与

  return {
    success: true,
    playerUpdates: {},
    gameStateUpdates: {
      defenseEffects: {
        ...(game.gameState.defenseEffects || {}),
        [player.id]: (game.gameState.defenseEffects?.[player.id] || 0) + 1,
      },
    },
    logMessage: `${player.name}が防御カードを使用しました（次のダメージを1軽減）`,
  };
}

/**
 * 回復カード効果適用
 */
function applyRecoveryCard(game: FirebaseGame, player: FirebaseGamePlayer, targetPlayerId?: string): CardEffectResult {
  const targetId = targetPlayerId || player.id;
  const targetPlayer = game.players[targetId];

  if (!targetPlayer) {
    return {
      success: false,
      playerUpdates: {},
      gameStateUpdates: {},
      logMessage: '',
      error: 'ターゲットプレイヤーが見つかりません',
    };
  }

  const playerUpdates: Record<string, Partial<FirebaseGamePlayer>> = {};

  if (player.role === 'subordinate') {
    // 部下：部下陣営1人のライフ1回復、またはライフ0時にサイコロ偶数で復活
    if (targetPlayer.life === 0) {
      // 復活判定（サイコロ）
      const diceRoll = gameRandom.rollDice();
      if (diceRoll % 2 === 0) {
        playerUpdates[targetId] = { life: 1 };
        return {
          success: true,
          playerUpdates,
          gameStateUpdates: {},
          logMessage: `${player.name}の回復カードで${targetPlayer.name}が復活しました（サイコロ: ${diceRoll}）`,
        };
      } else {
        return {
          success: true,
          playerUpdates: {},
          gameStateUpdates: {},
          logMessage: `${player.name}の回復カードでの復活に失敗しました（サイコロ: ${diceRoll}）`,
        };
      }
    } else {
      // 通常回復
      playerUpdates[targetId] = {
        life: Math.min(targetPlayer.maxLife, targetPlayer.life + 1),
      };
      return {
        success: true,
        playerUpdates,
        gameStateUpdates: {},
        logMessage: `${player.name}が${targetPlayer.name}のライフを1回復しました`,
      };
    }
  } else {
    // 上司：自身のライフを2回復（最大7まで）
    playerUpdates[player.id] = {
      life: Math.min(GAME_CONFIG.BOSS_INITIAL_LIFE, player.life + 2),
    };

    return {
      success: true,
      playerUpdates,
      gameStateUpdates: {},
      logMessage: `${player.name}が自身のライフを2回復しました`,
    };
  }
}

/**
 * 社長カード効果適用
 */
function applyPresidentCard(game: FirebaseGame, player: FirebaseGamePlayer): CardEffectResult {
  // 社長カードは場に配置される
  // 既に場に社長カードがある場合は使用不可
  if (game.gameState.presidentCard) {
    return {
      success: false,
      playerUpdates: {},
      gameStateUpdates: {},
      logMessage: '',
      error: '場に既に社長カードが配置されています',
    };
  }

  const presidentCard = CardUtils.findById('president_001'); // 仮のID
  if (!presidentCard) {
    return {
      success: false,
      playerUpdates: {},
      gameStateUpdates: {},
      logMessage: '',
      error: '社長カードが見つかりません',
    };
  }

  return {
    success: true,
    playerUpdates: {},
    gameStateUpdates: {
      presidentCard: {
        card: presidentCard,
        owner: player.role,
        turnsRemaining: GAME_CONFIG.PRESIDENT_CARD_DURATION,
        placedAt: Date.now(),
      },
    },
    logMessage: `${player.name}が社長カードを場に配置しました`,
  };
}

/**
 * ゲーム終了条件をチェック
 */
export interface GameEndCheck {
  isGameEnd: boolean;
  winner?: 'boss' | 'subordinate';
  reason?: string;
}

export function checkFirebaseGameEnd(game: FirebaseGame): GameEndCheck {
  const players = Object.values(game.players);
  const bossPlayer = players.find((p) => p.role === 'boss');
  const subordinatePlayers = players.filter((p) => p.role === 'subordinate');

  // 上司のライフが0の場合、部下勝利
  if (bossPlayer && bossPlayer.life <= 0) {
    return {
      isGameEnd: true,
      winner: 'subordinate',
      reason: '上司のライフが0になりました',
    };
  }

  // 部下3人以上がライフ0の場合、上司勝利
  const downSubordinates = subordinatePlayers.filter((p) => p.life <= 0);
  if (downSubordinates.length >= VICTORY_CONDITIONS.BOSS_WIN_SUBORDINATES_DOWN) {
    return {
      isGameEnd: true,
      winner: 'boss',
      reason: '部下3人以上がライフ0になりました',
    };
  }

  // 5ターン経過で部下勝利
  if (game.turnCount >= VICTORY_CONDITIONS.SUBORDINATE_WIN_TURNS) {
    return {
      isGameEnd: true,
      winner: 'subordinate',
      reason: '5ターンが経過しました',
    };
  }

  return { isGameEnd: false };
}

/**
 * 次のプレイヤーインデックスを計算
 */
export function getNextFirebasePlayerIndex(game: FirebaseGame): number {
  const playerCount = Object.keys(game.players).length;
  return (game.currentPlayerIndex + 1) % playerCount;
}

/**
 * 次のフェーズを計算
 */
export function getNextPhase(game: FirebaseGame): FirebaseGame['phase'] {
  const currentPhase = game.phase;

  switch (currentPhase) {
    case 'dictatorship':
      return 'subordinate_consultation';

    case 'subordinate_consultation':
      return 'subordinate_turn';

    case 'subordinate_turn': {
      // 次のプレイヤーの役割をチェックして上司ターンかどうか判定
      const nextPlayerIndex = getNextFirebasePlayerIndex(game);
      const playerIds = game.playerOrder || Object.keys(game.players);
      const nextPlayerId = playerIds[nextPlayerIndex];
      const nextPlayer = nextPlayerId ? game.players[nextPlayerId] : null;

      if (nextPlayer && nextPlayer.role === 'boss') {
        return 'boss_turn';
      }
      return 'subordinate_turn';
    }

    case 'boss_turn':
      return 'turn_end';

    case 'turn_end':
      return 'dictatorship';

    default:
      return 'dictatorship';
  }
}
