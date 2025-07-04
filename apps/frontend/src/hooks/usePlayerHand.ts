import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import {
  FirebasePlayerHand,
  FirebasePaths,
  handleFirebaseError,
  Card,
} from '@joshi-dokusai/shared';
import { useAuth } from '@/lib/auth';

interface UsePlayerHandReturn {
  hand: FirebasePlayerHand | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  // ヘルパー関数
  getCardById: (cardId: string) => Card | null;
  hasCard: (cardId: string) => boolean;
  canPlayCard: (cardId: string) => boolean;
}

/**
 * プレイヤー手札管理フック
 * 現在のユーザーの手札をリアルタイムで監視する
 */
export function usePlayerHand(gameId: string | null): UsePlayerHandReturn {
  const [hand, setHand] = useState<FirebasePlayerHand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!gameId || !user) {
      setHand(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const handRef = ref(database, FirebasePaths.playerHand(gameId, user.uid));

    const unsubscribe = onValue(
      handRef,
      (snapshot) => {
        try {
          const data = snapshot.val();

          if (data) {
            // データ正規化
            const normalizedHand: FirebasePlayerHand = {
              cards: data.cards || [],
              lastUpdated: data.lastUpdated || Date.now(),
            };

            setHand(normalizedHand);
          } else {
            // 手札データが存在しない場合（ゲーム開始前など）
            setHand({
              cards: [],
              lastUpdated: Date.now(),
            });
          }

          setLoading(false);
          setConnected(true);
        } catch (err) {
          console.error('Player hand parsing error:', err);
          const { message } = handleFirebaseError(err);
          setError(`手札情報の解析に失敗しました: ${message}`);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Player hand error:', err);
        const { message } = handleFirebaseError(err);
        setError(`手札情報の取得に失敗しました: ${message}`);
        setLoading(false);
        setConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [gameId, user]);

  // 接続状態の監視を別のuseEffectで分離
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    const connectionUnsubscribe = onValue(connectedRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      setConnected(isConnected);

      if (!isConnected) {
        setError('接続が切断されました。再接続を試行中...');
      } else {
        // 接続復旧時は接続エラーのみクリア
        setError((prev) =>
          prev === '接続が切断されました。再接続を試行中...' ? null : prev
        );
      }
    });

    return () => {
      connectionUnsubscribe();
    };
  }, []);

  // ヘルパー関数
  const getCardById = (cardId: string): Card | null => {
    if (!hand) return null;
    return hand.cards.find((card) => card.id === cardId) || null;
  };

  const hasCard = (cardId: string): boolean => {
    return getCardById(cardId) !== null;
  };

  const canPlayCard = (cardId: string): boolean => {
    const card = getCardById(cardId);
    if (!card) return false;

    // 基本的な使用可能性チェック
    // より詳細なルールチェックは後で実装
    return true;
  };

  return {
    hand,
    loading,
    error,
    connected,
    getCardById,
    hasCard,
    canPlayCard,
  };
}

/**
 * 手札統計情報を取得するヘルパーフック
 */
export function useHandStats(hand: FirebasePlayerHand | null) {
  if (!hand) {
    return {
      totalCards: 0,
      attackCards: 0,
      defenseCards: 0,
      healCards: 0,
      specialCards: 0,
    };
  }

  const stats = hand.cards.reduce(
    (acc, card) => {
      acc.totalCards++;

      switch (card.category) {
        case 'attack':
          acc.attackCards++;
          break;
        case 'defense':
          acc.defenseCards++;
          break;
        case 'recovery':
          acc.healCards++;
          break;
        case 'president':
        case 'dictatorship':
          acc.specialCards++;
          break;
      }

      return acc;
    },
    {
      totalCards: 0,
      attackCards: 0,
      defenseCards: 0,
      healCards: 0,
      specialCards: 0,
    }
  );

  return stats;
}
