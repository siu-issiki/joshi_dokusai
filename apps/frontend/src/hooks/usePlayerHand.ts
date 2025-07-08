import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';
import { FirebasePlayerHand, FirebasePaths } from '@joshi-dokusai/shared';
import { database, auth } from '@/lib/firebase';

/**
 * プレイヤー手札管理フック
 * Firebase Realtime Databaseからプレイヤーの手札情報をリアルタイムで取得・監視する
 */
export function usePlayerHand(gameId: string) {
  const [hand, setHand] = useState<FirebasePlayerHand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId || !database || !auth?.currentUser) {
      setLoading(false);
      return;
    }

    const handRef = ref(database, FirebasePaths.playerHand(gameId, auth.currentUser.uid));

    const unsubscribe = onValue(
      handRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          console.log('usePlayerHand Debug:', {
            gameId,
            playerId: auth?.currentUser?.uid,
            path: FirebasePaths.playerHand(gameId, auth?.currentUser?.uid || ''),
            data,
            exists: snapshot.exists(),
          });
          setHand(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Player hand parsing error:', err);
          setError('手札情報の解析に失敗しました');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Player hand error:', error);
        setError('手札情報の取得に失敗しました');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  return { hand, loading, error };
}
