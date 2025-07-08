import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'ゲーム開始に失敗しました';
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'カードの使用に失敗しました';
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'カードのドローに失敗しました';
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'ターンパスに失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processDictatorshipPhase = async () => {
    if (!functions) {
      throw new Error('Firebase Functions が初期化されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const processDictatorshipPhaseFunction = httpsCallable(functions, 'processDictatorshipPhase');
      const result = await processDictatorshipPhaseFunction({ gameId });
      return result.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '独裁フェーズ処理に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nullifyDictatorshipCard = async () => {
    if (!functions) {
      throw new Error('Firebase Functions が初期化されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const nullifyDictatorshipCardFunction = httpsCallable(functions, 'nullifyDictatorshipCard');
      const result = await nullifyDictatorshipCardFunction({ gameId });
      return result.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '独裁カード無効化に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const endSubordinateConsultation = async () => {
    if (!functions) {
      throw new Error('Firebase Functions が初期化されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const endSubordinateConsultationFunction = httpsCallable(functions, 'endSubordinateConsultation');
      const result = await endSubordinateConsultationFunction({ gameId });
      return result.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '部下相談の終了に失敗しました';
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
    processDictatorshipPhase,
    nullifyDictatorshipCard,
    endSubordinateConsultation,
    loading,
    error,
  };
}
