/**
 * カードプレイサービス
 */

import { onCall } from "firebase-functions/v2/https";
import { getDatabase } from "firebase-admin/database";
import * as logger from "firebase-functions/logger";

import {
  validateCardPlay,
  applyCardEffect,
  checkFirebaseGameEnd,
  CardUtils,
  shuffleArray,
  getCurrentPlayer,
  type Card,
  type FirebaseGamePlayer,
} from "@joshi-dokusai/shared";

/**
 * カードプレイFunction
 */
export const playCard = onCall(async (request) => {
  const { gameId, cardId, targetPlayerId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error("認証が必要です");
  }

  logger.info("Playing card", { gameId, cardId, targetPlayerId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once("value");
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error("ゲームが見つからないか、参加していません");
    }

    // プレイヤー手札取得
    const handRef = db.ref(`games/${gameId}/playerHands/${uid}`);
    const handSnapshot = await handRef.once("value");
    const hand = handSnapshot.val();

    // hand.cardsが配列でない場合のフォールバック
    const currentCards = hand && Array.isArray(hand.cards) ? hand.cards : [];

    if (!hand || !currentCards.find((card: Card) => card.id === cardId)) {
      throw new Error("指定されたカードが手札にありません");
    }

    // カードプレイの妥当性検証
    const validation = validateCardPlay(game, uid, cardId, targetPlayerId);
    if (!validation.isValid) {
      throw new Error(validation.error || "カードプレイが無効です");
    }

    // カード効果を適用
    const effectResult = applyCardEffect(game, uid, cardId, targetPlayerId);
    if (!effectResult.success) {
      throw new Error(effectResult.error || "カード効果の適用に失敗しました");
    }

    // カードを手札から削除
    const updatedCards = currentCards.filter(
      (card: Card) => card.id !== cardId,
    );
    await handRef.update({ cards: updatedCards, lastUpdated: Date.now() });

    // カードを捨札に追加
    const discardPileRef = gameRef.child("gameState/discardPile");
    const discardPileSnapshot = await discardPileRef.once("value");
    const currentDiscardPile = discardPileSnapshot.val() || [];

    await discardPileRef.set([...currentDiscardPile, cardId]);

    // プレイヤー状態を更新
    if (Object.keys(effectResult.playerUpdates).length > 0) {
      const playerUpdatePromises = Object.entries(
        effectResult.playerUpdates,
      ).map(([playerId, updates]) => {
        return gameRef
          .child(`players/${playerId}`)
          .update(updates as Partial<FirebaseGamePlayer>);
      });
      await Promise.all(playerUpdatePromises);
    }

    // ゲーム状態を更新
    if (
      effectResult.gameStateUpdates &&
      Object.keys(effectResult.gameStateUpdates).length > 0
    ) {
      await gameRef.child("gameState").update(effectResult.gameStateUpdates);
    }

    // ゲーム終了条件をチェック
    const updatedGameSnapshot = await gameRef.once("value");
    const updatedGame = updatedGameSnapshot.val();
    const gameEndCheck = checkFirebaseGameEnd(updatedGame);

    if (gameEndCheck.isGameEnd) {
      await gameRef.update({
        status: "ended",
        winner: gameEndCheck.winner,
        endReason: gameEndCheck.reason,
        lastUpdated: Date.now(),
      });
    }

    // ゲームログに追加
    const turnAction = {
      turnNumber: game.turnCount,
      phase: game.phase,
      action: {
        type: "play-card",
        playerId: uid,
        cardId: cardId,
        targetPlayerId: targetPlayerId,
        effectMessage: effectResult.logMessage,
        timestamp: Date.now(),
      },
    };

    await gameRef.child("turnHistory").push(turnAction);
    await gameRef.update({ lastUpdated: Date.now() });

    logger.info("Card played successfully", { gameId, cardId, uid });

    return { success: true };
  } catch (error) {
    logger.error("Error playing card", error);
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
    throw new Error("認証が必要です");
  }

  logger.info("Drawing card", { gameId, uid });

  const db = getDatabase();

  try {
    // ゲーム状態取得
    const gameRef = db.ref(`games/${gameId}`);
    const gameSnapshot = await gameRef.once("value");
    const game = gameSnapshot.val();

    if (!game || !game.players[uid]) {
      throw new Error("ゲームが見つからないか、参加していません");
    }

    // 基本的な検証
    const currentPlayer = getCurrentPlayer(game);
    if (!currentPlayer || currentPlayer.id !== uid) {
      throw new Error("あなたのターンではありません");
    }

    // デッキからカードをドロー
    const workCardsDeckRef = gameRef.child("gameState/workCardsDeck");
    const discardPileRef = gameRef.child("gameState/discardPile");

    const workCardsDeckSnapshot = await workCardsDeckRef.once("value");
    const discardPileSnapshot = await discardPileRef.once("value");

    let workCardsDeck = workCardsDeckSnapshot.val() || [];
    const discardPile = discardPileSnapshot.val() || [];

    // デッキが空の場合、捨札から勤務カードを回収
    if (workCardsDeck.length === 0) {
      const workCardsInDiscard = discardPile.filter((cardId: string) => {
        const card = CardUtils.findById(cardId);
        return card && card.type === "work";
      });

      if (workCardsInDiscard.length === 0) {
        throw new Error("ドローできるカードがありません");
      }

      // 捨札をシャッフルしてデッキに戻す
      workCardsDeck = shuffleArray(workCardsInDiscard);
      const remainingDiscard = discardPile.filter((cardId: string) => {
        const card = CardUtils.findById(cardId);
        return card && card.type !== "work";
      });

      await discardPileRef.set(remainingDiscard);
    }

    if (workCardsDeck.length === 0) {
      throw new Error("ドローできるカードがありません");
    }

    // カードをドロー
    const drawnCardId = workCardsDeck.pop();

    if (!drawnCardId) {
      throw new Error("ドローできるカードがありません");
    }

    // カードIDから実際のカードデータを取得
    const drawnCard = CardUtils.findById(drawnCardId);
    if (!drawnCard) {
      throw new Error(`カードが見つかりません: ${drawnCardId}`);
    }

    // プレイヤー手札に追加
    const handRef = db.ref(`games/${gameId}/playerHands/${uid}`);
    const handSnapshot = await handRef.once("value");
    const hand = handSnapshot.val() || { cards: [] };

    // hand.cardsが配列でない場合のフォールバック
    const currentCards = Array.isArray(hand.cards) ? hand.cards : [];
    const updatedCards = [...currentCards, drawnCard];
    await handRef.set({ cards: updatedCards, lastUpdated: Date.now() });

    // デッキ状態を更新
    await workCardsDeckRef.set(workCardsDeck);
    await gameRef.child("gameState/deckCount").set(workCardsDeck.length);

    logger.info("Card drawn successfully", {
      gameId,
      uid,
      cardId: drawnCardId,
    });

    return { success: true, card: drawnCard };
  } catch (error) {
    logger.error("Error drawing card", error);
    throw error;
  }
});
