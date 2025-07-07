/**
 * ゲーム開始サービス
 */

import {onCall} from "firebase-functions/v2/https";
import {getDatabase} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";

import {GAME_CONFIG, CardUtils} from "@joshi-dokusai/shared";

import {createInitialDeck, drawCardFromDeck} from "../utils/deckUtils";
import {DICTATORSHIP_CARDS} from "../shared-constants";

/**
 * ゲーム開始Function
 */
export const startGame = onCall(async (request) => {
  const {roomId} = request.data;
  const uid = request.auth?.uid;

  if (!uid) {
    throw new Error("認証が必要です");
  }

  logger.info("Starting game", {roomId, uid});

  const db = getDatabase();
  const roomRef = db.ref(`rooms/${roomId}`);

  try {
    const roomSnapshot = await roomRef.once("value");
    const room = roomSnapshot.val();

    if (!room || room.createdBy !== uid) {
      throw new Error("ルームが見つからないか、権限がありません");
    }

    if (room.status !== "waiting") {
      throw new Error("ゲームは既に開始されています");
    }

    // プレイヤー数チェック
    const playerCount = Object.keys(room.players || {}).length;
    if (
      playerCount < GAME_CONFIG.MIN_PLAYERS ||
      playerCount > GAME_CONFIG.MAX_PLAYERS
    ) {
      throw new Error(
        `プレイヤー数が不正です（${GAME_CONFIG.MIN_PLAYERS}-${GAME_CONFIG.MAX_PLAYERS}人必要）`
      );
    }

    // ゲームIDを生成
    const gameId = `game_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    // プレイヤーの役割を決定（入室順で最初のプレイヤーが上司）
    const players = (Object.values(room.players) as any[]).sort(
      (a: any, b: any) => a.joinedAt - b.joinedAt
    );
    const gamePlayersData: Record<string, any> = {};

    players.forEach((player: any, index: number) => {
      const role = index === 0 ? "boss" : "subordinate";

      logger.info("Processing player:", {player, index, role});

      // 必要なプロパティのみを明示的に設定
      gamePlayersData[player.id] = {
        id: String(player.id),
        name: String(player.name || `プレイヤー${index + 1}`),
        role: role,
        life:
          role === "boss" ?
            GAME_CONFIG.BOSS_INITIAL_LIFE :
            GAME_CONFIG.SUBORDINATE_INITIAL_LIFE,
        maxLife:
          role === "boss" ?
            GAME_CONFIG.BOSS_INITIAL_LIFE :
            GAME_CONFIG.SUBORDINATE_INITIAL_LIFE,
        handCount:
          role === "boss" ?
            GAME_CONFIG.BOSS_INITIAL_HAND_SIZE :
            GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE,
        isConnected: true,
        lastAction: Date.now(),
      };
    });

    logger.info("Final game players data:", {gamePlayersData});

    // 初期デッキを作成
    const initialDeck = createInitialDeck();

    // 独裁カードデッキを作成（カードオブジェクトの配列）
    const dictatorshipDeck = initialDeck.dictatorshipCards.map((cardId) => {
      const card = DICTATORSHIP_CARDS.find((c) => c.id === cardId);
      if (!card) {
        throw new Error(`独裁カード「${cardId}」が見つかりません`);
      }
      return card;
    });

    // ゲーム状態を作成
    const gameData = {
      id: gameId,
      roomId: roomId,
      createdAt: Date.now(),
      status: "playing",
      phase: "dictatorship",
      currentPlayerIndex: 1, // 部下から開始
      turnCount: 1,
      maxTurns: GAME_CONFIG.MAX_TURNS,
      players: gamePlayersData,
      gameState: {
        deckCount: initialDeck.workCards.length,
        discardPile: [],
        dictatorshipDeck: dictatorshipDeck,
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

    // 実際のデッキからの初期手札配布
    let currentDeck = initialDeck;
    const handPromises = players.map(async (player: any, index: number) => {
      const role = index === 0 ? "boss" : "subordinate";
      const handSize =
        role === "boss" ?
          GAME_CONFIG.BOSS_INITIAL_HAND_SIZE :
          GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE;

      // デッキからカードをドロー
      const drawnCardIds: string[] = [];
      for (let i = 0; i < handSize; i++) {
        const {card, updatedDeck} = drawCardFromDeck(currentDeck);
        if (card) {
          drawnCardIds.push(card);
          currentDeck = updatedDeck;
        }
      }

      // カードIDから実際のカードデータを取得
      const initialCards = drawnCardIds.map((cardId) => {
        const card = CardUtils.findById(cardId);
        if (!card) {
          throw new Error(`Card not found: ${cardId}`);
        }
        return card;
      });

      const handData = {
        cards: initialCards,
        lastUpdated: Date.now(),
      };

      await db.ref(`games/${gameId}/playerHands/${player.id}`).set(handData);
    });

    await Promise.all(handPromises);

    // 手札配布後のworkCardsデッキ状態を更新
    await db
      .ref(`games/${gameId}/gameState/deckCount`)
      .set(currentDeck.workCards.length);
    // workCardsデッキ自体も保存（カードドロー用）
    await db
      .ref(`games/${gameId}/gameState/workCardsDeck`)
      .set(currentDeck.workCards);

    // ルームステータスを更新
    await roomRef.update({
      status: "playing",
      gameId: gameId,
    });

    logger.info("Game started successfully", {gameId, roomId});

    return {success: true, gameId};
  } catch (error) {
    logger.error("Error starting game", error);
    throw error;
  }
});
