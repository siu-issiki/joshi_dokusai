/**
 * Firebase Cloud Functions for 上司独裁 Game
 */

import { setGlobalOptions } from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { initializeApp } from 'firebase-admin/app';
import * as logger from 'firebase-functions/logger';

// Firebase Admin初期化
initializeApp();

// コスト制御のため最大インスタンス数を制限
setGlobalOptions({ maxInstances: 10 });

/**
 * ゲーム開始Function
 */
export const startGame = onCall(async (request) => {
  const { roomId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error('認証が必要です');
  }

  logger.info('Starting game', { roomId, uid });

  const db = getDatabase();
  const roomRef = db.ref(`rooms/${roomId}`);

  try {
    const roomSnapshot = await roomRef.once('value');
    const room = roomSnapshot.val();

    if (!room || room.createdBy !== uid) {
      throw new Error('ルームが見つからないか、権限がありません');
    }

    if (room.status !== 'waiting') {
      throw new Error('ゲームは既に開始されています');
    }

    // プレイヤー数チェック
    const playerCount = Object.keys(room.players || {}).length;
    if (playerCount < 4 || playerCount > 5) {
      throw new Error('プレイヤー数が不正です（4-5人必要）');
    }

    // ゲームIDを生成
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // プレイヤーの役割を決定（最初のプレイヤーが上司）
    const players = Object.values(room.players);
    const gamePlayersData: Record<string, any> = {};

    players.forEach((player: any, index: number) => {
      gamePlayersData[player.id] = {
        id: player.id,
        name: player.name,
        role: index === 0 ? 'boss' : 'subordinate',
        life: index === 0 ? 7 : 4, // 上司7、部下4
        maxLife: index === 0 ? 7 : 4,
        handCount: index === 0 ? 7 : 2, // 上司7枚、部下2枚
        isConnected: true,
        lastAction: Date.now(),
      };
    });

    // ゲーム状態を作成
    const gameData = {
      id: gameId,
      roomId: roomId,
      createdAt: Date.now(),
      status: 'playing',
      phase: 'dictatorship',
      currentPlayerIndex: 1, // 部下から開始
      turnCount: 1,
      maxTurns: 5,
      players: gamePlayersData,
      gameState: {
        deckCount: 50, // 仮の値
        discardPile: [],
        dictatorshipEffects: {
          nullificationsUsed: {
            boss4Players: 0,
            boss3Players: 0,
          },
        },
      },
      turnHistory: [],
      lastUpdated: Date.now(),
    };

    // ゲームデータを保存
    await db.ref(`games/${gameId}`).set(gameData);

    // ルームステータスを更新
    await roomRef.update({
      status: 'playing',
      gameId: gameId,
    });

    logger.info('Game started successfully', { gameId, roomId });

    return { success: true, gameId };
  } catch (error) {
    logger.error('Error starting game', error);
    throw error;
  }
});

/**
 * カードプレイFunction
 */
export const playCard = onCall(async (request) => {
  const { gameId, cardId, targetPlayerId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error('認証が必要です');
  }

  logger.info('Playing card', { gameId, cardId, targetPlayerId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once('value');
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error('ゲームが見つからないか、参加していません');
    }

    // プレイヤー手札取得
    const handRef = db.ref(`playerHands/${gameId}/${uid}`);
    const handSnapshot = await handRef.once('value');
    const hand = handSnapshot.val();

    if (!hand || !hand.cards.find((card: any) => card.id === cardId)) {
      throw new Error('指定されたカードが手札にありません');
    }

    // 基本的な検証（詳細なゲームロジックは後で実装）
    const currentPlayer = Object.values(game.players)[game.currentPlayerIndex];
    if ((currentPlayer as any).id !== uid) {
      throw new Error('あなたのターンではありません');
    }

    // カードを手札から削除
    const updatedCards = hand.cards.filter((card: any) => card.id !== cardId);
    await handRef.update({ cards: updatedCards, lastUpdated: Date.now() });

    // ゲームログに追加
    const turnAction = {
      turnNumber: game.turnCount,
      phase: game.phase,
      action: {
        type: 'play-card',
        playerId: uid,
        cardId: cardId,
        targetPlayerId: targetPlayerId,
        timestamp: Date.now(),
      },
    };

    await gameRef.child('turnHistory').push(turnAction);
    await gameRef.update({ lastUpdated: Date.now() });

    logger.info('Card played successfully', { gameId, cardId, uid });

    return { success: true };
  } catch (error) {
    logger.error('Error playing card', error);
    throw error;
  }
});

/**
 * カードドローFunction
 */
export const drawCard = onCall(async (request) => {
  const { gameId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error('認証が必要です');
  }

  logger.info('Drawing card', { gameId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once('value');
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error('ゲームが見つからないか、参加していません');
    }

    // 基本的な検証
    const currentPlayer = Object.values(game.players)[game.currentPlayerIndex];
    if ((currentPlayer as any).id !== uid) {
      throw new Error('あなたのターンではありません');
    }

    // 仮のカードデータ（実際のカードデータは後で実装）
    const newCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'work',
      category: 'attack',
      name: 'サンプルカード',
      description: 'サンプルの説明',
      isVisible: false,
    };

    // プレイヤー手札に追加
    const handRef = db.ref(`playerHands/${gameId}/${uid}`);
    const handSnapshot = await handRef.once('value');
    const hand = handSnapshot.val() || { cards: [] };

    const updatedCards = [...hand.cards, newCard];
    await handRef.set({ cards: updatedCards, lastUpdated: Date.now() });

    // デッキ数を減らす
    await gameRef.child('gameState/deckCount').transaction((count) => {
      return Math.max(0, (count || 50) - 1);
    });

    logger.info('Card drawn successfully', { gameId, uid });

    return { success: true, card: newCard };
  } catch (error) {
    logger.error('Error drawing card', error);
    throw error;
  }
});

/**
 * ターンパスFunction
 */
export const passTurn = onCall(async (request) => {
  const { gameId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error('認証が必要です');
  }

  logger.info('Passing turn', { gameId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once('value');
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error('ゲームが見つからないか、参加していません');
    }

    // 基本的な検証
    const currentPlayer = Object.values(game.players)[game.currentPlayerIndex];
    if ((currentPlayer as any).id !== uid) {
      throw new Error('あなたのターンではありません');
    }

    // 次のプレイヤーインデックスを計算
    const playerIds = Object.keys(game.players);
    let nextPlayerIndex = (game.currentPlayerIndex + 1) % playerIds.length;

    // 上司（インデックス0）をスキップして部下のターンのみ
    if (nextPlayerIndex === 0) {
      nextPlayerIndex = 1;
    }

    // ターン更新
    const updates: any = {
      currentPlayerIndex: nextPlayerIndex,
      lastUpdated: Date.now(),
    };

    // 全部下のターンが終わったらターン数を増加
    if (nextPlayerIndex === 1) {
      updates.turnCount = game.turnCount + 1;

      // 最大ターン数に達したらゲーム終了
      if (game.turnCount + 1 > game.maxTurns) {
        updates.status = 'ended';
        updates.phase = 'turn_end';
      }
    }

    await gameRef.update(updates);

    // ゲームログに追加
    const turnAction = {
      turnNumber: game.turnCount,
      phase: game.phase,
      action: {
        type: 'pass-turn',
        playerId: uid,
        timestamp: Date.now(),
      },
    };

    await gameRef.child('turnHistory').push(turnAction);

    logger.info('Turn passed successfully', { gameId, uid, nextPlayerIndex });

    return { success: true, nextPlayerIndex };
  } catch (error) {
    logger.error('Error passing turn', error);
    throw error;
  }
});
