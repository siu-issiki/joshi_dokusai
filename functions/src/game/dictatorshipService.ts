/**
 * 独裁カードサービス
 */

import { onCall } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import * as logger from 'firebase-functions/logger';

import { GAME_CONFIG } from '@joshi-dokusai/shared';
import { getNextPhase } from '@joshi-dokusai/shared';

/**
 * 独裁フェーズ処理Function（ターン開始時に自動実行）
 */
export const processDictatorshipPhase = onCall(async (request) => {
  const { gameId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error('認証が必要です');
  }

  logger.info('Processing dictatorship phase', { gameId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once('value');
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error('ゲームが見つからないか、参加していません');
    }

    // 独裁フェーズでのみ実行可能
    if (game.phase !== 'dictatorship') {
      throw new Error('独裁フェーズでのみ実行可能です');
    }

    // 既に独裁カードが処理済みの場合はエラー
    if (game.gameState?.dictatorshipEffects?.currentCard) {
      throw new Error('独裁カードは既に処理済みです');
    }

    // 独裁カードデッキから1枚引く（山札の上から）
    const dictatorshipDeck = game.gameState?.dictatorshipDeck || [];
    if (dictatorshipDeck.length === 0) {
      throw new Error('独裁カードデッキが空です');
    }

    // 山札の上から1枚取得
    const drawnCard = dictatorshipDeck[0];
    const remainingDeck = dictatorshipDeck.slice(1);

    // 次のフェーズを計算
    const nextPhase = getNextPhase(game);

    // 独裁カードを場に配置し、デッキを更新し、フェーズを進める
    const updates: any = {
      'gameState/dictatorshipEffects/currentCard': {
        id: drawnCard.id,
        name: drawnCard.name,
        target: drawnCard.target,
        isNullified: false,
      },
      'gameState/dictatorshipDeck': remainingDeck,
      phase: nextPhase, // フェーズを自動的に進める
      lastUpdated: Date.now(),
    };

    await gameRef.update(updates);

    // ゲームログに追加
    const turnAction = {
      turnNumber: game.turnCount,
      phase: game.phase,
      action: {
        type: 'draw-dictatorship',
        cardId: drawnCard.id,
        cardName: drawnCard.name,
        timestamp: Date.now(),
        effectMessage: `独裁カード「${drawnCard.name}」が引かれました。フェーズが${nextPhase}に移行します。`,
      },
    };

    await gameRef.child('turnHistory').push(turnAction);

    logger.info('Dictatorship card drawn and phase advanced', {
      gameId,
      cardName: drawnCard.name,
      nextPhase,
    });

    return { success: true, card: drawnCard, nextPhase };
  } catch (error) {
    logger.error('Error processing dictatorship phase', error);
    throw error;
  }
});

/**
 * 独裁カード無効化Function
 */
export const nullifyDictatorshipCard = onCall(async (request) => {
  const { gameId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error('認証が必要です');
  }

  logger.info('Nullifying dictatorship card', { gameId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once('value');
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error('ゲームが見つからないか、参加していません');
    }

    // 部下のみが無効化可能
    const player = game.players[uid];
    if (player.role !== 'subordinate') {
      throw new Error('部下のみが独裁カードを無効化できます');
    }

    // 現在の独裁カードが存在するかチェック
    if (!game.gameState?.dictatorshipEffects?.currentCard) {
      throw new Error('無効化する独裁カードがありません');
    }

    // 無効化回数の制限チェック（部下陣営全体での制限）
    const playerCount = Object.keys(game.players).length;
    const nullificationsUsed =
      game.gameState.dictatorshipEffects.nullificationsUsed;
    const maxNullifications =
      playerCount === 5
        ? GAME_CONFIG.NULLIFICATION_LIMIT_4_PLAYERS
        : GAME_CONFIG.NULLIFICATION_LIMIT_3_PLAYERS;

    const currentNullifications =
      playerCount === 5
        ? nullificationsUsed.boss4Players
        : nullificationsUsed.boss3Players;

    if (currentNullifications >= maxNullifications) {
      throw new Error('無効化回数の上限に達しています');
    }

    // 独裁カードを無効化
    const updates: any = {
      'gameState/dictatorshipEffects/currentCard/isNullified': true,
      lastUpdated: Date.now(),
    };

    // 無効化回数を増加
    if (playerCount === 5) {
      updates['gameState/dictatorshipEffects/nullificationsUsed/boss4Players'] =
        currentNullifications + 1;
    } else {
      updates['gameState/dictatorshipEffects/nullificationsUsed/boss3Players'] =
        currentNullifications + 1;
    }

    await gameRef.update(updates);

    // ゲームログに追加
    const turnAction = {
      turnNumber: game.turnCount,
      phase: game.phase,
      action: {
        type: 'nullify-dictatorship',
        playerId: uid,
        cardName: game.gameState.dictatorshipEffects.currentCard.name,
        timestamp: Date.now(),
      },
    };

    await gameRef.child('turnHistory').push(turnAction);

    logger.info('Dictatorship card nullified successfully', { gameId, uid });

    return { success: true };
  } catch (error) {
    logger.error('Error nullifying dictatorship card', error);
    throw error;
  }
});

/**
 * 部下相談フェーズ終了Function（部下相談が終了した時に呼ばれる）
 */
export const endSubordinateConsultation = onCall(async (request) => {
  const { gameId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error('認証が必要です');
  }

  logger.info('Ending subordinate consultation', { gameId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once('value');
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error('ゲームが見つからないか、参加していません');
    }

    // 部下相談フェーズでのみ実行可能
    if (game.phase !== 'subordinate_consultation') {
      throw new Error('部下相談フェーズでのみ実行可能です');
    }

    // 部下のみが実行可能
    const player = game.players[uid];
    if (player.role !== 'subordinate') {
      throw new Error('部下のみが相談を終了できます');
    }

    // 次のフェーズを計算
    const nextPhase = getNextPhase(game);

    // フェーズを進める
    const updates: any = {
      phase: nextPhase,
      lastUpdated: Date.now(),
    };

    await gameRef.update(updates);

    // ゲームログに追加
    const turnAction = {
      turnNumber: game.turnCount,
      phase: game.phase,
      action: {
        type: 'end-consultation',
        playerId: uid,
        timestamp: Date.now(),
        effectMessage: `部下の相談が終了し、${nextPhase}に移行しました。`,
      },
    };

    await gameRef.child('turnHistory').push(turnAction);

    logger.info('Subordinate consultation ended and phase advanced', {
      gameId,
      uid,
      nextPhase,
    });

    return { success: true, nextPhase };
  } catch (error) {
    logger.error('Error ending subordinate consultation', error);
    throw error;
  }
});
