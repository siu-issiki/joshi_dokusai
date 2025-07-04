import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { FirebaseGame, FirebasePaths, handleFirebaseError } from '@joshi-dokusai/shared';

interface UseGameStateReturn {
  game: FirebaseGame | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

/**
 * ゲーム状態管理フック
 * 指定されたゲームIDのゲーム状態をリアルタイムで監視する
 */
export function useGameState(gameId: string | null): UseGameStateReturn {
  const [game, setGame] = useState<FirebaseGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const gameRef = ref(database, FirebasePaths.game(gameId));

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          
          if (data) {
            // データ正規化（必要に応じて）
            const normalizedGame: FirebaseGame = {
              ...data,
              players: data.players || {},
              gameState: data.gameState || {
                deckCount: 0,
                discardPile: [],
                dictatorshipEffects: {
                  nullificationsUsed: {
                    boss4Players: 0,
                    boss3Players: 0,
                  },
                },
              },
              turnHistory: data.turnHistory || [],
            };
            
            setGame(normalizedGame);
          } else {
            setGame(null);
            setError('ゲームが見つかりません');
          }
          
          setLoading(false);
          setConnected(true);
        } catch (err) {
          console.error('Game state parsing error:', err);
          const { message } = handleFirebaseError(err);
          setError(`ゲーム状態の解析に失敗しました: ${message}`);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Game state error:', err);
        const { message } = handleFirebaseError(err);
        setError(`ゲーム状態の取得に失敗しました: ${message}`);
        setLoading(false);
        setConnected(false);
      }
    );

    // 接続状態の監視
    const connectedRef = ref(database, '.info/connected');
    const connectionUnsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnected(isConnected);
      
      if (!isConnected) {
        setError('接続が切断されました。再接続を試行中...');
      } else if (error === '接続が切断されました。再接続を試行中...') {
        setError(null);
      }
    });

    return () => {
      off(gameRef, 'value', unsubscribe);
      off(connectedRef, 'value', connectionUnsubscribe);
    };
  }, [gameId, error]);

  return {
    game,
    loading,
    error,
    connected,
  };
}

/**
 * ゲーム状態のヘルパー関数
 */
export function useGameHelpers(game: FirebaseGame | null, userId: string | null) {
  if (!game || !userId) {
    return {
      currentPlayer: null,
      isMyTurn: false,
      myRole: null,
      isGameActive: false,
    };
  }

  const players = Object.values(game.players);
  const currentPlayer = players[game.currentPlayerIndex] || null;
  const myPlayer = game.players[userId] || null;
  const isMyTurn = currentPlayer?.id === userId;
  const myRole = myPlayer?.role || null;
  const isGameActive = game.status === 'playing';

  return {
    currentPlayer,
    isMyTurn,
    myRole,
    isGameActive,
    myPlayer,
    players,
  };
}
