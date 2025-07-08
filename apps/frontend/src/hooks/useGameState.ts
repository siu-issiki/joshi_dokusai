import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { FirebaseGame, FirebasePaths } from '@joshi-dokusai/shared';
import { database } from '@/lib/firebase';

/**
 * ゲーム状態管理フック
 * Firebase Realtime Databaseからゲーム状態をリアルタイムで取得・監視する
 */
export function useGameState(gameId: string) {
  const [game, setGame] = useState<FirebaseGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !database) {
      setLoading(false);
      return;
    }

    const gameRef = ref(database, FirebasePaths.game(gameId));

    const unsubscribe = onValue(
      gameRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          setGame(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Game state parsing error:', err);
          setError('ゲーム状態の解析に失敗しました');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Game state error:', error);
        setError('ゲーム状態の取得に失敗しました');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  return { game, loading, error };
}
