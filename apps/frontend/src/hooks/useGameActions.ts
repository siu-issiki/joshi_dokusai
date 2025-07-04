import { useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, set, runTransaction } from 'firebase/database';
import {
  FirebasePaths,
  handleFirebaseError,
  generateGameId,
  GAME_CONFIG,
  FirebaseGame,
  FirebaseGamePlayer,
  FirebaseRoom,
} from '@joshi-dokusai/shared';
import { useAuth } from '@/lib/auth';

interface UseGameActionsReturn {
  // ゲーム開始
  startGame: (roomId: string) => Promise<string>;

  // カードプレイ（将来のCloud Functions実装用）
  playCard: (
    gameId: string,
    cardId: string,
    targetPlayerId?: string
  ) => Promise<void>;

  // ターン管理
  passTurn: (gameId: string) => Promise<void>;

  // ゲーム終了
  endGame: (
    gameId: string,
    winner: 'boss' | 'subordinate',
    reason: string
  ) => Promise<void>;

  // 状態
  loading: boolean;
  error: string | null;
}

/**
 * ゲームアクション管理フック
 * ゲーム開始、カードプレイ、ターン管理などのアクションを提供
 */
export function useGameActions(): UseGameActionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * ゲーム開始
   * ルームからゲームを作成し、初期状態を設定
   */
  const startGame = async (roomId: string): Promise<string> => {
    if (!user) {
      throw new Error('認証が必要です');
    }

    setLoading(true);
    setError(null);

    try {
      // ルーム情報を取得
      const roomRef = ref(database, FirebasePaths.room(roomId));
      const roomSnapshot = await runTransaction(
        roomRef,
        (room: FirebaseRoom | null) => {
          if (!room) {
            throw new Error('ルームが見つかりません');
          }

          if (room.createdBy !== user.uid) {
            throw new Error('ゲーム開始権限がありません');
          }

          if (room.status !== 'waiting') {
            throw new Error('ゲームは既に開始されています');
          }

          const playerCount = Object.keys(room.players || {}).length;
          if (playerCount < GAME_CONFIG.MIN_PLAYERS) {
            throw new Error(
              `最低${GAME_CONFIG.MIN_PLAYERS}人のプレイヤーが必要です`
            );
          }

          // 全プレイヤーが準備完了かチェック
          const allReady = Object.values(room.players || {}).every(
            (player) => player.isReady
          );
          if (!allReady) {
            throw new Error('全プレイヤーが準備完了していません');
          }

          return room;
        }
      );

      if (!roomSnapshot.committed) {
        throw new Error('ルーム情報の取得に失敗しました');
      }

      const room = roomSnapshot.snapshot.val() as FirebaseRoom;
      const gameId = generateGameId();
      const players = Object.values(room.players);

      // プレイヤーをシャッフルして役割を決定
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

      // ゲーム初期データを作成
      const gameData: FirebaseGame = {
        id: gameId,
        roomId: roomId,
        createdAt: Date.now(),
        status: 'playing',
        phase: 'dictatorship',
        currentPlayerIndex: 0,
        turnCount: 1,
        maxTurns: GAME_CONFIG.MAX_TURNS,
        players: {},
        gameState: {
          deckCount: GAME_CONFIG.TOTAL_WORK_CARDS,
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

      // プレイヤー情報を設定
      shuffledPlayers.forEach((player, index) => {
        const role = index === 0 ? 'boss' : 'subordinate';
        const maxLife =
          role === 'boss'
            ? GAME_CONFIG.BOSS_INITIAL_LIFE
            : GAME_CONFIG.SUBORDINATE_INITIAL_LIFE;

        const gamePlayer: FirebaseGamePlayer = {
          id: player.id,
          name: player.name,
          role,
          life: maxLife,
          maxLife,
          handCount:
            role === 'boss'
              ? GAME_CONFIG.BOSS_INITIAL_HAND_SIZE
              : GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE,
          isConnected: true,
          lastAction: Date.now(),
        };

        gameData.players[player.id] = gamePlayer;
      });

      // データベースに保存
      await set(ref(database, FirebasePaths.game(gameId)), gameData);

      // ルーム状態を更新
      await runTransaction(
        ref(database, FirebasePaths.room(roomId)),
        (room) => {
          if (room) {
            room.status = 'playing';
            room.gameId = gameId;
          }
          return room;
        }
      );

      console.log('ゲーム開始成功:', gameId);
      return gameId;
    } catch (err) {
      console.error('ゲーム開始エラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * カードプレイ（プレースホルダー実装）
   * 将来的にCloud Functionsで実装予定
   */
  const playCard = async (
    gameId: string,
    cardId: string,
    targetPlayerId?: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('認証が必要です');
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Cloud Functionsでの実装
      // 現在はプレースホルダー
      console.log('カードプレイ:', {
        gameId,
        cardId,
        targetPlayerId,
        playerId: user.uid,
      });

      // 一時的な実装（後でCloud Functionsに移行）
      throw new Error('カードプレイ機能は実装中です');
    } catch (err) {
      console.error('カードプレイエラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ターンパス
   */
  const passTurn = async (gameId: string): Promise<void> => {
    if (!user) {
      throw new Error('認証が必要です');
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Cloud Functionsでの実装
      console.log('ターンパス:', { gameId, playerId: user.uid });

      // 一時的な実装
      throw new Error('ターンパス機能は実装中です');
    } catch (err) {
      console.error('ターンパスエラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ゲーム終了
   */
  const endGame = async (
    gameId: string,
    winner: 'boss' | 'subordinate',
    reason: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('認証が必要です');
    }

    setLoading(true);
    setError(null);

    try {
      // ゲーム状態を終了に更新
      await runTransaction(
        ref(database, FirebasePaths.game(gameId)),
        (game) => {
          if (game) {
            game.status = 'ended';
            game.lastUpdated = Date.now();
            // 勝利情報を追加
            game.winner = winner;
            game.endReason = reason;
            game.endedAt = Date.now();
          }
          return game;
        }
      );

      console.log('ゲーム終了:', { gameId, winner, reason });
    } catch (err) {
      console.error('ゲーム終了エラー:', err);
      const { message } = handleFirebaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    startGame,
    playCard,
    passTurn,
    endGame,
    loading,
    error,
  };
}
