import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

/**
 * ゲームアクションフック
 * Firebase Functionsを呼び出すゲームアクション（カードプレイ、ドロー、ターンパス等）を実装
 */
export function useGameActions(gameId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = async (roomId: string) => {
    if (!functions) {
      throw new Error('Firebase Functions が初期化されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const startGameFunction = httpsCallable(functions, 'startGame');
      const result = await startGameFunction({ roomId });
      return result.data;
    } catch (error: any) {
      const errorMessage = error.message || 'ゲーム開始に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const playCard = async (cardId: string, targetPlayerId?: string) => {
    if (!functions) {
      throw new Error('Firebase Functions が初期化されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const playCardFunction = httpsCallable(functions, 'playCard');
      const result = await playCardFunction({
        gameId,
        cardId,
        targetPlayerId,
      });
      return result.data;
    } catch (error: any) {
      const errorMessage = error.message || 'カードの使用に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const drawCard = async () => {
    if (!functions) {
      throw new Error('Firebase Functions が初期化されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const drawCardFunction = httpsCallable(functions, 'drawCard');
      const result = await drawCardFunction({ gameId });
      return result.data;
    } catch (error: any) {
      const errorMessage = error.message || 'カードのドローに失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passTurn = async () => {
    if (!functions) {
      throw new Error('Firebase Functions が初期化されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const passTurnFunction = httpsCallable(functions, 'passTurn');
      const result = await passTurnFunction({ gameId });
      return result.data;
    } catch (error: any) {
      const errorMessage = error.message || 'ターンパスに失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    startGame,
    playCard,
    drawCard,
    passTurn,
    loading,
    error,
  };
}
