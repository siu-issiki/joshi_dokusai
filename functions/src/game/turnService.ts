/**
 * ターン管理サービス
 */

import { onCall } from "firebase-functions/v2/https";
import { getDatabase } from "firebase-admin/database";
import * as logger from "firebase-functions/logger";

import {
  GAME_CONFIG,
  checkFirebaseGameEnd,
  getNextPhase,
  getNextFirebasePlayerIndex,
  getCurrentPlayer,
  FirebaseGame,
} from "@joshi-dokusai/shared";

// ゲーム更新用の型定義
interface GameUpdateData {
  currentPlayerIndex: number;
  phase: FirebaseGame["phase"];
  lastUpdated: number;
  turnCount?: number;
  status?: FirebaseGame["status"];
  winner?: FirebaseGame["winner"];
  endReason?: string;
  // Firebase nested path updates用
  // 例: "gameState/dictatorshipEffects/currentCard"
  [key: `gameState/${string}`]: unknown;
}

/**
 * ターンパスFunction
 */
export const passTurn = onCall(async (request) => {
  const { gameId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error("認証が必要です");
  }

  logger.info("Passing turn", { gameId, uid });

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

    // 次のプレイヤーインデックスとフェーズを計算
    const nextPlayerIndex = getNextFirebasePlayerIndex(game);
    const nextPhase = getNextPhase(game);

    // ターン更新
    const updates: GameUpdateData = {
      currentPlayerIndex: nextPlayerIndex,
      phase: nextPhase as FirebaseGame["phase"],
      lastUpdated: Date.now(),
    };

    // フェーズが独裁フェーズに戻った場合、ターン数を増加
    if (nextPhase === "dictatorship" && game.phase !== "dictatorship") {
      updates.turnCount = game.turnCount + 1;

      // 新しいターンが始まるので独裁カードの状態をクリア
      updates["gameState/dictatorshipEffects/currentCard"] = null;

      // 最大ターン数に達したかチェック
      if (game.turnCount + 1 > GAME_CONFIG.MAX_TURNS) {
        updates.status = "ended";
        updates.phase = "turn_end";
      }
    }

    // ゲーム終了条件をチェック
    const gameEndCheck = checkFirebaseGameEnd(game);
    if (gameEndCheck.isGameEnd) {
      updates.status = "ended";
      updates.winner = gameEndCheck.winner;
      updates.endReason = gameEndCheck.reason;
    }

    await gameRef.update(updates);

    // ゲームログに追加
    const turnAction = {
      turnNumber: game.turnCount,
      phase: game.phase,
      action: {
        type: "pass-turn",
        playerId: uid,
        timestamp: Date.now(),
      },
    };

    await gameRef.child("turnHistory").push(turnAction);

    logger.info("Turn passed successfully", { gameId, uid, nextPlayerIndex });

    return { success: true, nextPlayerIndex };
  } catch (error) {
    logger.error("Error passing turn", error);
    throw error;
  }
});
